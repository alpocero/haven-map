const imgWidth  = 5760;
const imgHeight = 4480;

// Объявлены здесь (а не рядом с местом использования/заполнения) намеренно:
// popup-слои провинций/фракций строятся синхронно ниже, ещё до loadMarkers(),
// и renderDescription()/iconForDescLink() могут обратиться к allMarkerRows и
// LOCATION_ICONS уже на этом этапе (если в описании провинции/фракции есть
// ссылка на локацию) — объявление после точки использования кидало бы
// ReferenceError (TDZ у let/const).
let allMarkerRows = [];  // сырые строки из Supabase (нужны админке для формы/подсказок и иконкам ссылок)
let markerRowById = new Map();  // тот же набор, но для O(1)-поиска по id (см. iconForDescLink)

const LOCATION_ICONS = {
	'town':		       	   { url: 'images/icons/town.png',			     size: [28, 28] },
	'city':       	   	   { url: 'images/icons/city.png',			     size: [30, 30] },
	'fort':          	   { url: 'images/icons/fort.png',        		 size: [28, 28] },
	'camp':          	   { url: 'images/icons/camp.png',        		 size: [24, 24] },
	'pointOfInterest':	   { url: 'images/icons/pointOfInterest.png',	 size: [24, 24] },
	'shrine':              { url: 'images/icons/shrine.png',             size: [24, 24] },
	'polarGates':          { url: 'images/icons/polarGates.png',         size: [24, 24] },
	'polarGatesBroken':    { url: 'images/icons/polarGatesBroken.png',   size: [24, 24] },
	'quest':               { url: 'images/icons/quest.png',              size: [24, 24] },
	'default':             { url: 'images/icons/settlement.png',         size: [24, 24] },
};

const HavenCRS = L.Util.extend({}, L.CRS.Simple, {
	transformation: new L.Transformation(1, 0, -1, imgHeight)
});

const map = L.map('map', {
	crs: HavenCRS,
	minZoom: -5,
	zoomControl: false,   // добавим вручную в bottomright
});

map.createPane('measurePane');
map.getPane('measurePane').style.zIndex = 710; // выше попапов (700)
map.getPane('measurePane').style.pointerEvents = 'none';

const bounds = [[0, 0], [imgHeight, imgWidth]];

const tileOptions = {
	tileSize: 256,
	bounds: bounds,
	noWrap: true,
	minZoom: -5,
	maxZoom: 1,
	maxNativeZoom: 0,
};


// ─── BASE LAYER ───────────────────────────────────────────────────────────
var mainMap = L.tileLayer('tiles/{z}/{x}/{y}.png', tileOptions).addTo(map);
map.fitBounds(bounds);


// ─── TILE OVERLAY LAYERS ──────────────────────────────────────────────────
map.createPane('provincesPane');
var provinces = L.tileLayer('tiles_provinces/{z}/{x}/{y}.png', {
	...tileOptions,
	updateWhenZooming: false,
	pane: 'provincesPane',
});


// ─── ИКОНКИ ФРАКЦИЙ / ПРОВИНЦИЙ ───────────────────────────────────────────
const FACTION_ICON  = 'images/icons/faction.png';
const PROVINCE_ICON = 'images/icons/province.png';

function buildIconRow(iconUrl, value) {
	if (!value) return '';
	return `
		<div class="info-row">
			<img class="info-icon" src="${iconUrl}" alt="">
			<span>${value}</span>
		</div>
	`;
}


// ─── ВЕКТОРНАЯ ПОЛИТИЧЕСКАЯ КАРТА (фракции + провинции) ───────────────────
// На малом зуме (-5..-2) показываем только крупные владения фракций.
// На приближённом (-1..0) фракции остаются подложкой-заливкой, а провинции
// лежат поверх почти прозрачным слоем — виден только их тонкий контур,
// пока не наведёшься/не откроешь провинцию (тогда её заливка усиливается).
const POLITICAL_TIER_ZOOM_BREAK = -1; // zoom >= this -> поверх фракций добавляются провинции

map.createPane('regionsPane');
map.getPane('regionsPane').style.zIndex = 350; // выше базовых тайлов, ниже подписей провинций и маркеров

// Leaflet перерисовывает/расширяет SVG-полотно векторного слоя только по 'moveend'
// (когда перетаскивание уже закончилось), а во время самого перетаскивания просто
// сдвигает уже отрисованный кусок через CSS-transform. Область, которая отрисована
// заранее — это видимый вьюпорт плюс запас (padding) в каждую сторону; если утащить
// карту дальше этого запаса за один приём, край вектора виден пустым до отпускания
// мыши. Увеличивая padding, отрисовываем не только видимую часть, а солидный запас
// вокруг нёе — при обычном перетаскивании пустых зон уже не будет видно. Плата —
// на каждый moveend/zoomend отрисовывается больше геометрии.
const regionsRenderer = L.svg({ padding: 2, pane: 'regionsPane' });

const REGION_FILL_OPACITY       = 0.32;
const REGION_FILL_OPACITY_HOVER = 0.55;

// На объединённом виде провинция рисуется ПОВЕРХ уже закрашенной (REGION_FILL_OPACITY)
// фракции. Чтобы подсветка провинции визуально совпадала по интенсивности с подсветкой
// фракции (REGION_FILL_OPACITY_HOVER), считаем непрозрачность верхнего слоя, которая
// при альфа-сложении поверх нижнего даёт нужный итоговый цвет: 1-(1-target)/(1-base).
function topOpacityForComposite(baseOpacity, targetOpacity) {
	return 1 - (1 - targetOpacity) / (1 - baseOpacity);
}
const PROVINCE_FILL_OPACITY_DEFAULT = 0; // в покое провинция полностью невидима
const PROVINCE_FILL_OPACITY_ACTIVE  = topOpacityForComposite(REGION_FILL_OPACITY, REGION_FILL_OPACITY_HOVER);

// ─── ЛЁГКОЕ РАЗМЫТИЕ КРАЁВ ВЕКТОРА ─────────────────────────────────────────
// Края векторных полигонов (и фракций, и провинций) всегда чуть смягчаются
// фильтром blur, чтобы лучше вписываться в растровую подложку. Поменяйте
// константу, чтобы настроить силу размытия.
const REGIONS_EDGE_BLUR_PX = 2;

const regionLayerById = {};

// ─── ССЫЛКИ НА ЛОКАЦИИ/ПРОВИНЦИИ/ФРАКЦИИ ВНУТРИ ОПИСАНИЯ ───────────────────
// Синтаксис как в маркдауне: [Текст](loc:id) / [Текст](province:id) /
// [Текст](faction:id) — id не меняется при переименовании записи, поэтому
// ссылка не ломается. Вставляется через кнопку "Вставить ссылку" в форме
// админки; здесь превращается в настоящую кликабельную ссылку в попапе.
const DESC_LINK_RE = /\[([^\]]+)\]\((loc|province|faction):([^)]+)\)/g;

// Иконка перед ссылкой соответствует тому, куда она ведёт: у провинции/фракции
// это их обычная иконка, у локации — иконка её типа (как в сайдбаре/попапе).
function iconForDescLink(type, id) {
	if (type === 'province') return PROVINCE_ICON;
	if (type === 'faction')  return FACTION_ICON;
	const row = markerRowById.get(id);
	// тот же фолбэк, что и у getIcon() для маркеров на самой карте
	return LOCATION_ICONS[row?.location_type]?.url ?? LOCATION_ICONS['default'].url;
}

function renderDescription(text) {
	if (!text) return text;
	return text.replace(DESC_LINK_RE, (match, label, type, id) => {
		const icon = `<img class="desc-link-icon" src="${iconForDescLink(type, id)}" alt="">`;
		return `<a class="desc-link" data-ref-type="${type}" data-ref-id="${id}">${icon}${label}</a>`;
	});
}

function buildRegionPopupHTML(props) {
	const showOwner = props.owner && props.owner !== props.name;
	return `
		<div class="popup-content region-popup">
			<div class="popup-text">
				${props.engname
					? `<p class="name-eng">${props.engname}</p>`
					: ''}
				<div class="title-row"><h1>${props.name ?? ''}</h1></div>
				${showOwner ? buildIconRow(FACTION_ICON, props.owner) : ''}
				${props.description
					? `<div class="description">${renderDescription(props.description)}</div>`
					: ''}
			</div>
		</div>
	`;
}

