const imgWidth  = 5760;
const imgHeight = 4480;

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
const regionsRenderer = L.svg({ padding: 2 });

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
// Начиная с зума REGIONS_EDGE_BLUR_MIN_ZOOM (ближе всего к базовой карте)
// края векторных полигонов чуть смягчаются фильтром blur, чтобы лучше
// вписываться в растровую подложку. Меняйте эти две константы, чтобы
// настроить силу/порог размытия.
const REGIONS_EDGE_BLUR_PX       = 2;
const REGIONS_EDGE_BLUR_MIN_ZOOM = 0;

const regionLayerById = {};

function buildRegionPopupHTML(props) {
	const showOwner = props.owner && props.owner !== props.name;
	return `
		<div class="popup-content region-popup">
			<div class="popup-text">
				<div class="title-row"><h1>${props.name ?? ''}</h1></div>
				${props.engname
					? `<p class="name-eng">${props.engname}</p>`
					: ''}
				${showOwner ? buildIconRow(FACTION_ICON, props.owner) : ''}
				${props.description
					? `<div class="description">${props.description}</div>`
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
			layer.bindPopup(buildRegionPopupHTML(props));

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

		const blurred = this._map.getZoom() >= REGIONS_EDGE_BLUR_MIN_ZOOM;
		this._map.getPane('regionsPane').style.filter = blurred ? `blur(${REGIONS_EDGE_BLUR_PX}px)` : '';
	}
});

var politicalMap = new PoliticalLayer();

// Показать регион на карте (используется поиском/списком в сайдбаре)
function focusRegion(id) {
	if (!map.hasLayer(politicalMap)) {
		document.getElementById('layer-toggle-political').click();
	}
	const layer = regionLayerById[id];
	if (!layer) return;
	map.flyToBounds(layer.getBounds(), { maxZoom: -1 });
	setTimeout(() => layer.openPopup(layer.getBounds().getCenter()), 300);
}


// ─── MARKER GROUPS ────────────────────────────────────────────────────────
var cities       	 = L.layerGroup();
var towns  		 	 = L.layerGroup();
var forts        	 = L.layerGroup();
var camps        	 = L.layerGroup();
var shrines      	 = L.layerGroup();
var pointsOfInterest = L.layerGroup();
var polarGates   	 = L.layerGroup();


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
];

const MAP_LAYERS = [
	{ label: 'Политическая карта', layer: politicalMap, defaultOn: true, id: 'layer-toggle-political' },
	{ label: 'Провинции',          layer: provinces,    defaultOn: true },
];


// ─── ТИПЫ ЛОКАЦИЙ ─────────────────────────────────────────────────────────
const LOCATION_ICONS = {
	'town':		       	   { url: 'images/icons/town.png',			     size: [28, 28] },
	'city':       	   	   { url: 'images/icons/city.png',			     size: [30, 30] },
	'fort':          	   { url: 'images/icons/fort.png',        		 size: [28, 28] },
	'camp':          	   { url: 'images/icons/camp.png',        		 size: [24, 24] },
	'pointOfInterest':	   { url: 'images/icons/pointOfInterest.png',	 size: [24, 24] },
	'shrine':              { url: 'images/icons/shrine.png',             size: [24, 24] },
	'polarGates':          { url: 'images/icons/polarGates.png',         size: [24, 24] },
	'polarGatesBroken':    { url: 'images/icons/polarGatesBroken.png',   size: [24, 24] },
	'default':             { url: 'images/icons/settlement.png',         size: [24, 24] },
};

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
function buildPopupHTML(props) {
	return `
		<div class="popup-content">
			${props.image
				? `<img class="location-img" src="${props.image}" alt="">`
				: ''}
			<div class="popup-text">
				<div class="title-row">
					<h1>${props.runame ?? ''}</h1>
					<div class="traits">${buildTraitsHTML(props.traits)}</div>
				</div>
				${props.engname
					? `<p class="name-eng">${props.engname}</p>`
					: ''}
				${props.description
					? `<div class="description">${props.description}</div>`
					: ''}
				${buildIconRow(FACTION_ICON,  props.faction)}
				${buildIconRow(PROVINCE_ICON, props.province)}
			</div>
		</div>
	`;
}


// ─── DISPLAY MARKERS ──────────────────────────────────────────────────────
const markerByName = {};   // для навигации из списка локаций

markerLocations.features.forEach(function(feature) {
	const coords = feature.geometry.coordinates;
	const latlng = L.latLng(coords[1], coords[0]);

	const marker = L.marker(latlng, {
		icon: getIcon(feature.properties.locationType)
	});
	marker.bindPopup(buildPopupHTML(feature.properties));

	markerByName[feature.properties.runame] = marker;

	switch (feature.properties.locationType) {
		case 'city': 			 marker.addTo(cities); break;
		case 'town':	 		 marker.addTo(towns); break;
		case 'fort': 			 marker.addTo(forts); break;
		case 'camp': 			 marker.addTo(camps); break;
		case 'shrine':			 marker.addTo(shrines); break;
		case 'pointOfInterest':  marker.addTo(pointsOfInterest); break;
		case 'polarGates':
		case 'polarGatesBroken': marker.addTo(polarGates); break;
	}
});


// ─── ДОБАВЛЯЕМ СЛОИ НА КАРТУ СОГЛАСНО defaultOn ───────────────────────────
MARKER_LAYERS.forEach(({ group, defaultOn }) => {
	if (defaultOn) map.addLayer(group);
});
MAP_LAYERS.forEach(({ layer, defaultOn }) => {
	if (defaultOn) map.addLayer(layer);
});


// ─── SIDEBAR: ЧЕКБОКСЫ МАРКЕРОВ ───────────────────────────────────────────
const individualContainer = document.getElementById('individual-checkboxes');

MARKER_LAYERS.forEach(({ label, group, defaultOn, icons }) => {
    const lbl = document.createElement('label');
    lbl.className = 'layer-checkbox';

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = defaultOn;
    cb.addEventListener('change', function() {
        if (this.checked) map.addLayer(group);
        else              map.removeLayer(group);
        updateMasterCheckbox();
    });

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;

    const iconsDiv = document.createElement('div');
    iconsDiv.className = 'layer-icons';
    (icons ?? []).forEach(src => {
        const img = document.createElement('img');
        img.src       = src;
        img.className = 'layer-icon';
        iconsDiv.appendChild(img);
    });

    lbl.appendChild(cb);
    lbl.appendChild(labelSpan);
    lbl.appendChild(iconsDiv);
    individualContainer.appendChild(lbl);
});

// Мастер-чекбокс
const masterCb = document.getElementById('toggle-all-markers');

masterCb.addEventListener('change', function() {
	const checked = this.checked;
	individualContainer.querySelectorAll('input').forEach((cb, i) => {
		cb.checked = checked;
		if (checked) map.addLayer(MARKER_LAYERS[i].group);
		else         map.removeLayer(MARKER_LAYERS[i].group);
	});
});

function updateMasterCheckbox() {
	const cbs       = [...individualContainer.querySelectorAll('input')];
	const allOn     = cbs.every(cb => cb.checked);
	const allOff    = cbs.every(cb => !cb.checked);
	masterCb.checked       = allOn;
	masterCb.indeterminate = !allOn && !allOff;
}

updateMasterCheckbox();


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
		header.textContent = province;
		header.dataset.name    = province.toLowerCase();
		header.dataset.owner   = (meta?.owner ?? '').toLowerCase();
		header.dataset.engname = (meta?.engname ?? '').toLowerCase();
		if (meta?.id) header.classList.add('has-region');
		header.addEventListener('click', () => {
			provDiv.classList.toggle('collapsed');
			if (meta?.id) focusRegion(meta.id);
		});
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
					const marker = markerByName[f.properties.runame];
					if (marker) {
						map.setView(marker.getLatLng(), 0);
						setTimeout(() => marker.openPopup(), 250);
					}
				});

				ul.appendChild(li);
			});

		provDiv.appendChild(ul);
		container.appendChild(provDiv);
	});
}

buildLocationList(markerLocations.features);


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
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar       = document.getElementById('sidebar');

sidebarToggle.addEventListener('click', function() {
	sidebar.classList.toggle('collapsed');
	this.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
});


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
map.on('popupopen', function(e) {
	const popup   = e.popup.getElement();
	const content = popup.querySelector('.popup-content');
	const h1      = popup.querySelector('h1');
	const traits  = popup.querySelector('.traits');

	content.style.width = '';

	if (h1 && traits && traits.children.length) {
		const neededWidth = h1.scrollWidth + 8 + traits.offsetWidth + 50;
		if (neededWidth > 270) content.style.width = neededWidth + 'px';
	}
});


// ─── ТУЛТИП ───────────────────────────────────────────────────────────────
const traitTooltip = document.createElement('div');
traitTooltip.className = 'trait-tooltip';
document.body.appendChild(traitTooltip);
let pinned = false;

document.addEventListener('mouseover', function(e) {
	if (pinned) return;
	const trait = e.target.closest('.trait');
	if (trait) {
		traitTooltip.innerHTML = TRAITS[trait.dataset.key]?.tooltip ?? '';
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
	if (trait) {
		traitTooltip.innerHTML = TRAITS[trait.dataset.key]?.tooltip ?? '';
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