// fillOpacity — состояние по умолчанию; fillOpacityActive — при наведении или открытом попапе.
// Без окантовки (stroke: false); className нужен, чтобы CSS мог сделать площадь
// фигуры кликабельной, даже когда fillOpacity === 0 (см. .region-shape в style.css).
//
// Раньше при наведении вызывался layer.bringToFront() — а это физически переставляет
// DOM-узел фигуры, из-за чего браузер иногда не успевал прислать mouseout, и подсветка
// залипала. Теперь bringToFront не используется (окантовок больше нет, перекрывать
// соседей нечем), а на случай, если mouseout всё же не придёт (например, курсор резко
// ушёл за пределы карты), ниже добавлена подстраховка: у группы регионов хранится
// единственный «текущий наведённый» слой, и при наведении на новый слой либо при уходе
// курсора с карты предыдущий принудительно сбрасывается в состояние по умолчанию.
function makeRegionLayer(geojson, { fillOpacity, fillOpacityActive }) {
	let hoveredLayer = null;

	const group = L.geoJSON(geojson, {
		pane: 'regionsPane',
		renderer: regionsRenderer,
		style: feature => ({
			className: 'region-shape',
			stroke: false,
			fillColor: feature.properties.color,
			fillOpacity,
		}),
		onEachFeature: function(feature, layer) {
			const props = feature.properties;
			layer.bindPopup(buildRegionPopupHTML(props), { closeButton: false });

			// NO_FACTION-области (owner === '') всегда остаются прозрачными — их
			// можно искать/открывать попап, но заливка не должна появляться никогда.
			const noHighlight = props.owner === '';
			layer._fillOpacityDefault = fillOpacity;
			const refreshStyle = () => {
				const active = !noHighlight && (layer._hovered || layer._selected);
				layer.setStyle({ fillOpacity: active ? fillOpacityActive : fillOpacity });
			};
			layer._refreshStyle = refreshStyle;

			layer.on('mouseover', () => {
				if (hoveredLayer && hoveredLayer !== layer) {
					hoveredLayer._hovered = false;
					hoveredLayer._refreshStyle();
				}
				hoveredLayer = layer;
				layer._hovered = true;
				refreshStyle();
			});
			layer.on('mouseout', () => {
				layer._hovered = false;
				refreshStyle();
				if (hoveredLayer === layer) hoveredLayer = null;
			});
			layer.on('popupopen',  () => { layer._selected = true;  refreshStyle(); });
			layer.on('popupclose', () => { layer._selected = false; refreshStyle(); });

			if (props.id) regionLayerById[props.id] = layer;
		}
	});

	// подстраховка: курсор резко покинул карту, а mouseout по каким-то причинам не пришёл
	map.on('mouseout', () => {
		if (hoveredLayer) {
			hoveredLayer._hovered = false;
			hoveredLayer._refreshStyle();
			hoveredLayer = null;
		}
	});

	return group;
}

// Включает/выключает интерактивность (hover/клик) у всего яруса регионов, не убирая
// его с карты — используется, чтобы фракции оставались видимой подложкой, но не
// перехватывали клики/наведение, когда поверх них показаны провинции.
function setRegionsInteractive(featureGroup, enabled) {
	featureGroup.eachLayer(layer => {
		const el = layer.getElement && layer.getElement();
		if (el) el.classList.toggle('region-inert', !enabled);
		if (!enabled) {
			layer.closePopup();
			layer._hovered = false;
			layer._selected = false;
			layer.setStyle({ fillOpacity: layer._fillOpacityDefault });
		}
	});
}

const factionRegions  = makeRegionLayer(regionsFactions,  {
	fillOpacity: REGION_FILL_OPACITY, fillOpacityActive: REGION_FILL_OPACITY_HOVER,
});
const provinceRegions = makeRegionLayer(regionsProvinces, {
	fillOpacity: PROVINCE_FILL_OPACITY_DEFAULT, fillOpacityActive: PROVINCE_FILL_OPACITY_ACTIVE,
});

// Обёртка-слой, которая сама переключает ярус (фракции / фракции+провинции) по зуму,
// чтобы её можно было включать/выключать одним чекбоксом слоёв карты.
const PoliticalLayer = L.Layer.extend({
	onAdd: function(map) {
		this._map = map;
		this._syncTier();
		map.on('zoomend', this._syncTier, this);
	},
	onRemove: function(map) {
		map.off('zoomend', this._syncTier, this);
		if (map.hasLayer(factionRegions))  map.removeLayer(factionRegions);
		if (map.hasLayer(provinceRegions)) map.removeLayer(provinceRegions);
		map.getPane('regionsPane').style.filter = '';
	},
	_syncTier: function() {
		if (!this._map) return; // слой сейчас выключен — синхронизировать нечего
		// фракции — всегда база, пока слой включён
		if (!this._map.hasLayer(factionRegions)) this._map.addLayer(factionRegions);
		const showProvinces = this._map.getZoom() >= POLITICAL_TIER_ZOOM_BREAK;
		if (showProvinces) {
			if (!this._map.hasLayer(provinceRegions)) this._map.addLayer(provinceRegions);
		} else {
			if (this._map.hasLayer(provinceRegions)) this._map.removeLayer(provinceRegions);
		}
		// на уровне провинций фракции остаются видимой подложкой, но не должны
		// перехватывать клики/наведение — иначе легко случайно попасть по фракции
		// вместо провинции
		setRegionsInteractive(factionRegions, !showProvinces);

		this._map.getPane('regionsPane').style.filter = `blur(${REGIONS_EDGE_BLUR_PX}px)`;
	}
});

var politicalMap = new PoliticalLayer();

// Единая анимация перехода к точке (маркер/провинция/фракция). Зум пользователя
// сохраняется, если он уже не меньше зума, на котором видны провинции —
// иначе подтягиваем зум именно до этого уровня (не дальше).
const FOCUS_FLY_DURATION = 0.6; // сек

function focusLatLng(latlng) {
	const targetZoom = Math.max(map.getZoom(), POLITICAL_TIER_ZOOM_BREAK);
	map.flyTo(latlng, targetZoom, { duration: FOCUS_FLY_DURATION });
}

// Показать регион на карте (используется поиском/списком в сайдбаре)
function focusRegion(id) {
	if (!map.hasLayer(politicalMap)) {
		document.getElementById('layer-toggle-political').click();
	}
	const layer = regionLayerById[id];
	if (!layer) return;
	const center = layer.getBounds().getCenter();
	focusLatLng(center);
	setTimeout(() => layer.openPopup(center), FOCUS_FLY_DURATION * 1000);
}


// ─── MARKER GROUPS ────────────────────────────────────────────────────────
var cities       	 = L.layerGroup();
var towns  		 	 = L.layerGroup();
var forts        	 = L.layerGroup();
var camps        	 = L.layerGroup();
var shrines      	 = L.layerGroup();
var pointsOfInterest = L.layerGroup();
var polarGates   	 = L.layerGroup();
var quests       	 = L.layerGroup();


// ─── КОНФИГ СЛОЁВ МАРКЕРОВ ────────────────────────────────────────────────
// defaultOn: true  → добавляется на карту при старте
// defaultOn: false → выключен по умолчанию
const MARKER_LAYERS = [
    { label: 'Город',         		group: cities,			       defaultOn: true,  		icons: ['images/icons/city.png'] },
    { label: 'Поселение',      		group: towns,					defaultOn: true,  		icons: ['images/icons/town.png'] },
    { label: 'Форт',          		group: forts,        			defaultOn: true,  		icons: ['images/icons/fort.png'] },
    { label: 'Лагерь',         		group: camps,			        defaultOn: true,  		icons: ['images/icons/camp.png'] },
    { label: 'Святилище', 	   		group: shrines,      			defaultOn: true,		icons: ['images/icons/shrine.png'] },
	{ label: 'Точка интереса',		group: pointsOfInterest, 		defaultOn: true,		icons: ['images/icons/pointOfInterest.png'] },
    { label: 'Врата Древних',  		group: polarGates,   			defaultOn: false,  		icons: ['images/icons/polarGates.png'] },
    { label: 'Задание',        		group: quests,       			defaultOn: true,  		icons: ['images/icons/quest.png'] },
];

const MAP_LAYERS = [
	{ label: 'Политическая карта', layer: politicalMap, defaultOn: false, id: 'layer-toggle-political' },
	{ label: 'Провинции',          layer: provinces,    defaultOn: true },
];


// ─── ТИПЫ ЛОКАЦИЙ ─────────────────────────────────────────────────────────
// LOCATION_ICONS объявлена в самом начале файла (см. комментарий там)

function getIcon(locationType) {
	const cfg = LOCATION_ICONS[locationType] ?? LOCATION_ICONS['default'];
	return L.icon({
		iconUrl:     cfg.url,
		iconSize:    cfg.size,
		iconAnchor:  [cfg.size[0] / 2, cfg.size[1] / 2],
		popupAnchor: [0, 0],
	});
}


// ─── ОСОБЕННОСТИ ──────────────────────────────────────────────────────────
const TRAITS = {
	'port':            { icon: 'images/icons/port.png',            tooltip: 'Порт'                             },
	'settlement':      { icon: 'images/icons/town.png', 	       tooltip: 'Поселение'                        },
	'mountain':        { icon: 'images/icons/mountain.png',        tooltip: 'Гора'                             },
	'colony':          { icon: 'images/icons/colony.png',          tooltip: 'Древняя колония высших эльфов'    },
	'capital_hef':     { icon: 'images/icons/capital_hef.png',     tooltip: 'Столица высших эльфов'            },
	'capital_def':     { icon: 'images/icons/capital_def.png',     tooltip: 'Столица тёмных эльфов'            },
	'forest':          { icon: 'images/icons/forest.png',          tooltip: 'Лес'                              },
	'sword_of_khaine': { icon: 'images/icons/sword_of_khaine.png', tooltip: '<b>Меч Кхейна</b><br><br><p style="color: #787167; margin: 0;">Некоторые считают этот меч самым могущественным оружием в мире, способным низвергать даже богов. Говорят, что сила этого артефакта настолько велика, что его повторное использование способно перекроить судьбы эльфов и изменить ход мировой истории.</p>' },
};

function buildTraitsHTML(traits) {
	if (!traits?.length) return '';
	return traits.map(key => {
		const t = TRAITS[key];
		if (!t) return '';
		return `<div class="trait" data-key="${key}"><img src="${t.icon}" alt=""></div>`;
	}).join('');
}


// ─── ПОПАП ────────────────────────────────────────────────────────────────
// Картинки локаций временно отключены (не удалены — сами файлы и пути в
// данных остаются как есть, просто не рендерим <img>). Чтобы вернуть,
// поставить обратно true.
const SHOW_LOCATION_IMAGES = false;

function buildPopupHTML(props, opts = {}) {
	return `
		<div class="popup-content">
			${SHOW_LOCATION_IMAGES && props.image
				? `<img class="location-img" src="${props.image}" alt="">`
				: ''}
			<div class="popup-text">
				${props.engname
					? `<p class="name-eng">${props.engname}</p>`
					: ''}
				<div class="title-row">
					${opts.hideAdminActions ? '' : `
					<button type="button" class="popup-edit-icon admin-only" data-edit-marker="${props.id ?? ''}" title="Редактировать маркер">
						<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><path d="M2.40402 9.76955L0 10L0.230298 7.59556L5.81011 2.00636L7.99436 4.19058L2.40402 9.76955Z" fill="currentColor"/><path d="M9.68337 1.24619C9.7779 1.33841 9.84815 1.43382 9.89413 1.53234C9.94002 1.63099 9.97102 1.7271 9.98723 1.82048C10.0045 1.9201 10.0042 2.01256 9.98647 2.09778C9.96868 2.18285 9.92973 2.25675 9.86956 2.31937L8.93311 3.25398L6.74688 1.06778L7.68364 0.129508C7.74733 0.0754453 7.82145 0.0378807 7.906 0.0170314C7.99066 -0.00379003 8.08243 -0.00546 8.18117 0.0116899C8.2799 0.028844 8.37831 0.0609362 8.47633 0.108142C8.57423 0.155335 8.66937 0.22629 8.76172 0.320887L9.68337 1.24619Z" fill="currentColor"/></svg>
					</button>`}
					<h1>${props.runame ?? ''}</h1>
					<div class="traits">${buildTraitsHTML(props.traits)}</div>
				</div>
				${props.description
					? `<div class="description">${renderDescription(props.description)}</div>`
					: ''}
				${(props.faction || props.province) ? `
				<div class="info-row-group">
					${buildIconRow(FACTION_ICON,  props.faction)}
					${buildIconRow(PROVINCE_ICON, props.province)}
				</div>` : ''}
			</div>
		</div>
	`;
}


// ─── DISPLAY MARKERS ──────────────────────────────────────────────────────
// Маркеры хранятся в Supabase (таблица markers) — публичное чтение открыто всем
// через RLS-политику, запись разрешена только вошедшему администратору
// (см. блок АДМИНКА ниже). loadMarkers() полностью перестраивает все слои
// маркеров и список в сайдбаре — вызывается при старте и заново после
// добавления/редактирования/удаления маркера в админке.
const markersById  = {};   // id строки Supabase -> Leaflet-маркер (навигация из сайдбара + админка)
// allMarkerRows объявлена в самом начале файла (см. комментарий там)

function rowToFeature(row) {
	return {
		properties: {
			id: row.id,
			runame: row.runame,
			engname: row.engname,
			description: row.description,
			faction: row.faction,
			province: row.province,
			locationType: row.location_type,
			traits: row.traits ?? [],
			image: row.image,
		},
		geometry: { coordinates: [row.lng, row.lat] },
	};
}

async function loadMarkers() {
	const { data, error } = await supabaseClient.from('markers').select('*').order('runame');
	if (error) {
		console.error('Не удалось загрузить маркеры из Supabase:', error);
		return;
	}
	allMarkerRows = data;
	markerRowById = new Map(data.map(row => [row.id, row]));

	[cities, towns, forts, camps, shrines, pointsOfInterest, polarGates, quests].forEach(g => g.clearLayers());
	Object.keys(markersById).forEach(k => delete markersById[k]);

	const features = data.map(rowToFeature);

	features.forEach(function(feature) {
		const coords = feature.geometry.coordinates;
		const latlng = L.latLng(coords[1], coords[0]);

		const marker = L.marker(latlng, {
			icon: getIcon(feature.properties.locationType)
		});
		marker.bindPopup(buildPopupHTML(feature.properties), { closeButton: false });

		markersById[feature.properties.id] = marker;

		switch (feature.properties.locationType) {
			case 'city': 			 marker.addTo(cities); break;
			case 'town':	 		 marker.addTo(towns); break;
			case 'fort': 			 marker.addTo(forts); break;
			case 'camp': 			 marker.addTo(camps); break;
			case 'shrine':			 marker.addTo(shrines); break;
			case 'pointOfInterest':  marker.addTo(pointsOfInterest); break;
			case 'polarGates':
			case 'polarGatesBroken': marker.addTo(polarGates); break;
			case 'quest':            marker.addTo(quests); break;
		}
	});

	buildLocationList(features);
	if (typeof populateAdminDatalists === 'function') populateAdminDatalists();
}
loadMarkers();


// ─── ДОБАВЛЯЕМ СЛОИ НА КАРТУ СОГЛАСНО defaultOn ───────────────────────────
MARKER_LAYERS.forEach(({ group, defaultOn }) => {
	if (defaultOn) map.addLayer(group);
});
MAP_LAYERS.forEach(({ layer, defaultOn }) => {
	if (defaultOn) map.addLayer(layer);
});


// ─── SIDEBAR: ИКОНКИ ТИПОВ МАРКЕРОВ (та же логика, что «Особенности» в
// форме редактирования — ряд иконок, ч/б пока выключено, цветная+свечение
// когда слой показан на карте) ──────────────────────────────────────────
const individualContainer = document.getElementById('individual-checkboxes');

// Глаз мастер-кнопки: полностью открыт — показаны все типы; наполовину прикрыт —
// показана только часть. Форма меняется, а не только цвет/свечение.
const EYE_SVG_OPEN = '<svg viewBox="0 0 24 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s4-6 11-6 11 6 11 6-4 6-11 6-11-6-11-6z"/><circle cx="12" cy="8" r="2.5"/></svg>';
const EYE_SVG_HALF = '<svg viewBox="0 0 24 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s4-6 11-6 11 6 11 6-4 6-11 6-11-6-11-6z"/><path d="M3 8h18"/><path d="M9.5 8a2.5 2.5 0 0 0 5 0"/></svg>';
const ALL_MARKERS_ICON = EYE_SVG_OPEN;

// Общий конструктор кнопки-иконки для рядов-переключателей (Локации/
// Особенности): разметка (button.trait + доп. класс(ы), data-атрибуты,
// картинка) — общая; поведение по клику и добавление в контейнер остаются за
// вызывающим кодом — у рядов оно разное (группы слоёв+соло vs простой toggle).
function createTraitButton(extraClass, dataset, iconHTML) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `trait ${extraClass}`;
	Object.assign(btn.dataset, dataset);
	btn.innerHTML = iconHTML;
	return btn;
}

const masterLayerBtn = createTraitButton('layer-icon-btn layer-icon-btn-all', { tooltip: 'Все пометки' }, ALL_MARKERS_ICON);
individualContainer.appendChild(masterLayerBtn);

function setLayerButtonState(btn, group, on) {
	btn.classList.toggle('selected', on);
	if (on) map.addLayer(group);
	else    map.removeLayer(group);
}

const markerLayerButtons = MARKER_LAYERS.map(({ label, group, defaultOn, icons }) => {
	const btn = createTraitButton('layer-icon-btn', { tooltip: label }, `<img src="${icons?.[0] ?? ''}" alt="${label}">`);
	btn.classList.toggle('selected', defaultOn);
	btn.addEventListener('click', function() {
		setLayerButtonState(btn, group, !btn.classList.contains('selected'));
		updateMasterLayerBtn();
	});
	individualContainer.appendChild(btn);
	return btn;
});

masterLayerBtn.addEventListener('click', function() {
	const turnOn = !markerLayerButtons.every(b => b.classList.contains('selected'));
	markerLayerButtons.forEach((btn, i) => setLayerButtonState(btn, MARKER_LAYERS[i].group, turnOn));
	updateMasterLayerBtn();
});

// ПКМ по иконке типа — «соло»: показать только этот тип, скрыв остальные.
// Повторный ПКМ на уже соло-типе включает обратно все типы.
markerLayerButtons.forEach((btn, idx) => {
	btn.addEventListener('contextmenu', function(e) {
		e.preventDefault();
		const isSoloed = btn.classList.contains('selected') &&
			markerLayerButtons.every((b, i) => i === idx || !b.classList.contains('selected'));
		markerLayerButtons.forEach((b, i) => {
			setLayerButtonState(b, MARKER_LAYERS[i].group, isSoloed ? true : i === idx);
		});
		updateMasterLayerBtn();
	});
});

function updateMasterLayerBtn() {
	const allOn  = markerLayerButtons.every(b => b.classList.contains('selected'));
	const allOff = markerLayerButtons.every(b => !b.classList.contains('selected'));
	const partial = !allOn && !allOff;
	masterLayerBtn.classList.toggle('selected', allOn);
	masterLayerBtn.classList.toggle('partial', partial);
	masterLayerBtn.innerHTML = partial ? EYE_SVG_HALF : EYE_SVG_OPEN;
}

updateMasterLayerBtn();


// ─── SIDEBAR: ЧЕКБОКСЫ СЛОЁВ КАРТЫ ───────────────────────────────────────
const mapLayerContainer = document.getElementById('map-layer-checkboxes');

MAP_LAYERS.forEach(({ label, layer, defaultOn, id }) => {
	const lbl = document.createElement('label');
	lbl.className = 'layer-checkbox';

	const cb = document.createElement('input');
	cb.type    = 'checkbox';
	cb.checked = defaultOn;
	if (id) cb.id = id;

	cb.addEventListener('change', function() {
		if (this.checked) map.addLayer(layer);
		else              map.removeLayer(layer);
	});

	lbl.appendChild(cb);
	lbl.appendChild(document.createTextNode(' ' + label));
	mapLayerContainer.appendChild(lbl);
});


// ─── SIDEBAR: СПИСОК ЛОКАЦИЙ ──────────────────────────────────────────────
const provinceRegionMeta = {};   // название провинции (рус) -> { id, owner, engname }
regionsProvinces.features.forEach(f => {
	provinceRegionMeta[f.properties.name] = {
		id: f.properties.id,
		owner: f.properties.owner ?? '',
		engname: f.properties.engname ?? '',
	};
});

function buildLocationList(features) {
	// Группируем по провинции
	const grouped = {};
	features.forEach(f => {
		const province = f.properties.province ?? '—';
		if (!grouped[province]) grouped[province] = [];
		grouped[province].push(f);
	});

	// Сортируем провинции и локации внутри них
	const sorted = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'ru'));

	const container = document.getElementById('location-list');
	container.innerHTML = '';

	sorted.forEach(province => {
		const provDiv = document.createElement('div');
		provDiv.className = 'province-group';

		const meta = provinceRegionMeta[province];

		const header = document.createElement('div');
		header.className = 'province-header';
		header.dataset.name    = province.toLowerCase();
		header.dataset.owner   = (meta?.owner ?? '').toLowerCase();
		header.dataset.engname = (meta?.engname ?? '').toLowerCase();

		const nameSpan = document.createElement('span');
		nameSpan.className = 'province-header-text';
		nameSpan.textContent = province;
		header.appendChild(nameSpan);

		// Клик по названию — переход к провинции; клик по стрелке/пустому месту
		// строки — только сворачивание списка (не должны конфликтовать друг с другом).
		header.addEventListener('click', () => {
			provDiv.classList.toggle('collapsed');
		});
		if (meta?.id) {
			header.classList.add('has-region');
			nameSpan.addEventListener('click', (e) => {
				e.stopPropagation();
				focusRegion(meta.id);
			});
		}
		provDiv.appendChild(header);

		const ul = document.createElement('ul');
		ul.className = 'location-items';

		grouped[province]
			.sort((a, b) => (a.properties.runame ?? '').localeCompare(b.properties.runame ?? '', 'ru'))
			.forEach(f => {
				const li = document.createElement('li');
				li.className     = 'location-item';
				li.textContent   = f.properties.runame ?? '';
				li.dataset.ru    = (f.properties.runame  ?? '').toLowerCase();
				li.dataset.en    = (f.properties.engname ?? '').toLowerCase();

				li.addEventListener('click', function() {
					const marker = markersById[f.properties.id];
					if (marker) {
						focusLatLng(marker.getLatLng());
						setTimeout(() => marker.openPopup(), FOCUS_FLY_DURATION * 1000);
					}
				});

				ul.appendChild(li);
			});

		provDiv.appendChild(ul);
		container.appendChild(provDiv);
	});
}

// ─── SIDEBAR: ПОИСК ───────────────────────────────────────────────────────
document.getElementById('sidebar-search').addEventListener('input', function() {
	const query = this.value.toLowerCase().trim();

	document.querySelectorAll('.province-group').forEach(provDiv => {
		const header = provDiv.querySelector('.province-header');
		const regionMatch = !!query && (
			header.dataset.name.includes(query) ||
			header.dataset.engname.includes(query) ||
			header.dataset.owner.includes(query)
		);

		let anyVisible = false;
		provDiv.querySelectorAll('.location-item').forEach(item => {
			const match = !query || regionMatch || item.dataset.ru.includes(query) || item.dataset.en.includes(query);
			item.style.display = match ? '' : 'none';
			if (match) anyVisible = true;
		});

		const groupVisible = anyVisible || regionMatch;

		// При поиске автоматически разворачиваем провинцию
		if (query && groupVisible) provDiv.classList.remove('collapsed');
		provDiv.style.display = groupVisible ? '' : 'none';
	});
});


// ─── SIDEBAR: TOGGLE ──────────────────────────────────────────────────────
// Разворачивающая кнопка живёт в шапке сайдбара (обычная иконка рядом с
// заголовком) — но пока сайдбар свёрнут, её не видно (она внутри самого
// сайдбара). Поэтому на время свёрнутого состояния показывается кнопка-
// дублёр в виде Leaflet-контрола (topleft, тот же принцип, что и кнопка
// входа) — только чтобы было куда нажать и развернуть сайдбар обратно.
//
// Сворачивание анимирует transform на #sidebar-wrapper (см. CSS), а не на
// #sidebar — иначе transition/анимируемый transform там же, где JS на каждый
// mousemove при resize меняет width, заставлял браузер лишний раз
// пересчитывать композитный слой и давал фризы при растягивании. Растянутая
// через resize-ручку ширина (sidebar.style.width) сворачиванием не трогается.
const sidebar        = document.getElementById('sidebar');
const sidebarWrapper = document.getElementById('sidebar-wrapper');
let sidebarToggleControlEl = null;

function toggleSidebarCollapsed() {
	const collapsing = !sidebarWrapper.classList.contains('collapsed');
	sidebarWrapper.classList.toggle('collapsed');
	if (sidebarToggleControlEl) {
		sidebarToggleControlEl.style.display = collapsing ? '' : 'none';
	}
}

document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebarCollapsed);
document.getElementById('edit-sidebar-toggle').addEventListener('click', toggleSidebarCollapsed);

const SidebarToggleControl = L.Control.extend({
	options: { position: 'topleft' },
	onAdd: function() {
		const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-sidebar-toggle');
		container.style.display = 'none'; // видна, только пока сайдбар свёрнут
		sidebarToggleControlEl = container;
		const link = L.DomUtil.create('a', '', container);
		link.href  = '#';
		link.title = 'Развернуть сайдбар';
		L.DomEvent.on(link, 'click', function(e) {
			L.DomEvent.preventDefault(e);
			toggleSidebarCollapsed();
		});
		L.DomEvent.disableClickPropagation(container);
		return container;
	}
});
new SidebarToggleControl().addTo(map);


// ─── SIDEBAR: РАСТЯГИВАНИЕ ШИРИНЫ ─────────────────────────────────────────
const sidebarResizeHandle = document.getElementById('sidebar-resize-handle');
const SIDEBAR_MIN_W = 320;
const SIDEBAR_MAX_W = 640;

let resizingSidebar = false;
let resizeStartX = 0;
let resizeStartW = SIDEBAR_MIN_W;

function setSidebarWidth(w) {
	w = Math.max(SIDEBAR_MIN_W, Math.min(SIDEBAR_MAX_W, w));
	sidebar.style.width = w + 'px';
}

// Pointer Events, а не mousedown/mousemove/mouseup — те стреляют только от
// настоящей мыши. На тач-устройствах (iPad и т.п.) их не было бы вообще, и
// ручка растягивания реагировала бы только на курсор-иконку/подсветку, а
// сама ширина не менялась. Pointer Events унифицируют мышь/тач/перо; заодно
// setPointerCapture держит события на ручке, даже если палец/курсор уйдёт
// за её узкие 6px во время перетаскивания.
sidebarResizeHandle.addEventListener('pointerdown', function(e) {
	resizingSidebar = true;
	resizeStartX = e.clientX;
	resizeStartW = sidebar.getBoundingClientRect().width;
	sidebar.classList.add('resizing');
	document.body.style.userSelect = 'none';
	sidebarResizeHandle.setPointerCapture(e.pointerId);
	e.preventDefault();
});

sidebarResizeHandle.addEventListener('pointermove', function(e) {
	if (!resizingSidebar) return;
	setSidebarWidth(resizeStartW + (e.clientX - resizeStartX));
});

function endSidebarResize() {
	if (!resizingSidebar) return;
	resizingSidebar = false;
	sidebar.classList.remove('resizing');
	document.body.style.userSelect = '';
	forceHoverRecalc(sidebar);
}
sidebarResizeHandle.addEventListener('pointerup', endSidebarResize);
sidebarResizeHandle.addEventListener('pointercancel', endSidebarResize);


// ─── ZOOM CONTROL (bottomright) ───────────────────────────────────────────
L.control.zoom({ position: 'bottomright' }).addTo(map);


// ─── RESET VIEW CONTROL (bottomright, под zoom) ───────────────────────────
const ResetControl = L.Control.extend({
	options: { position: 'bottomright' },
	onAdd: function(map) {
		const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-reset');
		const link      = L.DomUtil.create('a', '', container);
		link.innerHTML  = '⌂';
		link.href       = '#';
		link.title      = 'Центрировать карту';
		L.DomEvent.on(link, 'click', function(e) {
			L.DomEvent.preventDefault(e);
			map.fitBounds(bounds);
		});
		L.DomEvent.disableClickPropagation(container);
		return container;
	}
});
// Добавляем ДО zoom → reset окажется ниже
new ResetControl().addTo(map);



// ─── MEASURE CONTROL ──────────────────────────────────────────────────────
let measuringActive  = false;
let measurePoints    = [];
let measureLayers    = [];
let rubberBandLine   = null;
let cursorLabel      = null;
let totalFixedDist   = 0;
let measureBtn;
let totalLabel = null;

const MeasureControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-measure');
        measureBtn = L.DomUtil.create('a', '', container);
        measureBtn.href  = '#';
        measureBtn.title = 'Измерить расстояние (1 пк = 7 км)';
        L.DomEvent.on(measureBtn, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            measuringActive ? stopMeasuring() : startMeasuring();
        });
        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});
new MeasureControl().addTo(map);


// ─── ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ──────────────────────────────────────────────
function calcDist(p1, p2) {
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    return Math.sqrt(dx * dx + dy * dy) * 2.8; /* 2.8 <-- Зигмор; 7 <-- Земля */
}


// ─── ВКЛЮЧЕНИЕ РЕЖИМА ─────────────────────────────────────────────────────
function startMeasuring() {
    measuringActive = true;
    measureBtn.classList.add('active');
    map.getContainer().style.cursor = 'crosshair';
    map.getContainer().classList.add('measuring');    // блокирует клики на маркеры
    map.on('click',     onMeasureClick);
    map.on('mousemove', onMeasureMouseMove);
    map.on('dblclick',  stopMeasuring);
	map.on('popupopen', onMeasurePopupOpen);
}


// ─── ВЫКЛЮЧЕНИЕ РЕЖИМА ────────────────────────────────────────────────────
function stopMeasuring() {
    measuringActive = false;
    measureBtn.classList.remove('active');
    map.getContainer().style.cursor = '';
    map.getContainer().classList.remove('measuring'); // возвращает клики на маркеры

    map.off('click',     onMeasureClick);
    map.off('mousemove', onMeasureMouseMove);
    map.off('dblclick',  stopMeasuring);
	map.off('popupopen', onMeasurePopupOpen);

    if (rubberBandLine) { map.removeLayer(rubberBandLine); rubberBandLine = null; }
    if (cursorLabel)    { map.removeLayer(cursorLabel);    cursorLabel    = null; }
	if (totalLabel)  	{ map.removeLayer(totalLabel); totalLabel = null; }

    measureLayers.forEach(l => map.removeLayer(l));
    measureLayers  = [];
    measurePoints  = [];
    totalFixedDist = 0;
}

function onMeasurePopupOpen() {
    map.closePopup();
}

// ─── ДВИЖЕНИЕ МЫШИ ────────────────────────────────────────────────────────
function onMeasureMouseMove(e) {
    if (measurePoints.length === 0) return;

    const last = measurePoints[measurePoints.length - 1];

    // Резиновая пунктирная линия
    if (rubberBandLine) {
        rubberBandLine.setLatLngs([last, e.latlng]);
    } else {
        rubberBandLine = L.polyline([last, e.latlng], {
            color: '#ff3333', weight: 1.5, dashArray: '7 5',
            pane: 'measurePane',
        }).addTo(map);
    }

    // Суммарное расстояние: зафиксированные сегменты + текущий хвост
    const pending   = calcDist(last, e.latlng);
    const totalDist = Math.round(totalFixedDist + pending);
    const html      = `<span class="measure-total">${totalDist} км</span>`;

    if (cursorLabel) {
        cursorLabel.setLatLng(e.latlng);
        cursorLabel.setIcon(L.divIcon({
            className:  'measure-cursor-label',
            html:       html,
            iconAnchor: [-10, 20],
            iconSize:   null,
        }));
    } else {
        cursorLabel = L.marker(e.latlng, {
            icon: L.divIcon({
                className:  'measure-cursor-label',
                html:       html,
                iconAnchor: [-10, 20],
                iconSize:   null,
            }),
            interactive: false,
            pane: 'measurePane',
        }).addTo(map);
    }
}


// ─── КЛИК НА КАРТУ ────────────────────────────────────────────────────────
function onMeasureClick(e) {
    if (e.originalEvent.detail > 1) return;   // игнорируем второй клик dblclick

    const latlng = e.latlng;

    if (measurePoints.length > 0) {
        const last    = measurePoints[measurePoints.length - 1];
        const segDist = calcDist(last, latlng);
        totalFixedDist += segDist;

        // Убираем резиновую линию — заменяем сплошной
        if (rubberBandLine) { map.removeLayer(rubberBandLine); rubberBandLine = null; }

        const line = L.polyline([last, latlng], {
            color: '#ff3333', weight: 2,
            pane: 'measurePane',
        }).addTo(map);
        measureLayers.push(line);

        // Лейбл дистанции сегмента по середине линии
        const segLabel = L.marker(
            [(last.lat + latlng.lat) / 2, (last.lng + latlng.lng) / 2],
            {
                icon: L.divIcon({
                    className:  'measure-label',
                    html:       `${Math.round(segDist)} км`,
                    iconAnchor: [-6, 10],
                    iconSize:   null,
                }),
                interactive: false,
                pane: 'measurePane',
            }
        ).addTo(map);
        measureLayers.push(segLabel);
    }

    measurePoints.push(latlng);

    // Точка
    const dot = L.circleMarker(latlng, {
        radius: 4, color: '#ff3333',
        fillColor: '#ff3333', fillOpacity: 1, weight: 2,
        pane: 'measurePane',
    }).addTo(map);
    measureLayers.push(dot);

	// Обновляем лейбл суммарного расстояния на последней точке
	if (totalLabel) map.removeLayer(totalLabel);

	if (totalFixedDist > 0) {
		totalLabel = L.marker(latlng, {
			icon: L.divIcon({
				className:  'measure-label measure-label-total',
				html:       `${Math.round(totalFixedDist)} км`,
				iconAnchor: [-6, -4],
				iconSize:   null,
			}),
			interactive: false,
			pane: 'measurePane',
		}).addTo(map);
	}
}


// ─── ESCAPE ───────────────────────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && measuringActive) stopMeasuring();
});


// ─── ПОПАП: ДИНАМИЧЕСКАЯ ШИРИНА ───────────────────────────────────────────
// Значение должно совпадать с .popup-content{width} в style.css — это её
// база, от которой считаем, нужно ли раздвигать попап шире.
const POPUP_DEFAULT_WIDTH = 300;

map.on('popupopen', function(e) {
	const popup    = e.popup.getElement();
	const content  = popup.querySelector('.popup-content');
	const h1       = popup.querySelector('h1');
	const traits   = popup.querySelector('.traits');
	const editIcon = popup.querySelector('.popup-edit-icon'); // видна только админу — .title-row шире на её ширину+отступ

	content.style.width = '';
	if (!h1) return;

	// h1.scrollWidth в уже перенёсшемся по словам контейнере — это ширина
	// самой широкой из УЖЕ перенесённых строк, а не та, что нужна заголовку
	// в одну строку целиком. Меряем принудительно в одну строку (nowrap),
	// иначе после первого же переноса ширина считалась заниженной и попап
	// не мог сам себя "распрямить".
	const prevWhiteSpace = h1.style.whiteSpace;
	h1.style.whiteSpace = 'nowrap';
	const h1Width = h1.scrollWidth;
	h1.style.whiteSpace = prevWhiteSpace;

	// Считаем ширину, нужную заголовку в одну строку вместе с иконкой
	// редактирования и особенностями (если они есть) — если базовой ширины
	// попапа не хватает, раздвигаем попап ровно настолько, чтобы всё
	// поместилось в одну строку.
	const editIconWidth = editIcon ? editIcon.offsetWidth + 6 : 0;
	const neededWidth = editIconWidth + h1Width + 8 + (traits?.offsetWidth ?? 0) + 50;
	if (neededWidth > POPUP_DEFAULT_WIDTH) content.style.width = neededWidth + 'px';
});


// ─── ТУЛТИП ───────────────────────────────────────────────────────────────
const traitTooltip = document.createElement('div');
traitTooltip.className = 'trait-tooltip';
document.body.appendChild(traitTooltip);
let pinned = false;

// Текст тултипа: сначала свой data-tooltip на элементе (иконки слоёв в
// «Локациях»), иначе — словарь TRAITS по data-key (особенности локации).
function traitTooltipContent(el) {
	return el.dataset.tooltip ?? TRAITS[el.dataset.key]?.tooltip ?? '';
}

document.addEventListener('mouseover', function(e) {
	if (pinned) return;
	const trait = e.target.closest('.trait');
	if (trait) {
		traitTooltip.innerHTML = traitTooltipContent(trait);
		traitTooltip.style.display = 'block';
	}
});

document.addEventListener('mouseout', function(e) {
	if (pinned) return;
	if (e.target.closest('.trait')) traitTooltip.style.display = 'none';
});

document.addEventListener('mousemove', function(e) {
	if (pinned) return;
	if (traitTooltip.style.display === 'block') {
		traitTooltip.style.left = (e.clientX + 14) + 'px';
		traitTooltip.style.top  = (e.clientY + 14) + 'px';
	}
});

document.addEventListener('click', function(e) {
	const trait = e.target.closest('.trait');
	// Фиксация по клику — только для read-only иконок (div) в попапе локации.
	// У переключателей (button — особенности в форме, слои в «Локациях») клик
	// уже занят своим действием — тултип там должен быть чисто по ховеру.
	if (trait && trait.tagName !== 'BUTTON') {
		traitTooltip.innerHTML = traitTooltipContent(trait);
		traitTooltip.style.display = 'block';
		traitTooltip.classList.add('pinned');
		pinned = true;
		e.stopPropagation();
		return;
	}
	if (traitTooltip.contains(e.target)) return;
	pinned = false;
	traitTooltip.classList.remove('pinned');
	traitTooltip.style.display = 'none';
});


// ─── АДМИНКА: ВХОД ─────────────────────────────────────────────────────────
// Публичные ключи Supabase (supabase-config.js) безопасны в браузере — реальная
// защита на запись обеспечивается RLS-политиками в базе (см. регистрацию
// markers-table), а не сокрытием ключа. Вошедший администратор получает
// возможность добавлять/редактировать/удалять маркеры прямо на этой странице.
let isAdmin = false;

// Для update/delete Supabase/PostgREST не считает отказ RLS ошибкой — если
// политика не пропускает ни одной строки, запрос просто "успешно" затрагивает
// 0 строк (в отличие от insert, где нарушение RLS — это явная ошибка). Поэтому
// здесь всегда просим .select() и сами проверяем, что строка действительно
// вернулась — иначе истёкшая сессия выглядела бы как успешное сохранение.
const SESSION_EXPIRED_MSG = 'нет прав на изменение (сессия могла истечь — попробуйте войти заново)';

async function runWrite(query) {
	const { data, error } = await query.select();
	if (error) return { ok: false, message: error.message };
	if (!data || data.length === 0) return { ok: false, message: SESSION_EXPIRED_MSG };
	return { ok: true, data };
}

// Одна и та же кнопка входа/выхода: не авторизован — клик открывает попап
// входа; авторизован — клик сразу выходит (отдельной кнопки «Выйти» больше
// нет). Иконка/цвет переключаются в CSS через body.is-admin.
let adminControlLink = null;

const AdminControl = L.Control.extend({
	options: { position: 'topright' },
	onAdd: function() {
		const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-admin');
		const link = L.DomUtil.create('a', '', container);
		link.href  = '#';
		link.title = 'Вход для администратора';
		adminControlLink = link;
		L.DomEvent.on(link, 'click', async function(e) {
			L.DomEvent.preventDefault(e);
			if (isAdmin) {
				await supabaseClient.auth.signOut();
				setAdminState(false);
			} else {
				loginPopover.classList.toggle('hidden');
			}
		});
		L.DomEvent.disableClickPropagation(container);
		return container;
	}
});
new AdminControl().addTo(map);

const loginPopover = document.getElementById('login-popover');
const loginForm     = document.getElementById('login-form');
const loginErrorEl  = document.getElementById('login-error');

function setAdminState(admin) {
	isAdmin = admin;
	document.body.classList.toggle('is-admin', admin);
	if (adminControlLink) adminControlLink.title = admin ? 'Выйти' : 'Вход для администратора';
}

loginForm.addEventListener('submit', async function(e) {
	e.preventDefault();
	loginErrorEl.textContent = '';
	const email    = document.getElementById('login-email').value;
	const password = document.getElementById('login-password').value;
	const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
	if (error) {
		loginErrorEl.textContent = 'Неверная почта или пароль';
		return;
	}
	loginForm.reset();
	loginPopover.classList.add('hidden');
	setAdminState(true);
});

(async function initAuth() {
	const { data: { session } } = await supabaseClient.auth.getSession();
	setAdminState(!!session);
})();


// ─── АДМИНКА: ФОРМА МАРКЕРА (добавление / редактирование / удаление) ───────
const normalView      = document.getElementById('normal-view');
const editMarkerView  = document.getElementById('edit-marker-view');
const editMarkerTitle = document.getElementById('edit-marker-title');
const addMarkerBtn    = document.getElementById('add-marker-btn');
const editBackBtn     = document.getElementById('edit-back-btn');
const deleteMarkerBtn  = document.getElementById('delete-marker-btn');
const revertDefaultBtn = document.getElementById('revert-default-btn');
const markerForm       = document.getElementById('marker-form');
const formErrorEl      = document.getElementById('form-error');
const placeHint        = document.getElementById('place-hint');
const traitsIconsEl    = document.getElementById('traits-icons');

function getSelectedTraits() {
	return [...traitsIconsEl.querySelectorAll('.trait-icon-btn.selected')].map(b => b.dataset.key);
}

const TRAIT_LABELS = {
	'port':            'Порт',
	'settlement':      'Поселение',
	'mountain':        'Гора',
	'colony':          'Древняя колония высших эльфов',
	'capital_hef':     'Столица высших эльфов',
	'capital_def':     'Столица тёмных эльфов',
	'forest':          'Лес',
	'sword_of_khaine': 'Меч Кхейна',
};
// Ряд иконок вместо чекбоксов с текстом — клик переключает выбор; тултип с
// названием переиспользует существующий .trait/.trait-tooltip механизм
// (см. блок «ТУЛТИП» ниже), поэтому у кнопки те же class/data-key.
Object.entries(TRAIT_LABELS).forEach(([key, label]) => {
	// без title: название уже показывает кастомный .trait-tooltip по ховеру —
	// нативный title давал задержанный "системный" тултип вдобавок к нему
	const btn = createTraitButton('trait-icon-btn', { key }, `<img src="${TRAITS[key]?.icon ?? ''}" alt="${label}">`);
	btn.addEventListener('click', () => btn.classList.toggle('selected'));
	traitsIconsEl.appendChild(btn);
});

let activeMarkerId = null; // null = создаём новый
let draftMarker = null;

function clearDraftMarker() {
	if (draftMarker) { map.removeLayer(draftMarker); draftMarker = null; }
}

// Пока идёт редактирование существующей локации, черновой маркер (draftMarker)
// подменяет собой настоящий — иначе на карте видно два маркера в одной точке:
// неподвижный настоящий и перетаскиваемый черновик, что и создавало впечатление
// «дубля». Прячем настоящий на время редактирования и возвращаем при выходе.
let hiddenMarkerId = null;

function hideRealMarker(id) {
	restoreRealMarker();
	markersById[id]?.getElement()?.classList.add('admin-editing-hidden');
	hiddenMarkerId = id;
}

function restoreRealMarker() {
	if (hiddenMarkerId !== null) {
		markersById[hiddenMarkerId]?.getElement()?.classList.remove('admin-editing-hidden');
		hiddenMarkerId = null;
	}
}

// ─── АВТОПОДСТАНОВКА ПРОВИНЦИИ ПО ПОЛОЖЕНИЮ МАРКЕРА ────────────────────────
// Пока пользователь не ввёл провинцию вручную, поле показывает подсказку по
// вектору провинций (серым, как плейсхолдер) — но это настоящее значение
// поля, оно сохранится при сохранении маркера. Если поле очистить руками,
// подсказка возвращается.
const provinceInput = document.getElementById('f-province');
let provinceIsAuto = true;
let autoProvinceValue = '';

function pointInRing(x, y, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const xi = ring[i][0], yi = ring[i][1];
		const xj = ring[j][0], yj = ring[j][1];
		const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}

function pointInPolygonRings(x, y, rings) {
	if (!pointInRing(x, y, rings[0])) return false;
	for (let i = 1; i < rings.length; i++) {
		if (pointInRing(x, y, rings[i])) return false; // попал в дырку — значит не внутри
	}
	return true;
}

function pointInGeometry(x, y, geometry) {
	if (geometry.type === 'Polygon') return pointInPolygonRings(x, y, geometry.coordinates);
	if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(rings => pointInPolygonRings(x, y, rings));
	return false;
}

function detectProvinceAt(latlng) {
	const x = latlng.lng, y = latlng.lat;
	const found = regionsProvinces.features.find(f => pointInGeometry(x, y, f.geometry));
	return found ? found.properties.name : '';
}

function applyAutoProvince(latlng) {
	autoProvinceValue = detectProvinceAt(latlng);
	if (provinceIsAuto) {
		provinceInput.value = autoProvinceValue;
		provinceInput.classList.add('auto-filled');
	}
}

provinceInput.addEventListener('input', function() {
	if (this.value.trim() === '') {
		// поле очистили руками — возвращаем подсказку по вектору
		provinceIsAuto = true;
		this.value = autoProvinceValue;
		this.classList.add('auto-filled');
	} else {
		provinceIsAuto = false;
		this.classList.remove('auto-filled');
	}
});

function setFormCoords(latlng) {
	document.getElementById('f-lng').value = latlng.lng.toFixed(1);
	document.getElementById('f-lat').value = latlng.lat.toFixed(1);
	applyAutoProvince(latlng);
}

// Смена типа локации в форме — сразу обновляем иконку чернового маркера на карте
document.getElementById('f-locationType').addEventListener('change', function() {
	if (draftMarker) {
		draftMarker.setIcon(getIcon(this.value));
		draftMarker.getElement()?.classList.add('admin-draft-icon'); // setIcon пересоздаёт DOM-элемент — подсветку нужно навесить заново
	}
});

// Превью попапа черновика — правый клик по маркеру показывает, как локация
// будет выглядеть у обычного пользователя, ещё до сохранения.
function collectDraftProps() {
	return {
		runame:      document.getElementById('f-runame').value.trim(),
		engname:     document.getElementById('f-engname').value.trim(),
		description: document.getElementById('f-description').value.trim(),
		faction:     document.getElementById('f-faction').value.trim(),
		province:    document.getElementById('f-province').value.trim(),
		image:       document.getElementById('f-image').value.trim() || undefined,
		traits:      getSelectedTraits(),
	};
}

function showDraftPreview() {
	if (!draftMarker) return;
	draftMarker.unbindPopup();
	draftMarker.bindPopup(buildPopupHTML(collectDraftProps(), { hideAdminActions: true }), { closeButton: false });
	draftMarker.openPopup();
}

function setDraftPosition(latlng) {
	setFormCoords(latlng);
	if (draftMarker) {
		draftMarker.setLatLng(latlng);
		draftMarker.setIcon(getIcon(document.getElementById('f-locationType').value));
		draftMarker.getElement()?.classList.add('admin-draft-icon'); // setIcon пересоздаёт DOM-элемент — подсветку нужно навесить заново
	} else {
		draftMarker = L.marker(latlng, {
			icon: getIcon(document.getElementById('f-locationType').value),
			zIndexOffset: 1000,
			draggable: true,
		}).addTo(map);
		draftMarker.getElement()?.classList.add('admin-draft-icon');
		// зажать и перетащить маркер — альтернатива повторному клику по карте
		draftMarker.on('drag',    () => setFormCoords(draftMarker.getLatLng()));
		draftMarker.on('dragend', () => setFormCoords(draftMarker.getLatLng()));
		// правый клик — предпросмотр попапа локации
		draftMarker.on('contextmenu', function(e) {
			L.DomEvent.preventDefault(e);
			showDraftPreview();
		});
	}
}

// Браузер не пересчитывает :hover сам по себе на любую перекладку — только
// на настоящее движение мыши. Если под неподвижным курсором элемент меняет
// личность (появился/переместился/у него сменился layout), а мышь при этом
// не шевелилась, старый наведённый элемент может "залипнуть" в :hover, пока
// по нему не кликнут или мышь не двинется хоть на пиксель. На кнопках
// тулбара описания это было видно как подсветка на «¶», не пропадающая
// сама. Форсируем пересчёт, на один тик убрав элемент из hit-теста —
// браузер заново вычисляет :hover, когда pointer-events возвращается.
function forceHoverRecalc(el) {
	el.style.pointerEvents = 'none';
	setTimeout(() => { el.style.pointerEvents = ''; }, 0);
}

function showNormalView() {
	normalView.classList.remove('hidden');
	editMarkerView.classList.add('hidden');
	clearDraftMarker();
	restoreRealMarker();
	activeMarkerId = null;
	// возвращаем обычную интерактивность регионов
	setRegionsInteractive(provinceRegions, true);
	politicalMap._syncTier(); // восстанавливает корректное состояние фракций для текущего зума
}

function showEditView() {
	normalView.classList.add('hidden');
	editMarkerView.classList.remove('hidden');
	// см. forceHoverRecalc — тут это переключение видимости display:none -> flex
	forceHoverRecalc(editMarkerView);
	// пока ставим/переносим маркер, полигоны фракций/провинций не должны
	// перехватывать клики — иначе по ним невозможно попасть кликом на карту
	setRegionsInteractive(factionRegions, false);
	setRegionsInteractive(provinceRegions, false);
}

function resetMarkerForm() {
	markerForm.reset();
	traitsIconsEl.querySelectorAll('.trait-icon-btn.selected').forEach(b => b.classList.remove('selected'));
	formErrorEl.textContent = '';
	provinceIsAuto = true;
	autoProvinceValue = '';
	provinceInput.classList.remove('auto-filled');
}

function populateAdminDatalists() {
	const factions  = [...new Set(allMarkerRows.map(m => m.faction).filter(Boolean))].sort();
	const provinces = [...new Set(allMarkerRows.map(m => m.province).filter(Boolean))].sort();
	document.getElementById('faction-options').innerHTML  = factions.map(f => `<option value="${f}">`).join('');
	document.getElementById('province-options').innerHTML = provinces.map(p => `<option value="${p}">`).join('');
}


// ─── АДМИНКА: ВСТАВКА ССЫЛКИ НА ЛОКАЦИЮ/ПРОВИНЦИЮ/ФРАКЦИЮ В ОПИСАНИЕ ───────
const descriptionInput   = document.getElementById('f-description');
const insertLinkBtn      = document.getElementById('insert-link-btn');
const linkPickerEl       = document.getElementById('link-picker');
const linkPickerSearch   = document.getElementById('link-picker-search');
const linkPickerResults  = document.getElementById('link-picker-results');

let linkInsertPos = null; // позиция курсора в textarea на момент открытия панели

// ─── АДМИНКА: ПАНЕЛЬ ФОРМАТИРОВАНИЯ ОПИСАНИЯ ───────────────────────────────
// Выделяем текст в textarea, жмём кнопку — теги оборачивают выделение (как в
// Obsidian); без выделения теги вставляются пустыми и курсор встаёт между ними.
const WRAP_TAGS = {
	p: ['<p>', '</p>'],
	b: ['<b>', '</b>'],
	i: ['<i>', '</i>'],
	blockquote: ['<blockquote>', '</blockquote>'],
};

function wrapSelection(open, close) {
	const { selectionStart: start, selectionEnd: end, value } = descriptionInput;
	const selected = value.slice(start, end);
	descriptionInput.value = value.slice(0, start) + open + selected + close + value.slice(end);
	descriptionInput.focus();
	descriptionInput.setSelectionRange(start + open.length, start + open.length + selected.length);
}

function wrapAlign(align) {
	wrapSelection(`<div style="text-align:${align}">`, '</div>');
}

function clearFormatting() {
	const { selectionStart: start, selectionEnd: end, value } = descriptionInput;
	if (start === end) {
		// ничего не выделено — снимаем разметку со всего текста
		descriptionInput.value = value.replace(/<[^>]+>/g, '');
		descriptionInput.focus();
		descriptionInput.setSelectionRange(descriptionInput.value.length, descriptionInput.value.length);
		return;
	}
	const selected = value.slice(start, end);
	const stripped = selected.replace(/<[^>]+>/g, '');
	descriptionInput.value = value.slice(0, start) + stripped + value.slice(end);
	descriptionInput.focus();
	descriptionInput.setSelectionRange(start, start + stripped.length);
}

document.querySelectorAll('.desc-toolbar .toolbar-btn').forEach(btn => {
	if (btn.id === 'insert-link-btn') return; // обрабатывается отдельно ниже (открывает link-picker)
	btn.addEventListener('click', () => {
		const wrap = btn.dataset.wrap;
		const align = btn.dataset.align;
		const action = btn.dataset.action;
		if (align) wrapAlign(align);
		else if (wrap && WRAP_TAGS[wrap]) wrapSelection(...WRAP_TAGS[wrap]);
		else if (action === 'clear') clearFormatting();
	});
});

descriptionInput.addEventListener('keydown', function(e) {
	if (!(e.ctrlKey || e.metaKey)) return;
	if (e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSelection(...WRAP_TAGS.b); }
	if (e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSelection(...WRAP_TAGS.i); }
});

// ─── АДМИНКА: РАСКРЫТИЕ ОПИСАНИЯ В БОЛЬШОЕ ОКНО ─────────────────────────────
// Тот же стиль, что у диалога "Восстановить по умолчанию" (#revert-overlay).
// Не дублируем тулбар/textarea в разметке — .desc-editor целиком переезжает
// в диалог через appendChild (со всеми уже навешанными обработчиками) и
// возвращается на своё место в форме при закрытии.
const descExpandOverlay = document.getElementById('desc-expand-overlay');
const descExpandDialog  = document.getElementById('desc-expand-dialog');
const descExpandDoneBtn = document.getElementById('desc-expand-done-btn');
const descEditorEl      = descriptionInput.closest('.desc-editor');
const descEditorHome    = descEditorEl.parentElement; // .form-field — куда возвращать при закрытии

function openDescExpand() {
	descExpandDialog.insertBefore(descEditorEl, descExpandDialog.querySelector('.form-buttons'));
	descExpandOverlay.classList.remove('hidden');
	descriptionInput.focus();
}

function closeDescExpand() {
	descExpandOverlay.classList.add('hidden');
	descEditorHome.appendChild(descEditorEl);
}

descExpandDoneBtn.addEventListener('click', closeDescExpand);
descExpandOverlay.addEventListener('mousedown', function(e) {
	if (e.target === descExpandOverlay) closeDescExpand();
});
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape' && !descExpandOverlay.classList.contains('hidden')) closeDescExpand();
});

// Клик где угодно в области описания (сама textarea, пустое место, надпись
// "Описание" — она связана с textarea через for/id и форвардит клик) —
// кроме кнопок тулбара, они и в компактном виде работают как обычно.
descEditorEl.addEventListener('click', function(e) {
	if (descExpandOverlay.contains(descEditorEl)) return; // уже открыто
	if (e.target.closest('.toolbar-btn')) return;
	openDescExpand();
});

function allLinkables() {
	const locs = allMarkerRows.map(m => ({ type: 'loc', id: m.id, label: m.runame, sub: m.province }));
	const provinces = regionsProvinces.features.map(f => ({ type: 'province', id: f.properties.id, label: f.properties.name }));
	const factions = regionsFactions.features.map(f => ({ type: 'faction', id: f.properties.id, label: f.properties.name }));
	return { locs, provinces, factions };
}

const LINK_GROUP_LABELS = { loc: 'Локации', province: 'Провинции', faction: 'Фракции' };

function renderLinkPickerResults(query) {
	const q = query.trim().toLowerCase();
	const { locs, provinces, factions } = allLinkables();
	const groups = [
		['loc', locs.filter(i => !q || i.label.toLowerCase().includes(q)).slice(0, 30)],
		['province', provinces.filter(i => !q || i.label.toLowerCase().includes(q)).slice(0, 30)],
		['faction', factions.filter(i => !q || i.label.toLowerCase().includes(q)).slice(0, 30)],
	];
	const anyResults = groups.some(([, items]) => items.length);
	if (!anyResults) {
		linkPickerResults.innerHTML = '<div class="link-picker-empty">Ничего не найдено</div>';
		return;
	}
	linkPickerResults.innerHTML = groups.map(([type, items]) => {
		if (!items.length) return '';
		const rows = items.map(i => `
			<div class="link-picker-item" data-type="${i.type}" data-id="${i.id}" data-label="${i.label.replace(/"/g, '&quot;')}">
				${i.label}${i.sub ? `<span class="lp-sub">— ${i.sub}</span>` : ''}
			</div>
		`).join('');
		return `<div class="link-picker-group-label">${LINK_GROUP_LABELS[type]}</div>${rows}`;
	}).join('');
}

function openLinkPicker() {
	linkInsertPos = descriptionInput.selectionStart ?? descriptionInput.value.length;
	const btnRect = insertLinkBtn.getBoundingClientRect();
	linkPickerEl.style.top  = `${btnRect.bottom + 4}px`;
	linkPickerEl.style.left = `${Math.max(8, btnRect.right - 280)}px`;
	linkPickerEl.classList.remove('hidden');
	linkPickerSearch.value = '';
	renderLinkPickerResults('');
	linkPickerSearch.focus();
}

function closeLinkPicker() {
	linkPickerEl.classList.add('hidden');
}

insertLinkBtn.addEventListener('click', openLinkPicker);

linkPickerSearch.addEventListener('input', function() {
	renderLinkPickerResults(this.value);
});

linkPickerResults.addEventListener('click', function(e) {
	const item = e.target.closest('.link-picker-item');
	if (!item) return;
	const { type, id, label } = item.dataset;
	const token = `[${label}](${type}:${id})`;
	const pos = linkInsertPos ?? descriptionInput.value.length;
	const before = descriptionInput.value.slice(0, pos);
	const after  = descriptionInput.value.slice(pos);
	descriptionInput.value = before + token + after;
	closeLinkPicker();
	descriptionInput.focus();
	const caret = pos + token.length;
	descriptionInput.setSelectionRange(caret, caret);
});

document.addEventListener('click', function(e) {
	if (linkPickerEl.classList.contains('hidden')) return;
	if (linkPickerEl.contains(e.target) || e.target === insertLinkBtn) return;
	closeLinkPicker();
});

document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape' && !linkPickerEl.classList.contains('hidden')) closeLinkPicker();
});

function openMarkerForEdit(row) {
	resetMarkerForm();
	activeMarkerId = row.id;
	editMarkerTitle.textContent = row.runame;
	deleteMarkerBtn.classList.remove('hidden');
	placeHint.classList.add('hidden');
	document.getElementById('f-runame').value       = row.runame ?? '';
	document.getElementById('f-engname').value      = row.engname ?? '';
	document.getElementById('f-description').value  = row.description ?? '';
	document.getElementById('f-faction').value      = row.faction ?? '';
	document.getElementById('f-province').value     = row.province ?? '';
	provinceIsAuto = false; // у существующей локации провинция уже осознанно задана, не подсказка
	document.getElementById('f-locationType').value = row.location_type ?? 'city';
	document.getElementById('f-image').value        = row.image ?? '';
	(row.traits ?? []).forEach(t => {
		const btn = traitsIconsEl.querySelector(`.trait-icon-btn[data-key="${t}"]`);
		if (btn) btn.classList.add('selected');
	});
	revertDefaultBtn.classList.toggle('hidden', !row.is_default);
	map.closePopup();
	showEditView();
	hideRealMarker(row.id);
	setDraftPosition(L.latLng(row.lat, row.lng));
	map.panTo(L.latLng(row.lat, row.lng));
}

addMarkerBtn.addEventListener('click', function() {
	resetMarkerForm();
	activeMarkerId = null;
	editMarkerTitle.textContent = 'Новый маркер';
	deleteMarkerBtn.classList.add('hidden');
	revertDefaultBtn.classList.add('hidden');
	placeHint.classList.remove('hidden');
	clearDraftMarker();
	showEditView();
});

editBackBtn.addEventListener('click', showNormalView);

// Клик по карте, пока открыта форма — ставит/переносит черновой маркер.
// Пока идёт измерение расстояния, координаты трогать не даём.
map.on('click', function(e) {
	if (editMarkerView.classList.contains('hidden')) return;
	if (measuringActive) return;
	setDraftPosition(e.latlng);
});

markerForm.addEventListener('submit', async function(e) {
	e.preventDefault();
	formErrorEl.textContent = '';

	const lng = parseFloat(document.getElementById('f-lng').value);
	const lat = parseFloat(document.getElementById('f-lat').value);
	if (Number.isNaN(lng) || Number.isNaN(lat)) {
		formErrorEl.textContent = 'Кликните по карте, чтобы указать положение маркера';
		return;
	}

	const traits = getSelectedTraits();

	const payload = {
		runame:        document.getElementById('f-runame').value.trim(),
		engname:       document.getElementById('f-engname').value.trim() || null,
		description:   document.getElementById('f-description').value.trim(),
		faction:       document.getElementById('f-faction').value.trim(),
		province:      document.getElementById('f-province').value.trim(),
		location_type: document.getElementById('f-locationType').value,
		traits,
		image:         document.getElementById('f-image').value.trim() || null,
		lng, lat,
	};

	const query = activeMarkerId
		? supabaseClient.from('markers').update(payload).eq('id', activeMarkerId)
		: supabaseClient.from('markers').insert(payload);

	const result = await runWrite(query);
	if (!result.ok) {
		formErrorEl.textContent = 'Не удалось сохранить: ' + result.message;
		return;
	}

	await loadMarkers();
	showNormalView();
});

deleteMarkerBtn.addEventListener('click', async function() {
	if (!activeMarkerId) return;
	if (!confirm('Удалить этот маркер?')) return;
	const result = await runWrite(supabaseClient.from('markers').delete().eq('id', activeMarkerId));
	if (!result.ok) {
		formErrorEl.textContent = 'Не удалось удалить: ' + result.message;
		return;
	}
	await loadMarkers();
	showNormalView();
});


// ─── АДМИНКА: ОТКАТ ИЗНАЧАЛЬНОЙ ЛОКАЦИИ К УМОЛЧАНИЮ ────────────────────────
// is_default/default_data проставлены для всех локаций, которые были в проекте
// до появления админки (см. set_default_snapshots.sql) — только у них есть
// кнопка отката, у добавленных через админку её нет.
const revertOverlay  = document.getElementById('revert-overlay');
const revertCompare  = document.getElementById('revert-compare');
const revertConfirm  = document.getElementById('revert-confirm-btn');
const revertCancel   = document.getElementById('revert-cancel-btn');

const REVERT_FIELDS = [
	['runame',        'Название (рус)'],
	['engname',       'Название (англ)'],
	['description',   'Описание'],
	['faction',       'Фракция'],
	['province',      'Провинция'],
	['location_type', 'Тип'],
	['traits',        'Особенности'],
	['image',         'Картинка'],
];

function formatRevertValue(v) {
	if (v === null || v === undefined || v === '') return '—';
	if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
	return String(v);
}

// Один блок на поле: подпись на всю ширину + пара значений в общем грид-ряду —
// так строка автоматически растёт под более длинное из двух значений, и
// «сейчас»/«по умолчанию» остаются на одной высоте именно для этого поля.
function renderRevertCompare(current, defaults) {
	const rows = REVERT_FIELDS.map(([key, label]) => {
		const same = JSON.stringify(current[key] ?? null) === JSON.stringify(defaults[key] ?? null);
		return `
			<div class="revert-field">
				<div class="revert-field-label">${label}</div>
				<div class="revert-field-values">
					<div class="revert-value ${same ? '' : 'diff'}">${formatRevertValue(current[key])}</div>
					<div class="revert-value ${same ? '' : 'diff'}">${formatRevertValue(defaults[key])}</div>
				</div>
			</div>
		`;
	});
	const coordsSame = current.lng === defaults.lng && current.lat === defaults.lat;
	rows.push(`
		<div class="revert-field">
			<div class="revert-field-label">Координаты</div>
			<div class="revert-field-values">
				<div class="revert-value ${coordsSame ? '' : 'diff'}">${current.lng}, ${current.lat}</div>
				<div class="revert-value ${coordsSame ? '' : 'diff'}">${defaults.lng}, ${defaults.lat}</div>
			</div>
		</div>
	`);
	revertCompare.innerHTML = rows.join('');
}

revertDefaultBtn.addEventListener('click', function() {
	const row = allMarkerRows.find(r => r.id === activeMarkerId);
	if (!row || !row.default_data) return;
	renderRevertCompare(row, row.default_data);
	revertOverlay.classList.remove('hidden');
});

revertCancel.addEventListener('click', () => revertOverlay.classList.add('hidden'));

revertConfirm.addEventListener('click', async function() {
	const row = allMarkerRows.find(r => r.id === activeMarkerId);
	if (!row || !row.default_data) return;
	const d = row.default_data;
	const result = await runWrite(supabaseClient.from('markers').update({
		runame: d.runame, engname: d.engname, description: d.description,
		faction: d.faction, province: d.province, location_type: d.location_type,
		traits: d.traits, image: d.image, lng: d.lng, lat: d.lat,
	}).eq('id', row.id));
	if (!result.ok) {
		alert('Не удалось восстановить: ' + result.message);
		return;
	}
	revertOverlay.classList.add('hidden');
	await loadMarkers();
	const fresh = allMarkerRows.find(r => r.id === row.id);
	if (fresh) openMarkerForEdit(fresh);
});

// Ссылка на локацию/провинцию/фракцию внутри описания (см. renderDescription) —
// работает для всех посетителей, не только для админа.
document.addEventListener('click', function(e) {
	const descLink = e.target.closest('.desc-link');
	if (descLink?.dataset.refType) {
		const { refType, refId } = descLink.dataset;
		if (refType === 'loc') {
			const marker = markersById[refId];
			if (marker) {
				focusLatLng(marker.getLatLng());
				setTimeout(() => marker.openPopup(), FOCUS_FLY_DURATION * 1000);
			}
		} else {
			focusRegion(refId);
		}
	}
});

// Иконка редактирования внутри попапа локации — попап каждый раз создаётся
// заново, поэтому слушаем клики через делегирование на document. Удаление
// теперь только из самой формы редактирования (см. deleteMarkerBtn ниже).
document.addEventListener('click', function(e) {
	const editLink = e.target.closest('[data-edit-marker]');
	if (editLink?.dataset.editMarker) {
		const row = allMarkerRows.find(r => r.id === editLink.dataset.editMarker);
		if (row) openMarkerForEdit(row);
	}
});