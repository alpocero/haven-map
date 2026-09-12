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
// isAdmin читается из questVisible(), а он вызывается уже при сборке попапов
// провинций/фракций ниже (см. блок «ЗАДАНИЯ»); полноценно выставляется в блоке
// «АДМИНКА: ВХОД». До этого — false (аноним).
let isAdmin = false;

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


// ─── ЗАДАНИЯ (КВЕСТЫ): базовые константы и индексы ──────────────────────────
// Объявлено здесь, у самого верха: buildRegionPopupHTML() строит попап провинции
// и вызывает questBlockInnerHTML() уже на этапе makeRegionLayer() ниже — к тому
// моменту эти Map/const должны существовать (иначе TDZ у let/const).
// Задание — отдельная сущность в таблице Supabase `quests`, а НЕ тип локации и
// не значение в markers.traits. У задания есть «якорь»: локация / провинция /
// точка на карте / без места (только в журнале). Роль берётся из isAdmin
// (см. блок «АДМИНКА»): вошёл админ → «Мастер» (видит слухи, значки +),
// аноним → «Игрок» (слухи не приходят даже из БД — политика RLS).
// Палитра статусов — из design_handoff_quests_in_locations/README.md.
// «Провалено» — отдельный статус в БД и в форме админа, но НЕ отдельный чип
// фильтра: пользователь переключает только «Завершено», и под ним видны и
// done, и failed — они отличаются только иконкой (см. quest-status-failed.svg),
// цвет/зачёркивание/сортировка/счётчики everywhere те же, что у done.
// normalizedQuestStatus() — единственное место, где failed «прикидывается»
// done для фильтра/сортировки/счётчиков; сам q.status остаётся 'failed'.
const QUEST_STATUS = {
	rumor:  { label: 'Слух',      ink: '#6A655D', fill: '#282726', line: '#3E3C3A' },
	known:  { label: 'Известно',  ink: '#998C7C', fill: '#3E3C3A', line: '#6A655D' },
	active: { label: 'Активно',   ink: '#EFE7D6', fill: '#C9A24D', line: '#96763E' },
	done:   { label: 'Завершено', ink: '#787167', fill: '#4D3C1A', line: '#4D3C1A' },
	failed: { label: 'Провалено', ink: '#787167', fill: '#4D3C1A', line: '#4D3C1A' },
};
const QUEST_STATUS_ORDER = ['rumor', 'known', 'active', 'done'];
function normalizedQuestStatus(status) {
	return status === 'failed' ? 'done' : status;
}
// Порядок вывода в «Журнале заданий»: активные → известные → завершённые.
// Админу перед активными идут слухи; у обычного пользователя строк-слухов
// нет вовсе (questVisible + RLS), поэтому массив общий.
const QUEST_JOURNAL_ORDER = ['rumor', 'active', 'known', 'done'];
const QUEST_ICON = 'images/icons/quest.png';
// насечка для перетаскивания задания (видна только админу) — ассет из макета
// «Sidebar — Карта Хейвена (admin)» (node 254:1525, компонент quest-drag):
// шесть плашек с градиентом #3E3C3A→#6A655D, внутренним светом и зерном.
const QUEST_GRIP_SVG = '<img src="images/ui/quest-drag.svg" width="8.5" height="12" alt="">';
// «＋» в шапке блока заданий попапа — тот же глиф, что у .fx-icon--plus в сайдбаре.
const PLUS_ICON_SVG = '<svg viewBox="1 1 10 10" width="10" height="10" aria-hidden="true" focusable="false"><path d="M6.99512 4.99512H11L10 6.99512H6.99512V10L4.99512 11V6.99512H1L2 4.99512H4.99512V2L6.99512 1V4.99512Z" fill="currentColor"/></svg>';

let allQuestRows = [];               // сырые строки из Supabase
let questsById   = new Map();        // id -> строка
const questsByLocationId = new Map();// markers.id -> [строки заданий]  (anchor_kind='location')
const questsByProvinceId = new Map();// id провинции -> [строки заданий] (anchor_kind='province')
const questMarkers = new Map();      // id задания -> Leaflet-маркер (anchor_kind='point')
const questPointLayer = L.layerGroup();

// Ветки заданий (quest_branches) — условный хаб для группы заданий, никогда не
// отображается на карте. Задание попадает в ветку через quests.branch_id;
// quests.branch_step задаёт порядок внутри ветки: у всех NULL — без порядка,
// разные числа — последовательность шагов. Внутри одного шага решает
// quests.branch_or_group (см. branchGroupKey ниже): одна и та же группа у
// 2+ заданий — все они обязательны вместе («и», единая альтернатива), разные
// группы (или группа не указана — тогда у каждого задания она своя,
// единственная) — взаимоисключающие альтернативы шага («или», нужна любая
// одна). Это и покрывает случай «группа из N заданий ИЛИ одно задание».
let allBranchRows = [];              // сырые строки из Supabase (quest_branches)
let branchesById  = new Map();       // id -> строка ветки
const questsByBranchId = new Map();  // branch id -> [строки заданий]
const collapsedBranchIds = new Set();// свёрнутые (по умолчанию все ветки развёрнуты)
const CHEVRON_SVG = '<svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0L4 5L8 0H0Z" fill="currentColor"/></svg>';

// «Завершено» по умолчанию выключено, как в прототипе. Чип «Слух» рисуется
// только админу; для анонима строк со статусом rumor всё равно нет в данных.
const questStatusFilter = { rumor: true, known: true, active: true, done: false };

function questVisible(q) {
	if (!questStatusFilter[normalizedQuestStatus(q.status)]) return false;
	if (!isAdmin && q.status === 'rumor') return false; // подстраховка поверх RLS
	return true;
}

function questAnchorLabel(q) {
	if (q.anchor_kind === 'location') {
		const row = markerRowById.get(q.anchor_location_id);
		return 'в локации: ' + (row ? row.runame : '—');
	}
	if (q.anchor_kind === 'province') {
		return 'в провинции: ' + (provinceNameById[q.anchor_province_id] || '—');
	}
	if (q.anchor_kind === 'point') return 'своя точка на карте';
	return 'без места';
}

// Строка «локации» под названием задания в Журнале: «Тип места Название», где
// тип — цветом .journal-row-anchor, а название — ссылкой (.desc-link, как в
// описаниях попапов). Сам переход делает общий обработчик клика по .journal-row
// (по anchor_kind), ссылка здесь — только вид.
//   location  → «Локация <ссылка>»
//   province  → «Провинция <ссылка>»
//   point     → как «Новый маркер»: по координатам сами находим провинцию —
//               «В провинции <ссылка>»; ни в одну не попал — «В неизведанных землях»
//   иначе (unplaced / нет якоря / битая привязка) → «Где-то в мире»
// Название привязки задания для поиска — то же, что видно в строке журнала:
// локация → её имя (рус + англ), провинция → её имя, точка → провинция под ней.
function questAnchorSearchText(q) {
	if (q.anchor_kind === 'location') {
		const row = markerRowById.get(q.anchor_location_id);
		return row ? `${row.runame || ''} ${row.engname || ''}` : '';
	}
	if (q.anchor_kind === 'province') {
		return provinceNameById[q.anchor_province_id] || '';
	}
	if (q.anchor_kind === 'point' && q.lng != null && q.lat != null) {
		return detectProvinceAt({ lat: q.lat, lng: q.lng }) || '';
	}
	return '';
}

function questJournalAnchorHTML(q) {
	if (q.anchor_kind === 'location') {
		const row = markerRowById.get(q.anchor_location_id);
		return row ? `Локация <a class="desc-link">${row.runame}</a>` : 'Где-то в мире';
	}
	if (q.anchor_kind === 'province') {
		const name = provinceNameById[q.anchor_province_id];
		return name ? `Провинция <a class="desc-link">${name}</a>` : 'Где-то в мире';
	}
	if (q.anchor_kind === 'point' && q.lng != null && q.lat != null) {
		const name = detectProvinceAt({ lat: q.lat, lng: q.lng });
		return name ? `В провинции <a class="desc-link">${name}</a>` : 'В неизведанных землях';
	}
	return 'Где-то в мире';
}

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


// ─── ПОДПИСИ ЛОКАЦИЙ ПОД ИКОНКОЙ (только на приближённом зуме) ─────────────
// На zoom 0 и 1 под каждой иконкой маркера появляется её название (runame) —
// см. компонент zoom-location-name в Figma. На более далёком зуме (-5..-1)
// подписей нет — иначе при большом числе маркеров карта была бы захламлена.
// Реализовано постоянными (permanent) Leaflet-тултипами, а не перерисовкой
// маркеров: видимость переключается одним классом на #map через CSS
// (.show-location-names), без обхода каждого маркера на каждый zoomend.
// В CSS подпись прячется visibility:hidden, а не display:none — иначе Leaflet
// на переходе через порог зума меряет ширину скрытого (0px) тултипа и не
// центрирует его; подробнее см. .location-name-label в style.css.
const LOCATION_NAME_MIN_ZOOM = 0;
// Мастер-выключатель из секции «Слои карты» (см. MAP_LAYERS). Пока включён —
// подписи ведут себя как раньше (видны на zoom >= порога); когда выключен —
// не показываются ни на каком зуме. Слой «Провинции» приглушать не нужно
// отдельно: правило #map.show-location-names .leaflet-provinces-pane в style.css
// завязано на тот же класс, поэтому при снятом классе opacity сам вернётся к 1.
let locationNamesEnabled = true;
function updateLocationNameVisibility() {
	const show = locationNamesEnabled && map.getZoom() >= LOCATION_NAME_MIN_ZOOM;
	document.getElementById('map').classList.toggle('show-location-names', show);
}
// Появление подписей оставляем на zoomend (в CSS у него ещё и небольшая
// задержка — чтобы названия «оседали» уже после остановки карты). А вот
// УБИРАТЬ их нужно сразу на старте зум-аута за порог: если ждать zoomend, всю
// зум-анимацию (~0.25 с) названия висят поверх уже «уехавшей» карты — это и был
// тот неприятный момент. zoomanim несёт целевой зум (e.zoom) и срабатывает в
// самом начале анимации, поэтому класс снимаем досрочно по нему; финальный
// zoomend ниже всё равно приведёт состояние в соответствие с фактическим зумом.
map.on('zoomanim', (e) => {
	if (e.zoom < LOCATION_NAME_MIN_ZOOM) {
		document.getElementById('map').classList.remove('show-location-names');
	}
});
map.on('zoomend', updateLocationNameVisibility);
updateLocationNameVisibility();

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

// ─── ЛЁГКИЙ MARKDOWN В ОПИСАНИИ ─────────────────────────────────────────────
// Раньше форматирование вставлялось сырыми HTML-тегами прямо в текст (<b>,
// <p>, <blockquote>...) — в textarea это выглядело нагромождением тегов.
// Ссылки такими не были с самого начала (см. DESC_LINK_RE выше) — тот же
// принцип распространили на остальное: **жирный**, _курсив_, пустая строка
// между строк — новый абзац, ">" в начале строки — цитата (можно на
// несколько строк и абзацев внутри). Выравнивание готового markdown-
// синтаксиса не имеет — как и раньше, вставляется сырым
// <div style="text-align:...">, и здесь просто проходит насквозь как есть.
//
// Обратная совместимость со старыми описаниями (целиком сырой HTML, без
// единого markdown-символа) — тем же способом: «абзац» (кусок между пустыми
// строками), уже начинающийся с "<", в <p> повторно не оборачивается, а
// проходит как есть — так старые записи продолжают рендериться ровно как до
// перехода.
function renderInlineMarkdown(text) {
	return text
		.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
		.replace(/_([^_]+)_/g, '<i>$1</i>');
}

function renderMarkdownBlock(block) {
	const trimmed = block.trim();
	if (!trimmed) return '';
	if (trimmed.startsWith('<')) return trimmed; // старый HTML или div-выравнивание — не трогаем

	const lines = trimmed.split('\n');
	if (lines.every(l => l.trim().startsWith('>') || !l.trim())) {
		// цитата: снимаем ">" с каждой строки и внутри применяем те же правила
		// абзацев/переносов (пустая строка — новый <p>, одиночный \n — <br>)
		const inner = lines.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
		const innerHtml = inner.split(/\n\s*\n/).map(renderMarkdownBlock).join('');
		return `<blockquote>${innerHtml}</blockquote>`;
	}

	const withBr = renderInlineMarkdown(trimmed).replace(/\n/g, '<br>');
	return `<p>${withBr}</p>`;
}

function renderDescription(text) {
	if (!text) return text;
	const html = text.split(/\n\s*\n/).map(renderMarkdownBlock).join('');
	return html.replace(DESC_LINK_RE, (match, label, type, id) => {
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
				${props.tier === 'province' && props.id
					? `<div class="popup-quests">${questBlockInnerHTML('province', props.id)}</div>`
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

// Единый переход к точке (маркер/провинция/фракция). Зум пользователя
// сохраняется, если он уже не меньше зума провинций — иначе подтягиваем до него.
//
// НЕ используем map.flyTo: его кривая (Ван Вейк–Нуутинен) меняет зум НА КАЖДОМ
// кадре («отъезд назад и влёт внутрь»), а на любое изменение зума ~475
// permanent-тултипов подписей локаций (тяжёлых: 3px -webkit-text-stroke +
// тройная тень) и ~480 маркеров пересчитывают позицию в JS на главном потоке —
// он захлёбывается, полёт идёт в 5–10 fps. panTo и animate-setView двигают
// только _mapPane (CSS-переход на композиторе), покадровых zoom-событий нет —
// так же гладко, как ручное перетаскивание карты.
const FOCUS_FLY_DURATION = 0.5; // сек — длительность пан-анимации И задержка перед открытием попапа

function focusLatLng(latlng) {
	const targetZoom = Math.max(map.getZoom(), POLITICAL_TIER_ZOOM_BREAK);
	if (map.getZoom() === targetZoom) {
		// зум не меняется — плавный пан (нулевой сдвиг Leaflet сам не-опит)
		map.panTo(latlng, { animate: true, duration: FOCUS_FLY_DURATION, easeLinearity: 0.3 });
	} else {
		// нужно ещё и приблизиться — штатная зум-анимация Leaflet (CSS-transition
		// на _mapPane; zoom-событие поднимается только на zoomend, не покадрово)
		map.setView(latlng, targetZoom, { animate: true });
	}
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
	setTimeout(() => {
		layer.openPopup(center);
		fitPopupWidth(layer.getPopup()); // на случай, если попап и так уже был открыт — см. комментарий у fitPopupWidth
	}, FOCUS_FLY_DURATION * 1000);
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
// size — родной размер иконки в новой системе переключателей (см.
// ICON_TOGGLE_FX_HTML/iconToggleIconHTML): 18px у город/поселение/форт,
// 16px у остальных — как в компонентах COMPONENTS__LOCATION-TYPE в Figma.
const MARKER_LAYERS = [
    { label: 'Город',         		group: cities,			       defaultOn: true,  		icons: ['images/icons/city.png'], size: 18 },
    { label: 'Поселение',      		group: towns,					defaultOn: true,  		icons: ['images/icons/town.png'], size: 18 },
    { label: 'Форт',          		group: forts,        			defaultOn: true,  		icons: ['images/icons/fort.png'], size: 18 },
    { label: 'Лагерь',         		group: camps,			        defaultOn: true,  		icons: ['images/icons/camp.png'], size: 16 },
    { label: 'Святилище', 	   		group: shrines,      			defaultOn: true,		icons: ['images/icons/shrine.png'], size: 16 },
	{ label: 'Точка интереса',		group: pointsOfInterest, 		defaultOn: true,		icons: ['images/icons/pointOfInterest.png'], size: 16 },
    { label: 'Врата Древних',  		group: polarGates,   			defaultOn: false,  		icons: ['images/icons/polarGates.png'], size: 16 },
    { label: 'Задание',        		group: quests,       			defaultOn: true,  		icons: ['images/icons/quest.png'], size: 16 },
];

const MAP_LAYERS = [
	{ label: 'Политическая карта', layer: politicalMap, defaultOn: false, id: 'layer-toggle-political' },
	{ label: 'Провинции',          layer: provinces,    defaultOn: true },
	// Не Leaflet-слой, а мастер-выключатель подписей локаций: вместо layer у него
	// onToggle (см. цикл построения чекбоксов и стартовый цикл ниже).
	{ label: 'Названия локаций',   defaultOn: true, onToggle: on => { locationNamesEnabled = on; updateLocationNameVisibility(); } },
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
	'port':            { icon: 'images/icons/port.png',            tooltip: 'Порт' },
	'mountain':        { icon: 'images/icons/mountain.png',        tooltip: 'Гора' },
	'colony':          { icon: 'images/icons/colony.png',          tooltip: 'Древняя колония высших эльфов' },
	'forest':          { icon: 'images/icons/forest.png',          tooltip: 'Лес' },
	'sword_of_khaine': { icon: 'images/icons/sword_of_khaine.png', tooltip: '<b>Меч Кхейна</b><br><br><p style="color: #787167; margin: 0;">Некоторые считают этот меч самым могущественным оружием в мире, способным низвергать даже богов. Говорят, что сила этого артефакта настолько велика, что его повторное использование способно перекроить судьбы эльфов и изменить ход мировой истории.</p>' },
};

// Персонажи — по сути тоже "системные" особенности (не показываются в
// попапе, см. buildTraitsHTML — он смотрит только в TRAITS), но, в отличие
// от свободных системных, у них заранее заведённый список со своими
// иконками — отдельная группа и в форме маркера, и в фильтрах.
const CHARACTER_TRAITS = {
	'algalon': { icon: 'images/icons/algalon.png', tooltip: 'Алгалон' },
	'ulfric':  { icon: 'images/icons/ulfric.png',  tooltip: 'Ульфрик' },
	'mane':    { icon: 'images/icons/mane.png',    tooltip: 'Грива'   },
	'vein':    { icon: 'images/icons/vein.png',    tooltip: 'Вейн'    },
	'mitra':   { icon: 'images/icons/mitra.png',   tooltip: 'Митра'   },
};


function buildTraitsHTML(traits) {
	if (!traits?.length) return '';
	return traits.map(key => {
		const t = TRAITS[key];
		if (!t) return '';
		return `<div class="trait" data-key="${key}"><img src="${t.icon}" alt=""></div>`;
	}).join('');
}

// «Системные» особенности (свободные, без иконки) — не заведены заранее ни в
// TRAITS, ни в CHARACTER_TRAITS, а просто произвольные строки в
// markers.traits. buildTraitsHTML above молча пропускает любой ключ, которого
// нет в TRAITS (значит и персонажей тоже), поэтому ни те, ни другие никогда
// не подсвечиваются в попапе — этого достаточно, отдельного признака
// "системная"/«персонаж» в данных не нужно. Список для формы
// редактирования/панели фильтров собирается на лету из уже существующих
// маркеров.
function getAllSystemTraitKeys() {
	const set = new Set();
	allMarkerRows.forEach(row => (row.traits ?? []).forEach(t => {
		if (!TRAITS[t] && !CHARACTER_TRAITS[t]) set.add(t);
	}));
	return [...set].sort((a, b) => a.localeCompare(b, 'ru'));
}


// ─── ПОПАП ────────────────────────────────────────────────────────────────
// Картинки локаций временно отключены (не удалены — сами файлы и пути в
// данных остаются как есть, просто не рендерим <img>). Чтобы вернуть,
// поставить обратно true.
const SHOW_LOCATION_IMAGES = false;

function buildPopupHTML(props, opts = {}) {
	// Переход к правке локации — на самом заголовке (только у админа, не в
	// черновике). Клик ловит общий делегат по [data-edit-marker].
	const editable = isAdmin && !opts.hideAdminActions && props.id;
	const questsHTML = props.id ? questBlockInnerHTML('location', props.id) : '';

	// «Фракция» / «Провинция»: слово — капсом (CSS), название — как в данных, но
	// с заглавной первой буквы; если у названия есть регион на политической карте,
	// это ссылка (клик — переход к региону, как у desc-link province/faction).
	const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
	const footerItem = (label, val, refType, refId) => {
		if (!val) return `<span class="popup-footer-item"></span>`;
		const value = refId
			? `<a class="desc-link popup-footer-val" data-ref-type="${refType}" data-ref-id="${refId}">${cap(val)}</a>`
			: `<span class="popup-footer-val">${cap(val)}</span>`;
		return `<span class="popup-footer-item"><span class="popup-footer-label">${label}</span> ${value}</span>`;
	};
	const footerHTML = (props.faction || props.province)
		? `<div class="popup-footer">`
			+ footerItem('Фракция:',  props.faction,  'faction',  props.faction  ? factionIdByName[props.faction]              : null)
			+ footerItem('Провинция:', props.province, 'province', props.province ? provinceRegionMeta[props.province]?.id     : null)
			+ `</div>`
		: '';

	// Секции идут через .popup-divider — собираем только непустые, чтобы не
	// плодить двойные разделители.
	const sections = [
		`<div class="title-row">`
			+ `<h1${editable ? ` class="popup-title--editable" data-edit-marker="${props.id}" title="Редактировать локацию"` : ''}>${props.runame ?? ''}</h1>`
			+ `<div class="traits">${buildTraitsHTML(props.traits)}</div>`
		+ `</div>`,
		props.description ? `<div class="description">${renderDescription(props.description)}</div>` : '',
		questsHTML ? `<div class="popup-quests">${questsHTML}</div>` : '',
		footerHTML,
	].filter(Boolean);

	return `
		<div class="popup-content">
			${SHOW_LOCATION_IMAGES && props.image
				? `<img class="location-img" src="${props.image}" alt="">`
				: ''}
			<div class="popup-text">
				${props.engname ? `<p class="name-eng">${props.engname}</p>` : ''}
				${sections.join('<div class="popup-divider"></div>')}
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
	// Персонажи больше не свойство локаций — они переехали в задания. Снимаем
	// ключи персонажей из traits прямо на загрузке: в БД они пока остаются
	// (безопасно для ручной миграции локаций-«заданий»), но приложение их не
	// видит и не фильтрует; при следующем «Сохранить» локации массив уже
	// запишется чистым. Разовый перманентный вариант — см. SQL в чате.
	allMarkerRows.forEach(row => {
		if (Array.isArray(row.traits)) row.traits = row.traits.filter(t => !CHARACTER_TRAITS[t]);
	});
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
		// Название локации под иконкой (см. LOCATION_NAME_MIN_ZOOM выше) — постоянный
		// тултип без стрелки/фона (см. .location-name-label в style.css), сдвинутый
		// вниз ровно на половину высоты ЭТОЙ конкретной иконки (у типов локаций разный
		// размер — 24/28/30px), чтобы подпись вплотную примыкала к низу иконки без
		// зазора, как в Figma (zoom-location-name).
		const iconCfg = LOCATION_ICONS[feature.properties.locationType] ?? LOCATION_ICONS['default'];
		marker.bindTooltip(feature.properties.runame ?? '', {
			permanent: true,
			direction: 'bottom',
			offset: [0, iconCfg.size[1] / 2],
			className: 'location-name-label',
			interactive: false,
		});
		// Повторный клик прямо по иконке на карте, когда попап уже открыт —
		// тот же сценарий, что и повторный клик по имени в сайдбаре (см.
		// комментарий у fitPopupWidth): Leaflet сам popupopen второй раз не
		// поднимает, поэтому размер попапа досчитываем на каждый клик явно.
		marker.on('click', () => fitPopupWidth(marker.getPopup()));

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

	// loadMarkers() и loadQuests() стартуют параллельно. Если задания успели
	// прийти раньше маркеров, «Локация …» в журнале отрисовалась прочерком
	// (markerRowById была пуста) — перерисовываем, когда маркеры готовы.
	if (allQuestRows.length) renderQuestJournal();
}
loadMarkers();


// ─── ДОБАВЛЯЕМ СЛОИ НА КАРТУ СОГЛАСНО defaultOn ───────────────────────────
MARKER_LAYERS.forEach(({ group, defaultOn }) => {
	if (defaultOn) map.addLayer(group);
});
MAP_LAYERS.forEach(({ layer, defaultOn, onToggle }) => {
	if (onToggle) onToggle(defaultOn);          // виртуальная запись (подписи локаций) — не Leaflet-слой
	else if (defaultOn) map.addLayer(layer);
});


// ─── ЗАДАНИЯ: ЗАГРУЗКА И ОТРИСОВКА ──────────────────────────────────────────
// loadQuests() перестраивает всё, что зависит от заданий: индексы «по локации»/
// «по провинции», точечные маркеры на карте, «Журнал заданий» в сайдбаре и
// блок «Задания» в уже открытом попапе. Вызывается при старте, после входа/
// выхода админа (меняется набор строк из-за RLS) и после любой правки задания.
questPointLayer.addTo(map);

async function loadQuests() {
	const [{ data, error }, { data: branchData, error: branchError }] = await Promise.all([
		supabaseClient.from('quests').select('*').order('runame'),
		supabaseClient.from('quest_branches').select('*').order('runame'),
	]);
	if (error) {
		console.error('Не удалось загрузить задания из Supabase:', error);
		return;
	}
	if (branchError) {
		console.error('Не удалось загрузить ветки заданий из Supabase:', branchError);
	} else {
		allBranchRows = branchData;
		branchesById = new Map(branchData.map(b => [b.id, b]));
	}
	allQuestRows = data;
	questsById = new Map(data.map(q => [q.id, q]));
	rebuildQuestIndexes();
	renderQuestPointMarkers();
	buildQuestStatusChips();   // isAdmin мог смениться → появился/исчез чип «Слух»
	renderQuestJournal();
	// перепекаем контент попапов локаций/провинций под свежие задания —
	// setPopupContent обновляет и уже открытый попап, и строку для следующего
	// открытия (Leaflet при повторном openPopup подставляет именно её)
	refreshQuestPopups();
	// открытая карточка задания могла остаться на удалённое/изменённое задание
	const qc = document.getElementById('quest-card');
	if (!qc.classList.contains('hidden') && openQuestCardId && !questsById.has(openQuestCardId)) {
		closeQuestCard();
	} else if (!qc.classList.contains('hidden') && openQuestCardId) {
		openQuestCard(openQuestCardId); // перерисовать по свежим данным
	}
}

function pushIntoMap(map, key, val) {
	let arr = map.get(key);
	if (!arr) map.set(key, arr = []);
	arr.push(val);
}

function rebuildQuestIndexes() {
	questsByLocationId.clear();
	questsByProvinceId.clear();
	questsByBranchId.clear();
	for (const q of allQuestRows) {
		if (q.anchor_kind === 'location' && q.anchor_location_id) {
			pushIntoMap(questsByLocationId, q.anchor_location_id, q);
		} else if (q.anchor_kind === 'province' && q.anchor_province_id) {
			pushIntoMap(questsByProvinceId, q.anchor_province_id, q);
		}
		if (q.branch_id) pushIntoMap(questsByBranchId, q.branch_id, q);
	}
}

function renderQuestPointMarkers() {
	questPointLayer.clearLayers();
	questMarkers.clear();
	for (const q of allQuestRows) {
		if (q.anchor_kind !== 'point' || q.lng == null || q.lat == null || !questVisible(q)) continue;
		const marker = L.marker([q.lat, q.lng], { icon: questPointIcon() });
		marker.bindTooltip(q.runame ?? '', {
			permanent: true, direction: 'bottom', offset: [0, 12],
			className: 'location-name-label', interactive: false,
		});
		marker.on('click', () => openQuestCard(q.id));
		marker.addTo(questPointLayer);
		questMarkers.set(q.id, marker);
	}
	// если прямо сейчас правится точечное задание (loadQuests мог перестроить
	// маркеры по другой причине — тогл чипа статуса и т.п.) — снова прячем его
	if (hiddenQuestId !== null) toggleRealQuestHidden(hiddenQuestId, true);
}

// ─── Блок «Задания» внутри попапа локации / провинции ──────────────────────
// Возвращает готовый HTML блока — он ВСТРАИВАЕТСЯ прямо в строку buildPopupHTML/
// buildRegionPopupHTML (не отдельным слотом): Leaflet при повторном openPopup()
// того же объекта заново подставляет innerHTML из строки bindPopup и НЕ поднимает
// popupopen, так что «дорисовать» блок по событию нельзя — он должен уже быть в
// строке. Поэтому после каждого loadQuests() строки попапов перепекаются
// (refreshQuestPopups ниже) через setPopupContent.
// Голый текст короткой цели задания для попапа: снимаем разметку ссылок/
// выделений/цитат, склеиваем переносы. Полное описание с версткой — в карточке.
function questGoalText(md) {
	return (md || '')
		.replace(DESC_LINK_RE, '$1')       // [Текст](loc:id) → Текст
		.replace(/<[^>]+>/g, ' ')          // выравнивающие <div style="text-align:…"> и прочий HTML
		.replace(/^\s*>\s?/gm, '')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/_([^_]+)_/g, '$1')
		.replace(/\s*\n\s*/g, ' ')
		.trim();
}

// «В ветке заданий: …» — ссылка на настоящую ветку задания (quests.branch_id),
// открывает #branch-card. Пусто, если задание не в ветке.
function questBranchInfoHTML(q) {
	if (!q.branch_id) return '';
	const b = branchesById.get(q.branch_id);
	if (!b) return '';
	return `<div class="popup-quest-branch"><span class="popup-quest-branch-label">В ветке заданий:</span> `
		+ `<a class="desc-link" data-open-branch="${b.id}">${b.runame ?? ''}</a></div>`;
}

function questBlockInnerHTML(kind, anchorId) {
	const src = kind === 'location' ? questsByLocationId : questsByProvinceId;
	const list = (src.get(anchorId) || [])
		.filter(questVisible)
		.sort((a, b) => QUEST_JOURNAL_ORDER.indexOf(normalizedQuestStatus(a.status)) - QUEST_JOURNAL_ORDER.indexOf(normalizedQuestStatus(b.status)));
	if (!list.length && !isAdmin) return '';

	const addBtn = isAdmin
		? `<button type="button" class="popup-quest-add" data-add-quest="${kind}:${anchorId}" title="Добавить задание">${PLUS_ICON_SVG}</button>`
		: '';
	const head = `<div class="popup-quests-head">`
		+ `<span class="popup-quests-label">Задания <span class="popup-quests-count">${list.length}</span></span>`
		+ addBtn + `</div>`;

	if (!list.length) return head + `<div class="popup-quests-empty">Заданий нет</div>`;

	// Активное задание — развёрнуто (заголовок + цель + ветка), остальные —
	// только строка заголовка потусклее (см. макет 282:540).
	const rows = list.map(q => {
		const statusKey = QUEST_STATUS[q.status] ? q.status : 'known';
		const active = q.status === 'active';
		const drag = isAdmin
			? `<span class="quest-drag" data-drag-quest="${q.id}" title="Перетащить: на карту / в другую локацию / в журнал">${QUEST_GRIP_SVG}</span>`
			: '';
		const header = `<div class="popup-quest-header">`
			+ `<button type="button" class="popup-quest-title${active ? ' popup-quest-title--active' : ''}${normalizedQuestStatus(q.status) === 'done' ? ' popup-quest-title--done' : ''}" data-open-quest="${q.id}">`
			+ `<span class="quest-sq quest-sq--${statusKey}"></span>`
			+ `<span class="popup-quest-name">${q.runame ?? ''}</span>`
			+ `</button>`
			+ drag
			+ `</div>`;
		if (!active) return `<div class="popup-quest-row">${header}</div>`;
		// В попапе — только «Краткое описание» задания (отдельное поле формы);
		// нет краткого — строки цели нет вовсе (полное описание в попап не идёт).
		const goal = q.short_description ? `<div class="popup-quest-goal">${q.short_description}</div>` : '';
		return `<div class="popup-quest-row popup-quest-row--active">${header}${goal}${questBranchInfoHTML(q)}</div>`;
	}).join('');

	return head + `<div class="popup-quests-list">${rows}</div>`;
}

// Перепекает контент попапов локаций и провинций под текущее состояние заданий.
// setPopupContent на слое: обновляет и уже открытый попап (через _updateContent),
// и сохранённую строку — её же Leaflet возьмёт при следующем открытии. Зовём из
// loadQuests и при смене фильтра статусов; на ~477 локаций это сборка строки в
// цикле — приемлемо, событие редкое (правка задания, вход/выход, клик по чипу).
function refreshQuestPopups() {
	for (const id in markersById) {
		const row = markerRowById.get(id);
		if (row) markersById[id].setPopupContent(buildPopupHTML(rowToFeature(row).properties));
	}
	if (typeof provinceRegions !== 'undefined' && provinceRegions.eachLayer) {
		provinceRegions.eachLayer(l => {
			if (l.feature && l.feature.properties) {
				l.setPopupContent(buildRegionPopupHTML(l.feature.properties));
			}
		});
	}
}


// ─── ЗАДАНИЯ: «ЖУРНАЛ ЗАДАНИЙ» В САЙДБАРЕ ──────────────────────────────────
const questJournalListEl = document.getElementById('quest-journal-list');
const questStatusChipsEl  = document.getElementById('quest-status-chips');

// Класс .has-scrollbar — единственный признак «полоса прокрутки отрисована»,
// который доступен CSS. От него зависит 12px-зазор у насечки quest-drag
// (см. style.css). Дёргаем после каждого рендера журнала, а на изменение
// высоты контейнера (ручка-разделитель, ресайз окна, сворачивание секции)
// подписан ResizeObserver ниже.
//
// SCROLLBAR_TOLERANCE_PX: у этого списка (flex-column + gap + дробные
// line-height из Figma-вёрстки) scrollHeight и clientHeight/собственная
// высота бокса округляются браузером по-разному — даже при полностью
// раскрытом (перетянутом до упора) журнале и заведомо избыточном max-height
// scrollHeight стабильно на 1px больше clientHeight. Реального переполнения
// нет, но нативный overflow-y:auto всё равно рисует скроллбар на этот
// фантомный 1px и никогда не убирает его. Поэтому overflow-y переключаем сами
// (auto/hidden) по допуску, а не отдаём браузеру — лишний 1px внизу списка
// молча обрезается (незаметно), зато скроллбар не «залипает» без реального
// переполнения.
const SCROLLBAR_TOLERANCE_PX = 1;
function syncJournalScrollbarState() {
	const overflowing = questJournalListEl.scrollHeight > questJournalListEl.clientHeight + SCROLLBAR_TOLERANCE_PX;
	questJournalListEl.classList.toggle('has-scrollbar', overflowing);
	questJournalListEl.style.overflowY = overflowing ? 'auto' : 'hidden';
}
if (window.ResizeObserver) {
	new ResizeObserver(syncJournalScrollbarState).observe(questJournalListEl);
}

// Чипы статусов — 1:1 текстовые пилюли «Особенностей» (см. buildFilterTraitRow):
// та же разметка/классы, та же анимируемая подсветка (заложена в .icon-toggle),
// «включено» = .selected. «Слух» — только админу (у анонима таких строк нет).
// Слева от текста — ромб статуса, обычным in-flow flex-элементом, поэтому
// подсветка .icon-toggle__fx сама охватывает «ромб + текст».
//
// Строятся один раз (и заново при смене isAdmin — см. loadQuests); клик по чипу
// переключает .selected у самого чипа и перерисовывает только список журнала.
// Иначе на каждый тогл пересоздавался бы весь ряд и подсветка моргала бы у всех
// активных чипов разом.
function buildQuestStatusChips() {
	questStatusChipsEl.innerHTML = QUEST_STATUS_ORDER
		.filter(k => isAdmin || k !== 'rumor')
		.map(k => `<button type="button" class="filter-pill icon-toggle icon-toggle--text`
			+ `${questStatusFilter[k] ? ' selected' : ''}" data-status-chip="${k}">`
			+ ICON_TOGGLE_FX_HTML
			+ `<span class="quest-status-chip__sq quest-status-chip__sq--${k}"></span>`
			+ `<span class="icon-toggle__label">${QUEST_STATUS[k].label}</span>`
			+ `</button>`)
		.join('');
}

function renderQuestJournal() {
	const q = (document.getElementById('sidebar-search')?.value || '').trim().toLowerCase();
	// По описанию ищем в снятом с разметки виде (questGoalText): запрос «loc» не
	// цепляет синтаксис ссылки [..](loc:id), «**» — жирный текст и т.п.
	const passesFilters = x => questVisible(x)
		&& matchesTraitSet(x.characters ?? [], activeCharacterFilter, characterFilterMode)
		&& (!q
			|| (x.runame || '').toLowerCase().includes(q)
			|| questGoalText(x.description).toLowerCase().includes(q)
			|| questAnchorSearchText(x).toLowerCase().includes(q));

	const visibleRows = allQuestRows.filter(passesFilters);

	const totalEl = document.getElementById('quests-total-count');
	if (totalEl) totalEl.textContent = visibleRows.length;

	const emptyMsg = (q || activeCharacterFilter.size)
		? 'Ничего не найдено'
		: (allQuestRows.length ? 'Нет заданий с выбранным статусом' : 'Заданий пока нет');

	if (!visibleRows.length) {
		questJournalListEl.innerHTML = `<div class="quest-journal-empty">${emptyMsg}</div>`;
		syncJournalScrollbarState();
		return;
	}

	// Задание с веткой (branch_id) не выводится своей строкой в общем списке —
	// его «забирает» строка ветки. Ветки идут отдельным блоком НАД обычным
	// списком (макет 367:257: «Quest Lines» → разделитель → «Quests List»),
	// а не вперемешку по статусу.
	const soloRows = visibleRows.filter(x => !x.branch_id);
	const branchIds = [...new Set(visibleRows.filter(x => x.branch_id).map(x => x.branch_id))]
		.sort((a, b) => {
			const rank = id => Math.min(...(questsByBranchId.get(id) || []).map(x => QUEST_JOURNAL_ORDER.indexOf(normalizedQuestStatus(x.status))));
			return rank(a) - rank(b)
				|| (branchesById.get(a)?.runame || '').localeCompare(branchesById.get(b)?.runame || '', 'ru');
		});

	soloRows.sort((a, b) =>
		QUEST_JOURNAL_ORDER.indexOf(normalizedQuestStatus(a.status)) - QUEST_JOURNAL_ORDER.indexOf(normalizedQuestStatus(b.status))   // активные → известные → завершённые (+ слухи для админа)
		|| (a.anchor_kind === 'unplaced' ? 0 : 1) - (b.anchor_kind === 'unplaced' ? 0 : 1)   // внутри статуса: без места — вперёд (входящая очередь мастера)
		|| (a.runame || '').localeCompare(b.runame || '', 'ru'));

	const branchesHTML = branchIds
		.map(id => questBranchGroupHTML(branchesById.get(id), (questsByBranchId.get(id) || []).filter(passesFilters)))
		.join('');
	questJournalListEl.innerHTML = branchesHTML + soloRows.map(questJournalRowHTML).join('');

	syncJournalScrollbarState();
}

// branch_or_group различает внутри одного «Шага» два случая: несколько
// заданий БЕЗ группы (или с разными группами) — это взаимоисключающие
// альтернативы («или», выполнить любую одну), а несколько заданий с ОДНОЙ
// и той же группой — обязательный набор внутри одной альтернативы («и»,
// нужны все). Без branch_or_group задание считается собственной единственной
// группой — отсюда прежнее плоское поведение «или между отдельными
// заданиями», когда группу никто не выставлял.
function branchGroupKey(q) {
	return q.branch_or_group || `__solo_${q.id}`;
}

// Строки участников ветки в порядке branch_step; между заданиями одного шага
// из РАЗНЫХ групп — метка «или» (альтернативы друг другу). Между заданиями
// одной и той же группы метку не ставим — они и так идут подряд одним
// блоком, это и есть «нужны все». Общая для строки-ветки в журнале и для
// #branch-card.
function branchMembersRowsHTML(members) {
	const sorted = [...members].sort((a, b) =>
		(a.branch_step ?? Infinity) - (b.branch_step ?? Infinity)
		|| branchGroupKey(a).localeCompare(branchGroupKey(b))
		|| (a.runame || '').localeCompare(b.runame || '', 'ru'));

	let html = '';
	let prevStep, prevGroupKey;
	for (const m of sorted) {
		const step = m.branch_step ?? null;
		const groupKey = branchGroupKey(m);
		if (step !== null && step === prevStep && groupKey !== prevGroupKey) {
			html += `<div class="journal-branch-connector">или</div>`;
		}
		html += questJournalRowHTML(m);
		prevStep = step;
		prevGroupKey = groupKey;
	}
	return html;
}

// Строка ветки — шеврон (сворачивает/разворачивает список ниже, без перехода),
// название (клик открывает #branch-card) и счётчик «выполнено/всего» — не
// статус ветки (его нет), а посчитанные на лету статусы участников. Список
// участников — те же .journal-row, что и в обычном журнале, просто с отступом.
function questBranchGroupHTML(branch, members) {
	if (!branch) return '';
	const all = questsByBranchId.get(branch.id) || [];
	const done = all.filter(x => normalizedQuestStatus(x.status) === 'done').length;
	const collapsed = collapsedBranchIds.has(branch.id);
	const rowsHTML = branchMembersRowsHTML(members);

	return `<div class="journal-branch${collapsed ? ' collapsed' : ''}" data-branch-id="${branch.id}">`
		+ `<div class="journal-branch-header">`
		+ `<button type="button" class="journal-branch-chevron" data-branch-toggle="${branch.id}" title="${collapsed ? 'Развернуть' : 'Свернуть'}">${CHEVRON_SVG}</button>`
		+ `<span class="journal-branch-title" data-open-branch="${branch.id}">${branch.runame ?? ''}</span>`
		+ `<span class="journal-branch-count">${done}/${all.length}</span>`
		+ `</div>`
		+ `<div class="journal-branch-quests">${rowsHTML}</div>`
		+ `</div>`;
}

function questJournalRowHTML(q) {
	const statusKey = QUEST_STATUS[q.status] ? q.status : 'known';
	const s = QUEST_STATUS[statusKey];
	const normalized = normalizedQuestStatus(statusKey);
	// Цвет заголовка — по группе статуса (см. .journal-row-title--dim/--bright
	// в style.css): слух/завершено — тусклая пара, известно/активно — светлее.
	const titleColorClass = (normalized === 'rumor' || normalized === 'done') ? 'journal-row-title--dim' : 'journal-row-title--bright';
	const titleStyle = normalized === 'done' ? 'text-decoration:line-through' : '';
	// Ромб статуса в журнале — ассет из макета (node 254:1525, quest__status):
	// градиент + внутренний свет + зерно, свой SVG на статус. Плоский
	// inline-квадрат остаётся только в попапах локаций/провинций.
	return `<div class="journal-row" data-quest-id="${q.id}">`
		+ `<span class="quest-sq quest-sq--${statusKey}" title="${s.label}"></span>`
		+ `<div class="journal-row-main">`
		+ `<span class="journal-row-title ${titleColorClass}" style="${titleStyle}">${q.runame ?? ''}</span>`
		+ `<span class="journal-row-anchor">${questJournalAnchorHTML(q)}</span>`
		+ `</div>`
		+ (isAdmin ? `<span class="quest-drag" data-drag-quest="${q.id}" title="Перетащить: в локацию, на карту или в журнал">${QUEST_GRIP_SVG}</span>` : '')
		+ `</div>`;
}

questStatusChipsEl.addEventListener('click', function(e) {
	const chip = e.target.closest('[data-status-chip]');
	if (!chip) return;
	const k = chip.dataset.statusChip;
	questStatusFilter[k] = !questStatusFilter[k];
	chip.classList.toggle('selected', questStatusFilter[k]);   // только сам чип, ряд не пересобираем
	renderQuestJournal();
	renderQuestPointMarkers();
	refreshQuestPopups();
});

// Воронка у «Журнала заданий» — как #search-filter-toggle у «Провинций»: клик
// разворачивает/сворачивает панель фильтров (статус + персонажи, по умолчанию
// свёрнута). Вёрстка панели — 1:1 с #search-filter-panel «Провинций».
const questFilterToggle = document.getElementById('quest-filter-toggle');
const questFilterPanel  = document.getElementById('quest-filter-panel');
questFilterToggle.addEventListener('click', function() {
	questFilterPanel.classList.toggle('hidden');
	updateQuestFilterActive();
	syncJournalScrollbarState();   // область списка изменила высоту
});

// Клик по строке журнала:
//   • по ссылке-названию якоря → попап локации/провинции, в котором лежит задание;
//   • по всему остальному (заголовок, ромб, фон строки) → попап самого задания.
questJournalListEl.addEventListener('click', function(e) {
	const toggleBtn = e.target.closest('[data-branch-toggle]');
	if (toggleBtn) {
		const id = toggleBtn.dataset.branchToggle;
		if (collapsedBranchIds.has(id)) collapsedBranchIds.delete(id); else collapsedBranchIds.add(id);
		renderQuestJournal();
		return;
	}
	if (e.target.closest('[data-drag-quest]')) return; // клик по насечке — не навигация
	const row = e.target.closest('.journal-row');
	if (!row) return;
	const qrow = questsById.get(row.dataset.questId);
	if (!qrow) return;
	questJournalListEl.querySelectorAll('.journal-row.selected').forEach(r => r.classList.remove('selected'));
	row.classList.add('selected');

	// не по ссылке якоря → карточка задания
	if (!e.target.closest('.journal-row-anchor a')) {
		openQuestCard(qrow.id);
		return;
	}

	// клик по ссылке якоря → навигация к месту (локация / провинция)
	if (qrow.anchor_kind === 'location') {
		const marker = markersById[qrow.anchor_location_id];
		if (marker) {
			ensureLocationTypeVisible(markerRowById.get(qrow.anchor_location_id)?.location_type);
			focusLatLng(marker.getLatLng());
			setTimeout(() => { marker.openPopup(); fitPopupWidth(marker.getPopup()); }, FOCUS_FLY_DURATION * 1000);
		} else {
			openQuestCard(qrow.id);
		}
	} else if (qrow.anchor_kind === 'province') {
		const meta = provinceRegionMeta[provinceNameById[qrow.anchor_province_id]];
		if (meta?.id) focusRegion(meta.id);
		else openQuestCard(qrow.id);
	} else if (qrow.anchor_kind === 'point' && qrow.lng != null && qrow.lat != null) {
		// как «Новый маркер»: если точка попадает в провинцию — ведём на её попап
		// (в журнале эта строка и подписана «В провинции …»); иначе — к самой точке.
		const meta = provinceRegionMeta[detectProvinceAt({ lat: qrow.lat, lng: qrow.lng })];
		if (meta?.id) {
			focusRegion(meta.id);
		} else {
			focusLatLng(L.latLng(qrow.lat, qrow.lng));
			setTimeout(() => openQuestCard(qrow.id), FOCUS_FLY_DURATION * 1000);
		}
	} else {
		openQuestCard(qrow.id); // без места — просто карточка, карту не двигаем
	}
});

document.getElementById('sidebar-search')?.addEventListener('input', renderQuestJournal);


// ─── ЗАДАНИЯ: КАРТОЧКА ЗАДАНИЯ / КАРТОЧКА ВЕТКИ (плавающие, поверх попапа) ──
const questCardEl      = document.getElementById('quest-card');
const questCardInnerEl = document.getElementById('quest-card-inner');
let openQuestCardId = null;

const branchCardEl      = document.getElementById('branch-card');
const branchCardInnerEl = document.getElementById('branch-card-inner');
let openBranchCardId = null;

// Сайдбар — position:fixed поверх полноэкранной #map, поэтому отступ 24px
// отсчитываем не от края карты, а от правого края сайдбара (учитывает и
// свёрнутое состояние, и ручное изменение ширины). Общая геометрия для обеих
// плавающих карточек — задания и ветки.
function positionFloatingCard(el) {
	const mapRect = document.getElementById('map').getBoundingClientRect();
	const sb = document.getElementById('sidebar-wrapper');
	const leftEdge = Math.max(mapRect.left, sb ? sb.getBoundingClientRect().right : 0);
	el.style.left = (leftEdge + 24) + 'px';
	el.style.top  = (mapRect.top + 24) + 'px';
}
function positionQuestCard()  { positionFloatingCard(questCardEl); }
function positionBranchCard() { positionFloatingCard(branchCardEl); }

// Свернули/растянули сайдбар при открытой карточке — сдвигаем следом.
if (window.ResizeObserver) {
	const sbEl = document.getElementById('sidebar-wrapper');
	if (sbEl) new ResizeObserver(() => {
		if (!questCardEl.classList.contains('hidden')) positionQuestCard();
		if (!branchCardEl.classList.contains('hidden')) positionBranchCard();
	}).observe(sbEl);
}

function openQuestCard(id) {
	const q = questsById.get(id);
	if (!q) return;
	closeBranchCard();   // одна плавающая карточка за раз
	openQuestCardId = id;
	const s = QUEST_STATUS[q.status] ?? QUEST_STATUS.known;
	questCardInnerEl.innerHTML = `
		<div class="quest-card-head">
			<h3>${q.runame ?? ''}</h3>
			<button type="button" class="quest-card-close" title="Закрыть">✕</button>
		</div>
		${q.engname ? `<p class="quest-card-eng">${q.engname}</p>` : ''}
		<div class="quest-card-divider"></div>
		${q.description ? `<div class="quest-card-desc description">${renderDescription(q.description)}</div>` : ''}
		<div class="quest-card-anchor">
			<span class="quest-card-anchor-label">Привязка</span>
			<span class="quest-card-anchor-val">${questAnchorLabel(q)}</span>
		</div>
		${questBranchInfoHTML(q)}
		<div class="quest-card-divider"></div>
		<div class="quest-card-foot">
			<span class="quest-card-status" style="color:${s.ink}">${s.label}</span>
			${isAdmin ? `<button type="button" class="quest-card-edit" data-edit-quest="${id}">Редактировать</button>` : ''}
		</div>
	`;
	positionQuestCard();
	questCardEl.classList.remove('hidden');
}

function closeQuestCard() {
	questCardEl.classList.add('hidden');
	openQuestCardId = null;
	questJournalListEl.querySelectorAll('.journal-row.selected').forEach(r => r.classList.remove('selected'));
}

// Карточка ветки — состав ровно как «Задания внутри ветки» из плана: заголовок
// ветки (без статуса — его у ветки нет) + список участников теми же строками,
// что в журнале (branchMembersRowsHTML — «и»/«или» между заданиями одного
// шага). Клик по строке участника открывает обычную карточку задания.
function openBranchCard(id) {
	const b = branchesById.get(id);
	if (!b) return;
	closeQuestCard();   // одна плавающая карточка за раз
	openBranchCardId = id;

	const rowsHTML = branchMembersRowsHTML(questsByBranchId.get(id) || []);

	branchCardInnerEl.innerHTML = `
		<div class="quest-card-head">
			<h3>${b.runame ?? ''}</h3>
			<button type="button" class="quest-card-close" title="Закрыть">✕</button>
		</div>
		${b.description ? `<div class="quest-card-desc description">${renderDescription(b.description)}</div>` : ''}
		<div class="quest-card-divider"></div>
		<div class="branch-card-list">${rowsHTML || '<div class="quest-journal-empty">Заданий пока нет</div>'}</div>
	`;
	positionBranchCard();
	branchCardEl.classList.remove('hidden');
}

function closeBranchCard() {
	branchCardEl.classList.add('hidden');
	openBranchCardId = null;
}

// Открыть карточку по клику на название задания в попапе локации/провинции,
// или карточку ветки — по ссылке «В ветке заданий» / заголовку строки ветки.
document.addEventListener('click', function(e) {
	const t = e.target.closest('[data-open-quest]');
	if (t) openQuestCard(t.dataset.openQuest);
	const br = e.target.closest('[data-open-branch]');
	if (br) openBranchCard(br.dataset.openBranch);
});

questCardEl.addEventListener('click', function(e) {
	if (e.target.closest('.quest-card-close')) closeQuestCard();
});
branchCardEl.addEventListener('click', function(e) {
	if (e.target.closest('.quest-card-close')) { closeBranchCard(); return; }
	if (e.target.closest('[data-drag-quest]')) return;
	const row = e.target.closest('.journal-row');
	if (row) openQuestCard(row.dataset.questId);
});

// Клик мимо карточки — закрыть (но не когда кликнули по тому, что её открывает)
document.addEventListener('click', function(e) {
	if (!questCardEl.classList.contains('hidden')
		&& !questCardEl.contains(e.target)
		&& !e.target.closest('[data-open-quest]') && !e.target.closest('.journal-row') && !e.target.closest('.quest-point-icon')) {
		closeQuestCard();
	}
	if (!branchCardEl.classList.contains('hidden')
		&& !branchCardEl.contains(e.target)
		&& !e.target.closest('[data-open-branch]') && !e.target.closest('[data-branch-toggle]')) {
		closeBranchCard();
	}
});

document.addEventListener('keydown', function(e) {
	if (e.key !== 'Escape') return;
	if (!questCardEl.classList.contains('hidden')) closeQuestCard();
	if (!branchCardEl.classList.contains('hidden')) closeBranchCard();
});

window.addEventListener('resize', function() {
	if (!questCardEl.classList.contains('hidden')) positionQuestCard();
	if (!branchCardEl.classList.contains('hidden')) positionBranchCard();
	syncJournalScrollbarState();   // высота #quest-journal-list завязана на vh
});

loadQuests();


// ─── SIDEBAR: ИКОНКИ ТИПОВ МАРКЕРОВ (та же логика, что «Особенности» в
// форме редактирования — ряд иконок, ч/б пока выключено, цветная+свечение
// когда слой показан на карте) ──────────────────────────────────────────
const individualContainer = document.getElementById('individual-checkboxes');

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

// ─── ПЕРЕКЛЮЧАТЕЛИ ИКОНОК/ТЕКСТА (Локации/Тип локации/Особенности/Персонажи) —
// растущая от курсора подсветка (градиент + зерно шума + линия понизу),
// значения дословно из forAnimation.fig, геометрия/цвета — см. .icon-toggle*
// в style.css. Разметка идентична для hover- и selected-слоя, слои переключает
// CSS по :hover/.selected — здесь только собираем HTML один раз на кнопку. */
const ICON_TOGGLE_FX_HTML =
	'<span class="icon-toggle__fx">' +
		'<span class="icon-toggle__layer icon-toggle__layer--hover"><span class="icon-toggle__grad"><span class="icon-toggle__noise"></span></span><span class="icon-toggle__line"></span></span>' +
		'<span class="icon-toggle__layer icon-toggle__layer--selected"><span class="icon-toggle__grad"><span class="icon-toggle__noise"></span></span><span class="icon-toggle__line"></span></span>' +
	'</span>';

function iconToggleIconHTML(src, alt) {
	// alt экранируем: у некоторых подписей внутри есть кавычки/HTML (лор «Меча
	// Кхейна») — без экранирования они рвут атрибут и ломают вёрстку кнопки.
	return ICON_TOGGLE_FX_HTML + `<img class="icon-toggle__icon" src="${src}" alt="${String(alt ?? '').replace(/"/g, '&quot;')}">`;
}
function iconToggleTextHTML(label) {
	return ICON_TOGGLE_FX_HTML + `<span class="icon-toggle__label">${label}</span>`;
}

// Заливка растёт из точки под курсором (--ft-origin, % по X) — один делегированный
// слушатель на всё дерево работает и для кнопок, которых ещё нет на странице
// (ряды фильтров пересоздаются целиком на каждый клик). Логика — один в один
// setOrigin() из приложенной анимации (feature-toggle.js).
function setIconToggleOrigin(el, clientX) {
	const r = el.getBoundingClientRect();
	if (!r.width) return;
	const pct = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
	el.style.setProperty('--ft-origin', pct + '%');
}
document.addEventListener('mouseover', function(e) {
	const el = e.target.closest && e.target.closest('.icon-toggle');
	if (el && !el.contains(e.relatedTarget)) setIconToggleOrigin(el, e.clientX);
});
document.addEventListener('mouseout', function(e) {
	const el = e.target.closest && e.target.closest('.icon-toggle');
	if (el && !el.contains(e.relatedTarget)) setIconToggleOrigin(el, e.clientX);
});

function setLayerButtonState(btn, group, on) {
	btn.classList.toggle('selected', on);
	if (on) {
		map.addLayer(group);
	} else {
		// DivOverlay.onRemove (leaflet.js) при map._fadeAnimated сам не удаляет
		// контейнер тултипа сразу, а гасит ему opacity и откладывает удаление на
		// 200мс — рассчитывая на собственный CSS-фейд. Но у .location-name-label
		// opacity управляется через !important (нужно, чтобы наш show/hide по
		// зуму перебивал стартовый инлайновый opacity Leaflet) — эта же
		// !important-подпорка перебивает и попытку Leaflet погасить тултип,
		// поэтому подпись все 200мс висит полностью видимой поверх уже
		// пропавшей иконки и потом резко исчезает. На время этого removeLayer
		// временно выключаем fade-режим карты — тултипы отвязываются
		// синхронно, без задержки; на попапы/остальную карту не влияет, флаг
		// возвращается сразу же.
		const wasFadeAnimated = map._fadeAnimated;
		map._fadeAnimated = false;
		map.removeLayer(group);
		map._fadeAnimated = wasFadeAnimated;
	}
}

// Два визуальных подряда — 18px (город/поселение/форт) и 16px (остальные) —
// со своим зазором внутри группы (10px/12px) и между группами (11px), как в
// Figma (COMPONENTS__LOCATION-TYPE, "18x18"/"16x16" внутри "location-type").
const individualGroup18 = document.createElement('div');
individualGroup18.className = 'icon-toggle-group icon-toggle-group--18';
const individualGroup16 = document.createElement('div');
individualGroup16.className = 'icon-toggle-group icon-toggle-group--16';
individualContainer.appendChild(individualGroup18);
individualContainer.appendChild(individualGroup16);

const markerLayerButtons = MARKER_LAYERS.map(({ label, group, defaultOn, icons, size }) => {
	const btn = createTraitButton(`layer-icon-btn icon-toggle icon-toggle--${size}`, { tooltip: label }, iconToggleIconHTML(icons?.[0] ?? '', label));
	btn.classList.toggle('selected', defaultOn);
	btn.addEventListener('click', function() {
		setLayerButtonState(btn, group, !btn.classList.contains('selected'));
	});
	(size === 18 ? individualGroup18 : individualGroup16).appendChild(btn);
	return btn;
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
	});
});

// Заголовок «Локации» — замена прежней кнопки-глаза: клик включает/выключает
// все типы разом. Наведение/нажатие меняет только курсор (см. CSS
// .sidebar-section-label--toggle) — ни подсветки, ни тултипа быть не должно.
document.getElementById('locations-section-label').addEventListener('click', function() {
	const turnOn = !markerLayerButtons.every(b => b.classList.contains('selected'));
	markerLayerButtons.forEach((btn, i) => setLayerButtonState(btn, MARKER_LAYERS[i].group, turnOn));
});

// locationType (как в Supabase/rowToFeature) -> LayerGroup слоя типов
// маркеров — то же соответствие, что в switch внутри loadMarkers().
const LOCATION_TYPE_TO_GROUP = {
	city: cities, town: towns, fort: forts, camp: camps, shrine: shrines,
	pointOfInterest: pointsOfInterest, polarGates: polarGates,
	polarGatesBroken: polarGates, quest: quests,
};

// Если пользователь переходит к локации (из поиска или списка), а слой её
// типа сейчас скрыт галочкой в «Локации» — маркер физически не на карте, и
// открыть попап невозможно. Включаем слой автоматически, синхронизируя
// иконку-переключатель и мастер-кнопку, чтобы это не выглядело багом.
function ensureLocationTypeVisible(locationType) {
	const group = LOCATION_TYPE_TO_GROUP[locationType];
	if (!group || map.hasLayer(group)) return;
	const idx = MARKER_LAYERS.findIndex(l => l.group === group);
	if (idx === -1) return;
	setLayerButtonState(markerLayerButtons[idx], group, true);
}


// ─── SIDEBAR: ЧЕКБОКСЫ СЛОЁВ КАРТЫ ───────────────────────────────────────
const mapLayerContainer = document.getElementById('map-layer-checkboxes');

MAP_LAYERS.forEach(({ label, layer, defaultOn, id, onToggle }) => {
	const lbl = document.createElement('label');
	lbl.className = 'layer-checkbox';

	// .checkbox-fx — та же fx-icon-механика, что у остальных иконок из Figma
	// (COMPONENTS__GENERAL→checkbox): настоящий input визуально спрятан
	// (opacity:0 в CSS), но остаётся кликабельным/фокусируемым, поверх —
	// 3 наложенных экспорта Figma (default/hover/checked), переключаемых
	// через :hover/:checked на обёртке (см. style.css).
	const fx = document.createElement('span');
	fx.className = 'checkbox-fx';

	const cb = document.createElement('input');
	cb.type    = 'checkbox';
	cb.checked = defaultOn;
	if (id) cb.id = id;

	cb.addEventListener('change', function() {
		if (onToggle) { onToggle(this.checked); return; }
		if (this.checked) map.addLayer(layer);
		else              map.removeLayer(layer);
	});

	fx.appendChild(cb);
	['default', 'hover', 'checked'].forEach(state => {
		const img = document.createElement('img');
		img.className = `fx-icon__layer fx-icon__layer--${state}`;
		img.src = `images/ui/checkbox--${state}.svg`;
		img.alt = '';
		fx.appendChild(img);
	});

	lbl.appendChild(fx);
	const labelText = document.createElement('span');
	labelText.className = 'layer-checkbox-label';
	labelText.textContent = label;
	lbl.appendChild(labelText);
	mapLayerContainer.appendChild(lbl);
});

// Заголовок «Слои карты» — тот же принцип, что у «Локации»: клик включает/
// выключает все слои разом, курсор меняется по CSS, без тултипа.
document.getElementById('maplayers-section-label').addEventListener('click', function() {
	const checkboxes = [...mapLayerContainer.querySelectorAll('input[type="checkbox"]')];
	const turnOn = !checkboxes.every(cb => cb.checked);
	checkboxes.forEach(cb => {
		if (cb.checked !== turnOn) {
			cb.checked = turnOn;
			cb.dispatchEvent(new Event('change'));
		}
	});
});


// ─── SIDEBAR: СВОРАЧИВАНИЕ СЕКЦИЙ (только главный вид) ────────────────────
// Клик строго по фону строки-заголовка (e.target === сама строка, а не <p>/
// кнопка/их потомки) — т.е. по пустому месту справа от текста, левее «+» —
// сворачивает секцию (CSS .sb-section.collapsed прячет всё, кроме строки).
// По самому тексту у «Локаций»/«Слоёв карты» остаётся вкл/выкл всех пунктов.
document.querySelectorAll('#normal-view .sb-section > .sidebar-section-label-row').forEach(row => {
	row.addEventListener('click', function(e) {
		if (e.target !== row) return;
		row.closest('.sb-section').classList.toggle('collapsed');
		syncJournalScrollbarState();   // журнал мог свернуться/развернуться → полоса появилась/пропала
	});
});


// ─── SIDEBAR: СПИСОК ЛОКАЦИЙ ──────────────────────────────────────────────
const provinceRegionMeta = {};   // название провинции (рус) -> { id, owner, engname }
const provinceNameById   = {};   // id провинции -> название (рус) — для якоря задания
regionsProvinces.features.forEach(f => {
	provinceRegionMeta[f.properties.name] = {
		id: f.properties.id,
		owner: f.properties.owner ?? '',
		engname: f.properties.engname ?? '',
	};
	provinceNameById[f.properties.id] = f.properties.name;
});

// Название фракции (рус) -> id её региона — чтобы «Фракция: …» в подвале попапа
// стала ссылкой (переход к региону фракции, как у провинции).
const factionIdByName = {};
regionsFactions.features.forEach(f => {
	if (f.properties.name) factionIdByName[f.properties.name] = f.properties.id;
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

		// .province-body — grid из двух колонок: узкая "рельса" (линия слева,
		// растянутая на высоту всего списка через CSS grid) и сам список.
		const body = document.createElement('div');
		body.className = 'province-body';
		const rail = document.createElement('div');
		rail.className = 'province-rail';
		body.appendChild(rail);

		const ul = document.createElement('ul');
		ul.className = 'location-items';

		grouped[province]
			.sort((a, b) => (a.properties.runame ?? '').localeCompare(b.properties.runame ?? '', 'ru'))
			.forEach(f => {
				const li = document.createElement('li');
				li.className     = 'location-item';
				li.textContent   = f.properties.runame ?? '';
				li.dataset.ru     = (f.properties.runame  ?? '').toLowerCase();
				li.dataset.en     = (f.properties.engname ?? '').toLowerCase();
				li.dataset.type   = f.properties.locationType ?? '';
				li.dataset.traits = (f.properties.traits ?? []).join(',').toLowerCase();

				li.addEventListener('click', function() {
					const marker = markersById[f.properties.id];
					if (marker) {
						ensureLocationTypeVisible(f.properties.locationType);
						focusLatLng(marker.getLatLng());
						setTimeout(() => {
							marker.openPopup();
							// на случай повторного клика по той же локации, когда попап и
							// так уже открыт — см. комментарий у fitPopupWidth
							fitPopupWidth(marker.getPopup());
						}, FOCUS_FLY_DURATION * 1000);
					}
				});

				ul.appendChild(li);
			});

		body.appendChild(ul);
		provDiv.appendChild(body);
		container.appendChild(provDiv);
	});

	// Список каждый раз строится заново с нуля (при старте и после
	// добавления/сохранения/удаления маркера — см. loadMarkers), поэтому
	// заново применяем действующий поиск/фильтры — иначе после, например,
	// «Сохранить» список молча сбрасывался в непросеянный, хотя запрос в
	// строке поиска оставался на месте.
	applySidebarFilters();
	// список особенностей в панели фильтров тоже мог пополниться — если
	// только что сохранённый маркер завёл новую системную особенность
	if (typeof buildFilterTraitRow === 'function') buildFilterTraitRow();
}

// ─── SIDEBAR: ПОИСК + ФИЛЬТРЫ ───────────────────────────────────────────────
const sidebarSearchInput    = document.getElementById('sidebar-search');
const sidebarSearchClearBtn = document.getElementById('sidebar-search-clear');

let activeTypeFilter      = new Set(); // locationType — пусто = без фильтра («все»)
let activeTraitFilter     = new Set(); // ключи особенностей (иконки + системные)
let traitFilterMode       = 'or';      // 'or' — любая из выбранных, 'and' — все сразу, 'exclude' — ни одной

let activeCharacterFilter = new Set(); // ключи персонажей (CHARACTER_TRAITS) — своя группа/режим
let characterFilterMode   = 'or';

// Общая проверка «выбранный набор ключей против набора у сущности» с режимом
// ИЛИ/И/ИСКЛ. Локации фильтруются так по особенностям (item.dataset.traits),
// задания — по персонажам (q.characters).
function matchesTraitSet(itemTraits, filterSet, mode) {
	if (!filterSet.size) return true;
	if (mode === 'exclude') return ![...filterSet].some(t => itemTraits.includes(t));
	return mode === 'and'
		? [...filterSet].every(t => itemTraits.includes(t))
		: [...filterSet].some(t => itemTraits.includes(t));
}

function applySidebarFilters() {
	const query = sidebarSearchInput.value.toLowerCase().trim();
	sidebarSearchClearBtn.classList.toggle('hidden', !query);

	const hasStructuralFilter = activeTypeFilter.size > 0 || activeTraitFilter.size > 0;

	document.querySelectorAll('.province-group').forEach(provDiv => {
		const header = provDiv.querySelector('.province-header');
		const regionMatch = !!query && (
			header.dataset.name.includes(query) ||
			header.dataset.engname.includes(query) ||
			header.dataset.owner.includes(query)
		);

		let anyVisible = false;
		provDiv.querySelectorAll('.location-item').forEach(item => {
			const textOk = !query || regionMatch || item.dataset.ru.includes(query) || item.dataset.en.includes(query);
			const typeOk = !activeTypeFilter.size || activeTypeFilter.has(item.dataset.type);

			const itemTraits = item.dataset.traits ? item.dataset.traits.split(',') : [];
			const traitOk    = matchesTraitSet(itemTraits, activeTraitFilter, traitFilterMode);

			const match = textOk && typeOk && traitOk;
			item.style.display = match ? '' : 'none';
			if (match) anyVisible = true;
		});

		// Совпадение по названию/владельцу самой провинции разворачивает её
		// целиком (все локации внутри) — но только пока нет фильтра по типу
		// или особенностям: с ним пустая с виду группа не должна вылезать
		// только потому, что угадалось название региона.
		const groupVisible = anyVisible || (regionMatch && !hasStructuralFilter);

		// При поиске/фильтрах автоматически разворачиваем провинцию
		if ((query || hasStructuralFilter) && groupVisible) provDiv.classList.remove('collapsed');
		provDiv.style.display = groupVisible ? '' : 'none';
	});
}

sidebarSearchInput.addEventListener('input', applySidebarFilters);

sidebarSearchClearBtn.addEventListener('click', function() {
	sidebarSearchInput.value = '';
	sidebarSearchInput.focus();
	// один input-эвент → отработают все слушатели поиска (и список локаций, и
	// журнал заданий), а не только applySidebarFilters
	sidebarSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
});

// ─── SIDEBAR: ПАНЕЛЬ ФИЛЬТРОВ (тип локации + особенности) ───────────────────
// locationType -> {type, label}, тот же порядок/подписи, что у иконок слоёв —
// достаём type-ключ из LOCATION_TYPE_TO_GROUP, чтобы не заводить список labels
// второй раз.
const LOCATION_TYPE_LIST = MARKER_LAYERS.map(({ label, group }) => ({
	type: Object.keys(LOCATION_TYPE_TO_GROUP).find(k => LOCATION_TYPE_TO_GROUP[k] === group),
	label,
}));

const searchFilterToggle   = document.getElementById('search-filter-toggle');
const searchFilterPanel    = document.getElementById('search-filter-panel');
const filterTypeRow        = document.getElementById('filter-type-row');
const filterTraitRow       = document.getElementById('filter-trait-row');
const filterTraitModeEl    = document.getElementById('filter-trait-mode');
const filterCharacterRow   = document.getElementById('filter-character-row');
const filterCharacterModeEl = document.getElementById('filter-character-mode');
const filterResetBtn       = document.getElementById('filter-reset-btn');

searchFilterToggle.addEventListener('click', function() {
	searchFilterPanel.classList.toggle('hidden');
	searchFilterToggle.classList.toggle('active', !searchFilterPanel.classList.contains('hidden'));
});

function updateFilterResetVisibility() {
	const active = activeTypeFilter.size > 0 || activeTraitFilter.size > 0;
	filterResetBtn.classList.toggle('hidden', !active);
	searchFilterToggle.classList.toggle('active', active || !searchFilterPanel.classList.contains('hidden'));
}

// Воронка у «Журнала заданий» подсвечена, пока открыта её панель фильтров или
// выбран хоть один персонаж.
function updateQuestFilterActive() {
	const panelOpen = !questFilterPanel.classList.contains('hidden');
	questFilterToggle.classList.toggle('active', panelOpen || activeCharacterFilter.size > 0);
}

// Тип локации — множественный выбор (как особенности): пустой набор значит
// «без фильтра», без отдельной пилюли «Все» под это.
//
// Ряд строится ОДИН раз (buildFilterTypeRow); клик только переключает .selected
// у самой кнопки — не пересобирает ряд. Иначе анимация подсветки .icon-toggle
// (она заложена в самой кнопке-компоненте, см. .icon-toggle в style.css)
// переигрывалась бы у ВСЕХ активных кнопок на каждый тогл — «мигание».
function toggleTypeFilter(type, btn) {
	const on = !activeTypeFilter.has(type);
	if (on) activeTypeFilter.add(type); else activeTypeFilter.delete(type);
	btn.classList.toggle('selected', on);
	applySidebarFilters();
	updateFilterResetVisibility();
}

function buildFilterTypeRow() {
	filterTypeRow.innerHTML = '';
	// Два подряда — 18px (город/поселение/форт) и 16px (остальные), см.
	// комментарий у individualGroup18/16 выше.
	const group18 = document.createElement('div');
	group18.className = 'icon-toggle-group icon-toggle-group--18';
	const group16 = document.createElement('div');
	group16.className = 'icon-toggle-group icon-toggle-group--16';
	filterTypeRow.appendChild(group18);
	filterTypeRow.appendChild(group16);

	LOCATION_TYPE_LIST.forEach(({ type, label }, i) => {
		if (!type) return;
		const layer = MARKER_LAYERS[i];
		const icon = layer && layer.icons && layer.icons[0];
		const size = layer?.size ?? 16;
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = `trait filter-pill icon-only icon-toggle icon-toggle--${size}` +
			(activeTypeFilter.has(type) ? ' selected' : '');
		btn.innerHTML = iconToggleIconHTML(icon, '');
		btn.dataset.tooltip = label; // наш мгновенный .trait-tooltip вместо нативного title
		btn.addEventListener('click', () => toggleTypeFilter(type, btn));
		(size === 18 ? group18 : group16).appendChild(btn);
	});
}

function toggleTraitFilter(key, btn) {
	// item.dataset.traits (см. buildLocationList) собран в нижнем регистре —
	// activeTraitFilter должен сравниваться с ним в том же регистре, иначе
	// системная особенность с заглавной буквой («Забытое место») никогда бы
	// не совпадала с результатами, даже будучи выбранной в фильтре.
	const k = key.toLowerCase();
	const on = !activeTraitFilter.has(k);
	if (on) activeTraitFilter.add(k); else activeTraitFilter.delete(k);
	btn.classList.toggle('selected', on);   // только сама кнопка, без пересборки ряда — см. toggleTypeFilter
	applySidebarFilters();
	updateFilterResetVisibility();
}

// tooltip у sword_of_khaine — не короткое имя, а целый HTML-абзац лора для
// попапа (это осознанно, так и задумано на попапе — там оно выводится
// полностью: жирным названием и описанием под ним). В фильтре так не нужно —
// только имя. Отличаем "это лор-абзац" от "это уже короткое имя" по
// присутствию тегов: если тегов нет (обычный tooltip вроде "Гора" или
// "Древняя колония высших эльфов") — выводим как есть целиком, ничего не
// обрезаем; если теги есть — это лор, и в подпись идут только первые два
// слова названия.
function traitFilterLabel(tooltip) {
	if (!/<[^>]+>/.test(tooltip)) return tooltip;
	const text = tooltip.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	return text.split(' ').slice(0, 2).join(' ');
}

// Ряд строится один раз при инициализации и заново — только когда меняется
// НАБОР системных особенностей (их можно добавлять в форме маркера), не на
// каждый тогл. Клик по пилюле переключает .selected у самой кнопки. Так
// анимация подсветки (заложена в .icon-toggle) играет только у нажатой
// кнопки, а не у всех активных разом.
let filterTraitRowSig = null;
function buildFilterTraitRow() {
	// Пилюли разной ширины, в исходном порядке, при переносе строки почти
	// всегда оставляют куски пустого места (короткая "Лес" одна на новой
	// строке рядом с местом, куда бы влезла). Порядок между особенностями
	// для пользователя не важен — сортируем по длине подписи, тогда короткие
	// пилюли группируются вместе и flex-wrap упаковывает их плотнее, без
	// специальной раскладки. Иконки и текстовые (системные) особенности при
	// этом не перемешиваем — сперва все иконки, потом весь текст.
	const entries = [
		...Object.entries(TRAITS).map(([key, t]) => ({
			key, label: traitFilterLabel(t.tooltip), icon: t.icon,
		})),
		...getAllSystemTraitKeys().map(key => ({ key, label: key, icon: null })),
	];
	entries.sort((a, b) => {
		if (!!a.icon !== !!b.icon) return a.icon ? -1 : 1;
		return a.label.length - b.label.length;
	});

	// Набор/порядок кнопок не изменился (обычное сохранение маркера) — DOM не
	// трогаем, иначе все активные пилюли моргнут анимацией пересоздания.
	const sig = entries.map(e => e.key).join(' ');
	if (sig === filterTraitRowSig && filterTraitRow.children.length) return;
	filterTraitRowSig = sig;
	filterTraitRow.innerHTML = '';

	entries.forEach(({ key, label, icon }) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		const isSelected = activeTraitFilter.has(key.toLowerCase());
		// С иконкой — только иконка + наш мгновенный .trait-tooltip (класс .trait
		// + data-tooltip, перебивает нативный title и словарь TRAITS: для «Меча
		// Кхейна» — два слова, а не абзац). Без иконки (системные особенности) —
		// текстовая пилюля, имя и так на виду, подсказка не нужна.
		btn.className = 'filter-pill' + (icon ? ' trait icon-only icon-toggle icon-toggle--16' : ' icon-toggle icon-toggle--text') +
			(isSelected ? ' selected' : '');
		if (icon) {
			btn.innerHTML = iconToggleIconHTML(icon, '');
			btn.dataset.tooltip = label;
		}
		else btn.innerHTML = iconToggleTextHTML(label);
		btn.addEventListener('click', () => toggleTraitFilter(key, btn));
		filterTraitRow.appendChild(btn);
	});
}

function toggleCharacterFilter(key, btn) {
	const k = key.toLowerCase();
	const on = !activeCharacterFilter.has(k);
	if (on) activeCharacterFilter.add(k); else activeCharacterFilter.delete(k);
	btn.classList.toggle('selected', on);   // только сама кнопка — см. toggleTypeFilter
	renderQuestJournal();                    // фильтр персонажей — только для «Журнала заданий»
	updateQuestFilterActive();
}

// Персонажи полностью статичны — ряд строится один раз; клик переключает
// .selected у кнопки, без пересборки ряда.
function buildFilterCharacterRow() {
	filterCharacterRow.innerHTML = '';
	const entries = Object.entries(CHARACTER_TRAITS).map(([key, c]) => ({ key, label: c.tooltip, icon: c.icon }));
	entries.sort((a, b) => a.label.localeCompare(b.label, 'ru')); // слева направо — по алфавиту (рус.)

	entries.forEach(({ key, label, icon }) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'trait filter-pill icon-only icon-toggle icon-toggle--16' +
			(activeCharacterFilter.has(key.toLowerCase()) ? ' selected' : '');
		btn.innerHTML = iconToggleIconHTML(icon, '');
		btn.dataset.tooltip = label;
		btn.addEventListener('click', () => toggleCharacterFilter(key, btn));
		filterCharacterRow.appendChild(btn);
	});
}

filterTraitModeEl.querySelectorAll('.trait-mode-btn').forEach(btn => {
	btn.addEventListener('click', () => {
		traitFilterMode = btn.dataset.mode;
		filterTraitModeEl.querySelectorAll('.trait-mode-btn').forEach(b => b.classList.toggle('selected', b === btn));
		applySidebarFilters();
	});
});

filterCharacterModeEl.querySelectorAll('.trait-mode-btn').forEach(btn => {
	btn.addEventListener('click', () => {
		characterFilterMode = btn.dataset.mode;
		filterCharacterModeEl.querySelectorAll('.trait-mode-btn').forEach(b => b.classList.toggle('selected', b === btn));
		renderQuestJournal();   // фильтр персонажей — только для «Журнала заданий»
	});
});

filterResetBtn.addEventListener('click', () => {
	activeTypeFilter.clear();
	activeTraitFilter.clear();
	// снимаем .selected с самих кнопок, ряды не пересобираем
	filterTypeRow.querySelectorAll('.selected').forEach(b => b.classList.remove('selected'));
	filterTraitRow.querySelectorAll('.selected').forEach(b => b.classList.remove('selected'));
	applySidebarFilters();
	updateFilterResetVisibility();
});

buildFilterTypeRow();
buildFilterTraitRow();
buildFilterCharacterRow();


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


// ─── SIDEBAR: ВЫСОТА «ЖУРНАЛА ЗАДАНИЙ» ⇄ «ПРОВИНЦИЙ» ────────────────────
// Та же механика, что у ручки ширины сайдбара: невидимая полоса-хендл в
// зазоре между секциями (#journal-split-handle в CSS), Pointer Events +
// setPointerCapture. Тянем — растёт/падает потолок высоты списка заданий
// (#quest-journal-list.max-height), «Провинции» (flex:1) сами занимают
// остаток. Верхний предел считаем на момент старта: столько, чтобы списку
// провинций осталось не меньше PROVINCES_MIN_H.
const journalSplitHandle = document.getElementById('journal-split-handle');
const journalListEl      = document.getElementById('quest-journal-list');
const provinceListEl     = document.getElementById('location-list');
const JOURNAL_MIN_H      = 48;
const PROVINCES_MIN_H    = 120;

let resizingJournal = false;
let journalStartY   = 0;
let journalStartH   = 0;
let journalMaxH     = 0;

journalSplitHandle.addEventListener('pointerdown', function(e) {
	resizingJournal = true;
	journalStartY = e.clientY;
	journalStartH = journalListEl.getBoundingClientRect().height;
	journalMaxH = journalStartH +
		Math.max(0, provinceListEl.getBoundingClientRect().height - PROVINCES_MIN_H);
	document.body.style.userSelect = 'none';
	journalSplitHandle.setPointerCapture(e.pointerId);
	e.preventDefault();
});

journalSplitHandle.addEventListener('pointermove', function(e) {
	if (!resizingJournal) return;
	let h = journalStartH + (e.clientY - journalStartY);
	h = Math.max(JOURNAL_MIN_H, Math.min(journalMaxH, h));
	journalListEl.style.maxHeight = h + 'px';
	syncJournalScrollbarState();
});

function endJournalResize() {
	if (!resizingJournal) return;
	resizingJournal = false;
	document.body.style.userSelect = '';
}
journalSplitHandle.addEventListener('pointerup', endJournalResize);
journalSplitHandle.addEventListener('pointercancel', endJournalResize);


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
const POPUP_DEFAULT_WIDTH = 342;

// Вынесена в отдельную функцию (не только колбэк popupopen), потому что
// событие popupopen срабатывает лишь на первое открытие конкретного попапа.
// Повторный вызов marker.openPopup(), когда попап и так уже открыт (второй
// клик на то же имя локации в списке), popupopen заново не поднимает — но
// Leaflet при этом всё равно перечитывает содержимое попапа из ИСХОДНОЙ
// HTML-строки, переданной в bindPopup (наша .popup-content — не живой DOM-
// узел, а строка, из которой innerHTML собирается заново), а в этой строке
// никакой ширины не прописано — так и обнулялась. Поэтому пересчёт вызывается
// явно на каждый openPopup(), а не только через map.on('popupopen', ...).
function fitPopupWidth(popup) {
	// setTimeout(0), а не сразу: при самом первом открытии конкретного попапа
	// его разметка только что вставлена в DOM в этом же такте — браузер ещё
	// не сделал layout, и h1.scrollWidth/offsetWidth читаются нулевыми или
	// какими попало, из-за чего попап на первый клик не раздвигался вообще
	// (а на второй — уже раздвигался, потому что DOM был готов). Один тик
	// ожидания даёт браузеру досчитать раскладку перед замером.
	setTimeout(() => {
		const popupEl = popup?.getElement();
		if (!popupEl) return;
		const content = popupEl.querySelector('.popup-content');
		if (!content) return;
		const h1       = popupEl.querySelector('h1');
		const traits   = popupEl.querySelector('.traits');
		const editIcon = popupEl.querySelector('.popup-edit-icon'); // видна только админу — .title-row шире на её ширину+отступ

		content.style.width = '';
		if (h1) {
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
		}

		// Попап уже был спозиционирован (по центру над маркером) под старую,
		// узкую ширину контента — раздвинули её выше, но Leaflet сам заново не
		// пересчитывает положение, поэтому попап визуально "съезжал" вбок
		// относительно маркера. Нужно пересчитать позицию под новую ширину —
		// но НЕ через popup.update(): он сначала дёргает _updateContent(),
		// а наш контент передан в bindPopup строкой, а не живым узлом, и
		// _updateContent на любое обновление заново подставляет innerHTML из
		// этой исходной строки — стирая ширину, которую мы только что
		// поставили, в том же самом вызове. _updateLayout()+_updatePosition()
		// (без _updateContent) пересчитывают только размер/позицию контейнера
		// под уже применённую ширину, содержимое не трогая.
		popup._updateLayout();
		popup._updatePosition();
	}, 0);
}

map.on('popupopen', function(e) { fitPopupWidth(e.popup); });


// ─── ТУЛТИП ───────────────────────────────────────────────────────────────
const traitTooltip = document.createElement('div');
traitTooltip.className = 'trait-tooltip';
document.body.appendChild(traitTooltip);
let pinned = false;

// Текст тултипа: сначала свой data-tooltip на элементе (иконки слоёв в
// «Локациях»), иначе — словарь TRAITS/CHARACTER_TRAITS по data-key
// (особенности/персонажи в форме и попапе локации).
function traitTooltipContent(el) {
	return el.dataset.tooltip ?? TRAITS[el.dataset.key]?.tooltip ?? CHARACTER_TRAITS[el.dataset.key]?.tooltip ?? '';
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
// (объявление isAdmin поднято к началу файла — см. комментарий там)

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
	const changed = isAdmin !== admin;
	isAdmin = admin;
	document.body.classList.toggle('is-admin', admin);
	if (adminControlLink) adminControlLink.title = admin ? 'Выйти' : 'Вход для администратора';
	// Набор строк заданий зависит от роли (RLS не отдаёт слухи анониму), а
	// значки-«плюсы»/кнопки правки — от isAdmin. Перечитываем и перерисовываем.
	if (changed && typeof loadQuests === 'function') loadQuests();
	// Фракции все видят одинаково (RLS не режет), но заголовок карточки
	// кликабелен только у админа — перерисовать, чтобы курсор/data-атрибут
	// сразу появились/исчезли при входе/выходе.
	if (changed && typeof renderFactionsList === 'function') renderFactionsList();
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
const editQuestView   = document.getElementById('edit-quest-view');
const gloryView       = document.getElementById('glory-view');
const editFactionView = document.getElementById('edit-faction-view');
// Общий переключатель между всеми видами сайдбара — раньше каждая show*View()
// вручную прятала все остальные по отдельности; при добавлении вида (glory/
// edit-faction) это легко забыть обновить хотя бы в одном месте. Теперь
// список видов один, а show*View() ниже вызывает switchToView() и добавляет
// только свою собственную специфику (map-интерактивность и т.п.).
const ALL_SIDEBAR_VIEWS = [normalView, editMarkerView, editQuestView, gloryView, editFactionView];

// ─── ПЕРЕКЛЮЧЕНИЕ normal-view ⇄ glory-view — анимация «снос в сторону» ─────
// (вариант 2a из Claude Design, handoff «Анимация ротации сайдбара»). Только
// эта пара видов анимируется; формы маркера/задания/фракции переключаются
// мгновенно через setViewImmediate — ровно как switchToView работал раньше.
const VIEW_SWAP_IN_MS   = 620;  // приезд нового вида (см. --vs-dur в CSS)
const VIEW_SWAP_OUT_MS  = 250;  // уход старого
const VIEW_SWAP_STEP_MS = 40;   // каскад между секциями (см. --vs-delay)
const VIEW_SWAP_DX      = 16;   // базовый снос секций по горизонтали
// Насколько «доезжает» маленькая ссылка заголовка до своего нового места:
// 1 — ровно на измеренное расстояние, 0 — как обычная секция. 0.55 читается
// как переезд, но не как отдельный полёт через весь сайдбар.
const VIEW_SWAP_TITLE_K = 0.55;

// Пара видов, между которыми переход анимируется. Остальные виды сайдбара —
// формы; их переключение осталось мгновенным (switchToView ниже).
const ANIMATED_VIEW_PAIR = [normalView, gloryView];

function prefersReducedMotion() {
	return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Жёсткая установка вида без анимации — то, чем switchToView был раньше.
function setViewImmediate(view) {
	// Инвалидируем любой ещё не отработавший animateViewSwap — иначе его
	// отложенные колбэки (setTimeout на 250/900мс) увидят «свой» токен всё ещё
	// текущим и позже откатят класс .hidden уже на другом, только что
	// показанном виде (воспроизводится быстрыми повторными кликами туда-сюда
	// по ссылке «Слава»/«Карта Хейвена»).
	viewSwapToken++;
	ALL_SIDEBAR_VIEWS.forEach(v => {
		v.classList.toggle('hidden', v !== view);
		v.classList.remove('sb-view-out', 'sb-view-in', 'sb-view-busy');
		v.style.removeProperty('--view-shift');
		[...v.children].forEach(c => c.style.removeProperty('--view-shift'));
	});
}

let viewSwapToken = 0;

function switchToView(view) {
	const current = ALL_SIDEBAR_VIEWS.find(v => !v.classList.contains('hidden'));
	const animatable = current && current !== view
		&& ANIMATED_VIEW_PAIR.includes(current) && ANIMATED_VIEW_PAIR.includes(view)
		&& !prefersReducedMotion();
	if (!animatable) { setViewImmediate(view); return; }
	animateViewSwap(current, view);
}

function animateViewSwap(from, to) {
	const token = ++viewSwapToken;
	// «Слава» лежит правее карты: вперёд — влево, назад — вправо. Уходящее
	// уезжает в ту же сторону, откуда приезжает новое, — это и даёт рифму
	// между заголовком и содержимым.
	const forward = to === gloryView;
	const dx = forward ? -VIEW_SWAP_DX : VIEW_SWAP_DX;

	// Маленькая ссылка заголовка меняет место (после «Карты Хейвена» ↔ после
	// «Славы»). Считаем фактическую разницу, пока оба вида в потоке и без
	// трансформов, — иначе пришлось бы хардкодить ширины слов, а они зависят
	// от шрифта и от языка.
	const fromLink = from.querySelector('.map-title-slava');
	const linkFromX = fromLink ? fromLink.getBoundingClientRect().left : null;

	to.classList.remove('hidden');
	to.classList.add('sb-view-in', 'sb-view-busy');

	const toLink = to.querySelector('.map-title-slava');
	let titleDx = null;
	if (linkFromX !== null && toLink) {
		const delta = toLink.getBoundingClientRect().left - linkFromX;
		if (Math.abs(delta) > 1) titleDx = delta * VIEW_SWAP_TITLE_K;
	}

	// Уходящий вид — из потока, поверх нового.
	from.classList.add('sb-view-out');
	from.style.setProperty('--view-shift', dx + 'px');
	to.style.setProperty('--view-shift', -dx + 'px');

	// Шапка (первая секция) уезжает/приезжает не на базовые 16px, а на
	// расстояние переезда ссылки.
	if (titleDx !== null) {
		const fromHeader = from.querySelector('.sidebar-header-row');
		const toHeader   = to.querySelector('.sidebar-header-row');
		if (fromHeader) fromHeader.style.setProperty('--view-shift', titleDx + 'px');
		if (toHeader)   toHeader.style.setProperty('--view-shift', -titleDx + 'px');
	}

	void to.offsetWidth;                 // reflow: фиксируем стартовое состояние
	to.classList.remove('sb-view-in');   // и отпускаем — секции едут каскадом

	const sections = to.children.length;
	const total = Math.max(VIEW_SWAP_OUT_MS, VIEW_SWAP_IN_MS + sections * VIEW_SWAP_STEP_MS);

	setTimeout(() => {
		if (token !== viewSwapToken) return;   // за это время переключили ещё раз
		from.classList.add('hidden');
		from.classList.remove('sb-view-out');
		from.style.removeProperty('--view-shift');
		[...from.children].forEach(c => c.style.removeProperty('--view-shift'));
	}, VIEW_SWAP_OUT_MS);

	setTimeout(() => {
		if (token !== viewSwapToken) return;
		to.classList.remove('sb-view-busy');
		to.style.removeProperty('--view-shift');
		[...to.children].forEach(c => c.style.removeProperty('--view-shift'));
		// Тот же трюк, что и в show*View() для форм: под неподвижным курсором
		// :hover иначе может залипнуть на элементе, которого уже нет.
		forceHoverRecalc(to);
	}, total);
}
const editMarkerTitle = document.getElementById('edit-marker-title');
const addMarkerBtn    = document.getElementById('add-marker-btn');
const editBackBtn     = document.getElementById('edit-back-btn');
const deleteMarkerBtn  = document.getElementById('delete-marker-btn');
const revertDefaultBtn = document.getElementById('revert-default-btn');
const markerForm       = document.getElementById('marker-form');
const formErrorEl      = document.getElementById('form-error');
const traitsIconsEl    = document.getElementById('traits-icons');

// Особенности-иконки (TRAIT_LABELS/TRAITS) + системные (свободный текст, без
// иконки — см. getAllSystemTraitKeys) идут в одно поле traits при сохранении.
// Персонажи здесь больше НЕ участвуют — они свойство заданий, не локаций.
function getSelectedTraits() {
	const iconTraits = [...traitsIconsEl.querySelectorAll('.icon-toggle.selected')].map(b => b.dataset.key);
	return [...iconTraits, ...selectedSystemTraits];
}

const TRAIT_LABELS = {
	'port':            'Порт',
	'mountain':        'Гора',
	'colony':          'Древняя колония высших эльфов',
	'forest':          'Лес',
	'sword_of_khaine': 'Меч Кхейна',
};
// Пилюля-переключатель особенности/персонажа — .filter-pill.icon-toggle, как в
// фильтре провинций. Подсказка — наш мгновенный .trait-tooltip (класс .trait +
// data-tooltip перебивает нативный title и словарь TRAITS): короткое имя, для
// «Меча Кхейна» — только первые два слова, а не абзац лора. alt пустой — иначе
// кавычки внутри лора ломают разметку кнопки.
function makeTraitTogglePill(key, icon, tip) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'trait filter-pill icon-only icon-toggle icon-toggle--16';
	btn.dataset.key = key;
	btn.dataset.tooltip = tip;
	btn.innerHTML = iconToggleIconHTML(icon ?? '', '');
	btn.addEventListener('click', () => btn.classList.toggle('selected'));
	return btn;
}
Object.entries(TRAIT_LABELS).forEach(([key, label]) => {
	traitsIconsEl.appendChild(makeTraitTogglePill(key, TRAITS[key]?.icon, label));
});

// ─── АДМИНКА: СИСТЕМНЫЕ ОСОБЕННОСТИ (без иконки) ────────────────────────────
const systemTraitsChipsEl  = document.getElementById('system-traits-chips');
const systemTraitNewInput  = document.getElementById('system-trait-new-input');
const systemTraitAddBtn    = document.getElementById('system-trait-add-btn');

// Выбор храним отдельным множеством (а не только .selected в DOM), потому что
// список чипов перестраивается заново (buildSystemTraitsChips) каждый раз,
// когда появляется свежедобавленная особенность — DOM-класс это не пережил бы.
let selectedSystemTraits = new Set();

function buildSystemTraitsChips() {
	// Известные по всем маркерам + то, что уже выбрано в этой форме (в т.ч.
	// только что вписанное вручную и ещё не сохранённое ни на одном маркере).
	const keys = new Set([...getAllSystemTraitKeys(), ...selectedSystemTraits]);
	systemTraitsChipsEl.innerHTML = '';
	[...keys].sort((a, b) => a.localeCompare(b, 'ru')).forEach(key => {
		const chip = document.createElement('button');
		chip.type = 'button';
		chip.className = 'filter-pill icon-toggle icon-toggle--text' + (selectedSystemTraits.has(key) ? ' selected' : '');
		chip.innerHTML = iconToggleTextHTML(key);
		chip.addEventListener('click', () => {
			if (selectedSystemTraits.has(key)) selectedSystemTraits.delete(key);
			else selectedSystemTraits.add(key);
			buildSystemTraitsChips();
		});
		systemTraitsChipsEl.appendChild(chip);
	});
}
buildSystemTraitsChips();

function addSystemTraitFromInput() {
	const value = systemTraitNewInput.value.trim();
	if (!value) return;
	if (TRAITS[value]) {
		// не даём завести системную особенность с тем же именем, что и
		// готовая иконочная — иначе одна перекрывала бы другую в traits[]
		formErrorEl.textContent = `«${value}» уже есть среди обычных особенностей`;
		return;
	}
	selectedSystemTraits.add(value);
	systemTraitNewInput.value = '';
	buildSystemTraitsChips();
}
systemTraitAddBtn.addEventListener('click', addSystemTraitFromInput);
systemTraitNewInput.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') { e.preventDefault(); addSystemTraitFromInput(); }
});

let activeMarkerId = null; // null = создаём новый
let draftMarker = null;

function clearDraftMarker() {
	if (draftMarker) { map.removeLayer(draftMarker); draftMarker = null; }
}

// Пока идёт редактирование существующей локации, черновой маркер (draftMarker)
// подменяет собой настоящий — иначе на карте видно два маркера в одной точке:
// неподвижный настоящий и перетаскиваемый черновик, что и создавало впечатление
// «дубля». Прячем настоящий (И иконку, И постоянный тултип-подпись — тултип
// живёт отдельным DOM-узлом в tooltipPane, поэтому его нужно гасить явно, иначе
// подпись остаётся висеть на старом месте) на время редактирования и возвращаем
// при выходе.
let hiddenMarkerId = null;

function toggleRealMarkerHidden(id, hidden) {
	const m = markersById[id];
	m?.getElement()?.classList.toggle('admin-editing-hidden', hidden);
	m?.getTooltip()?.getElement()?.classList.toggle('admin-editing-hidden', hidden);
}

function hideRealMarker(id) {
	restoreRealMarker();
	toggleRealMarkerHidden(id, true);
	hiddenMarkerId = id;
}

function restoreRealMarker() {
	if (hiddenMarkerId !== null) {
		toggleRealMarkerHidden(hiddenMarkerId, false);
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

// Печатаем название — подпись под черновым маркером обновляется на лету
document.getElementById('f-runame').addEventListener('input', syncDraftTooltip);

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

// Подпись под черновым маркером — та же .location-name-label, что у настоящих
// локаций, чтобы при перемещении иконки название ехало вместе с ней (настоящий
// маркер на это время спрятан целиком — см. hideRealMarker).
function syncDraftTooltip() {
	if (draftMarker?.getTooltip()) {
		draftMarker.setTooltipContent(document.getElementById('f-runame').value.trim() || 'Новый маркер');
	}
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
		draftMarker.bindTooltip('', {
			permanent: true, direction: 'bottom',
			offset: [0, (LOCATION_ICONS[document.getElementById('f-locationType').value] ?? LOCATION_ICONS['default']).size[1] / 2],
			className: 'location-name-label', interactive: false,
		});
		// зажать и перетащить маркер — альтернатива повторному клику по карте
		draftMarker.on('drag',    () => setFormCoords(draftMarker.getLatLng()));
		draftMarker.on('dragend', () => setFormCoords(draftMarker.getLatLng()));
		// правый клик — предпросмотр попапа локации
		draftMarker.on('contextmenu', function(e) {
			L.DomEvent.preventDefault(e);
			showDraftPreview();
		});
	}
	syncDraftTooltip();
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
	switchToView(normalView);
	clearDraftMarker();
	restoreRealMarker();
	if (typeof clearQuestDraftMarker === 'function') clearQuestDraftMarker();
	if (typeof restoreRealQuestMarker === 'function') restoreRealQuestMarker();
	activeMarkerId = null;
	// возвращаем обычную интерактивность регионов
	setRegionsInteractive(provinceRegions, true);
	politicalMap._syncTier(); // восстанавливает корректное состояние фракций для текущего зума
}

function showEditView() {
	switchToView(editMarkerView);
	// см. forceHoverRecalc — тут это переключение видимости display:none -> flex
	forceHoverRecalc(editMarkerView);
	// пока ставим/переносим маркер, полигоны фракций/провинций не должны
	// перехватывать клики — иначе по ним невозможно попасть кликом на карту
	setRegionsInteractive(factionRegions, false);
	setRegionsInteractive(provinceRegions, false);
}

function showQuestEditView() {
	switchToView(editQuestView);
	forceHoverRecalc(editQuestView);
	// Пока открыта форма задания, полигоны регионов не перехватывают клики —
	// любой клик по карте ставит точку задания (см. map.on('click') ниже).
	setRegionsInteractive(factionRegions, false);
	setRegionsInteractive(provinceRegions, false);
}

// «Слава» — обычный список, карту не трогает (в отличие от форм маркера/
// задания, ей не нужны клики по карте), поэтому интерактивность регионов не
// переключаем. Видна всем; «+ Добавить фракцию» и клик по фракции — только
// админу (см. admin-only и isAdmin-проверку в делегатах ниже).
function showGloryView() {
	switchToView(gloryView);
}

function showFactionEditView() {
	switchToView(editFactionView);
	forceHoverRecalc(editFactionView);
}

function resetMarkerForm() {
	markerForm.reset();
	traitsIconsEl.querySelectorAll('.icon-toggle.selected').forEach(b => b.classList.remove('selected'));
	selectedSystemTraits = new Set();
	buildSystemTraitsChips(); // на случай новых системных особенностей от других маркеров
	formErrorEl.textContent = '';
	provinceIsAuto = true;
	autoProvinceValue = '';
	provinceInput.classList.remove('auto-filled');
	locationTypeField.sync(); // form.reset() не обновляет подпись кастомного триггера
}

function populateAdminDatalists() {
	const factions  = [...new Set(allMarkerRows.map(m => m.faction).filter(Boolean))].sort();
	const provinces = [...new Set(allMarkerRows.map(m => m.province).filter(Boolean))].sort();
	document.getElementById('faction-options').innerHTML  = factions.map(f => `<option value="${f}">`).join('');
	document.getElementById('province-options').innerHTML = provinces.map(p => `<option value="${p}">`).join('');
}


// ─── ЕДИНЫЙ КОМПОНЕНТ ПОЛЕЙ ФОРМЫ: select / инпут-автокомплит ──────────────
// (макет field/input, field/select — node 365:254, 377:251, 377:253, 377:262)
// Открытый список — своя вёрстка (hover-подсветка строки, свой фон под
// панелью), нативные <select>/<datalist> так не стилизуются — их выпадающий
// список рисует ОС. Поэтому на клик/фокус сами рендерим .field-options.
//
// select-режим (upgradeFieldSelect): исходный <select> остаётся в DOM как
// источник значения — просто прячем (.field-select-native), и весь код,
// читающий/пишущий его .value (submit, populate-on-edit, form.reset()) не
// меняется. Только подпись кастомного триггера саму по себе браузер не
// обновляет при программной записи .value (в отличие от live-клика) — синк
// дёргаем явно в нужных местах (тот же приём, что и с .selected у пилюль
// персонажей после questForm.reset()).
//
// автокомплит-режим (upgradeFieldAutocomplete): реальный <input> остаётся
// видимым и рабочим для набора текста; варианты читаем прямо из его исходного
// <datalist> (данные туда по-прежнему кладут populateAdminDatalists/
// populateQuestFormLists — их трогать не пришлось), просто без атрибута list,
// иначе браузер нарисует поверх ещё и свой нативный попап.
//
// Панель .field-options — position:fixed и лежит в <body>, а не внутри
// .field-wrap: #quest-form/#marker-form сами скроллятся (overflow-y:auto),
// внутри выреза панель резалась бы по границе скролла.
const FIELD_CHEVRON_SVG = '<svg class="field-select-chevron" width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 2L4 6L8 2H0Z" fill="currentColor"/></svg>';

let activeFieldPanel  = null;
let activeFieldAnchor = null;
function closeFieldOptions() {
	if (!activeFieldPanel) return;
	activeFieldPanel.remove();
	activeFieldPanel = null;
	activeFieldAnchor = null;
	document.querySelectorAll('.field-select-trigger.open').forEach(t => t.classList.remove('open'));
}
document.addEventListener('mousedown', function(e) {
	if (activeFieldPanel && !activeFieldPanel.contains(e.target) && !e.target.closest('.field-wrap')) closeFieldOptions();
});
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape') closeFieldOptions();
});
function positionFieldPanel() {
	const r = activeFieldAnchor.getBoundingClientRect();
	activeFieldPanel.style.left  = r.left + 'px';
	activeFieldPanel.style.top   = r.bottom + 'px';
	activeFieldPanel.style.width = r.width + 'px';
}
// Скролл где угодно на странице (в т.ч. внутри самой .field-options —
// scrollIntoView у подсветки клавишами тоже шлёт 'scroll') раньше просто
// закрывал панель — из-за capture:true это ловило и колесо мыши над формой
// #quest-form/#marker-form (она сама скроллится), и стрелочную навигацию
// по списку. Вместо закрытия панель едет вслед за полем; свой собственный
// скролл списка опций положение самой панели не меняет — пропускаем.
window.addEventListener('scroll', function(e) {
	if (!activeFieldPanel) return;
	if (activeFieldPanel.contains(e.target)) return;
	positionFieldPanel();
}, true);
window.addEventListener('resize', function() {
	if (activeFieldPanel) positionFieldPanel();
});

function moveFieldHighlight(dir) {
	if (!activeFieldPanel) return;
	const opts = [...activeFieldPanel.querySelectorAll('.field-option')];
	if (!opts.length) return;
	let idx = opts.findIndex(o => o.classList.contains('active'));
	idx = idx === -1 ? (dir > 0 ? 0 : opts.length - 1) : (idx + dir + opts.length) % opts.length;
	opts.forEach(o => o.classList.remove('active'));
	opts[idx].classList.add('active');
	opts[idx].scrollIntoView({ block: 'nearest' });
}
function pickFieldHighlight() {
	const active = activeFieldPanel?.querySelector('.field-option.active');
	if (!active) return false;
	active.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	return true;
}

function openFieldOptions(anchorEl, items, { onPick, highlightValue } = {}) {
	closeFieldOptions();
	const panel = document.createElement('div');
	panel.className = 'field-options';
	panel.innerHTML = items.length
		? items.map(it => `<div class="field-option${it.value === highlightValue ? ' active' : ''}" data-value="${it.value}">${it.label}</div>`).join('')
		: `<div class="field-options-empty">Ничего не найдено</div>`;
	panel.addEventListener('mousedown', function(e) {
		// mousedown, не click — опережает blur инпута: без preventDefault клик
		// по варианту сперва увёл бы фокус с инпута и закрыл панель раньше,
		// чем успел бы сработать выбор.
		e.preventDefault();
		const opt = e.target.closest('.field-option');
		if (opt) { onPick(opt.dataset.value); closeFieldOptions(); }
	});
	document.body.appendChild(panel);
	activeFieldPanel  = panel;
	activeFieldAnchor = anchorEl;
	positionFieldPanel();
	anchorEl.classList.add('open');
	return panel;
}

function upgradeFieldSelect(selectEl) {
	const wrap = document.createElement('div');
	wrap.className = 'field-wrap';
	selectEl.parentNode.insertBefore(wrap, selectEl);
	wrap.appendChild(selectEl);
	selectEl.classList.add('field-select-native');

	const trigger = document.createElement('div');
	trigger.className = 'field-select-trigger';
	trigger.tabIndex = 0;
	trigger.innerHTML = `<span class="field-select-label"></span>${FIELD_CHEVRON_SVG}`;
	wrap.appendChild(trigger);
	const labelEl = trigger.querySelector('.field-select-label');

	function sync() {
		const opt = selectEl.options[selectEl.selectedIndex];
		labelEl.textContent = opt ? opt.textContent : '';
	}
	sync();

	function toggle() {
		if (trigger.classList.contains('open')) { closeFieldOptions(); return; }
		const items = [...selectEl.options].map(o => ({ value: o.value, label: o.textContent }));
		openFieldOptions(trigger, items, {
			highlightValue: selectEl.value,
			onPick(value) {
				selectEl.value = value;
				selectEl.dispatchEvent(new Event('change', { bubbles: true }));
				sync();
			},
		});
	}
	trigger.addEventListener('click', toggle);
	trigger.addEventListener('keydown', function(e) {
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
		else if (e.key === 'ArrowDown') { e.preventDefault(); if (!activeFieldPanel) toggle(); else moveFieldHighlight(1); }
		else if (e.key === 'ArrowUp')   { e.preventDefault(); moveFieldHighlight(-1); }
	});
	return { sync };
}

function upgradeFieldAutocomplete(inputEl, datalistId) {
	const wrap = document.createElement('div');
	wrap.className = 'field-wrap';
	inputEl.parentNode.insertBefore(wrap, inputEl);
	wrap.appendChild(inputEl);
	inputEl.classList.add('field-input');
	inputEl.removeAttribute('list');

	function allItems() {
		return [...document.getElementById(datalistId).options].map(o => ({ value: o.value, label: o.value }));
	}
	function pick(value) {
		inputEl.value = value;
		inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		inputEl.focus();
	}
	function openFiltered() {
		const q = inputEl.value.trim().toLowerCase();
		const items = q ? allItems().filter(it => it.label.toLowerCase().includes(q)) : allItems();
		openFieldOptions(inputEl, items, { onPick: pick });
	}
	inputEl.addEventListener('focus', openFiltered);
	inputEl.addEventListener('input', openFiltered);
	inputEl.addEventListener('keydown', function(e) {
		if (e.key === 'ArrowDown') { e.preventDefault(); if (!activeFieldPanel) openFiltered(); else moveFieldHighlight(1); }
		else if (e.key === 'ArrowUp') { e.preventDefault(); moveFieldHighlight(-1); }
		else if (e.key === 'Enter' && activeFieldPanel) { if (pickFieldHighlight()) e.preventDefault(); }
	});
}

// Поля формы маркера, переведённые на новый компонент:
const locationTypeField = upgradeFieldSelect(document.getElementById('f-locationType'));
upgradeFieldAutocomplete(document.getElementById('f-faction'), 'faction-options');
upgradeFieldAutocomplete(provinceInput, 'province-options');


// ─── АДМИНКА: ВСТАВКА ССЫЛКИ НА ЛОКАЦИЮ/ПРОВИНЦИЮ/ФРАКЦИЮ В ОПИСАНИЕ ───────
const descriptionInput   = document.getElementById('f-description');
const linkPickerEl       = document.getElementById('link-picker');
const linkPickerSearch   = document.getElementById('link-picker-search');
const linkPickerResults  = document.getElementById('link-picker-results');

let linkInsertPos = null; // позиция курсора в textarea на момент открытия панели

// ─── АДМИНКА: ПАНЕЛЬ ФОРМАТИРОВАНИЯ ОПИСАНИЯ ───────────────────────────────
// Выделяем текст в textarea, жмём кнопку — вставляется markdown-разметка
// (как в Obsidian, только без превью); без выделения вставляется пустой
// маркер и курсор встаёт между парой символов. См. renderDescription/
// renderMarkdownBlock выше — там же расписан весь синтаксис.
//
// Тулбар продублирован в компактном поле и в диалоге-расширении (два разных
// .desc-editor с разными id у textarea) — один и тот же набор функций
// работает с любым из двух, т.к. принимает textarea явным параметром вместо
// жёсткой ссылки на descriptionInput; какую textarea использовать, клик-
// хендлер ниже определяет через closest('.desc-editor').
const WRAP_TAGS = {
	b: ['**', '**'],
	i: ['_', '_'],
};

function wrapSelection(textarea, open, close) {
	const { selectionStart: start, selectionEnd: end, value } = textarea;
	const selected = value.slice(start, end);
	textarea.value = value.slice(0, start) + open + selected + close + value.slice(end);
	textarea.focus();
	textarea.setSelectionRange(start + open.length, start + open.length + selected.length);
}

// Цитата — не простое оборачивание начала/конца, а префикс "> " у КАЖДОЙ
// строки выделения (можно цитировать сразу несколько строк/абзацев).
function wrapAsQuote(textarea) {
	const { selectionStart: start, selectionEnd: end, value } = textarea;
	const selected = value.slice(start, end);
	const quoted = selected
		? selected.split('\n').map(line => line ? `> ${line}` : '>').join('\n')
		: '> ';
	textarea.value = value.slice(0, start) + quoted + value.slice(end);
	textarea.focus();
	const caret = start + quoted.length;
	textarea.setSelectionRange(selected ? start : caret, caret);
}

// Пустая строка — то, что renderMarkdownBlock распознаёт как границу абзаца.
function insertParagraphBreak(textarea) {
	const { selectionStart: start, selectionEnd: end, value } = textarea;
	textarea.value = value.slice(0, start) + '\n\n' + value.slice(end);
	textarea.focus();
	const caret = start + 2;
	textarea.setSelectionRange(caret, caret);
}

function wrapAlign(textarea, align) {
	wrapSelection(textarea, `<div style="text-align:${align}">`, '</div>');
}

// Снимает и старую HTML-разметку (совместимость с записями до перехода на
// markdown), и новую: **жирный**/_курсив_/"> " в начале строки.
function stripFormatting(s) {
	return s
		.replace(/<[^>]+>/g, '')
		.replace(/\*\*([^*]*)\*\*/g, '$1')
		.replace(/_([^_]*)_/g, '$1')
		.replace(/^\s*>\s?/gm, '');
}

function clearFormatting(textarea) {
	const { selectionStart: start, selectionEnd: end, value } = textarea;
	if (start === end) {
		// ничего не выделено — снимаем разметку со всего текста
		textarea.value = stripFormatting(value);
		textarea.focus();
		textarea.setSelectionRange(textarea.value.length, textarea.value.length);
		return;
	}
	const selected = value.slice(start, end);
	const stripped = stripFormatting(selected);
	textarea.value = value.slice(0, start) + stripped + value.slice(end);
	textarea.focus();
	textarea.setSelectionRange(start, start + stripped.length);
}

// Диалог-расширение — просто дубль поля (см. ниже): у него нет собственного
// состояния, любое изменение в нём тут же пишется обратно в настоящее
// #f-description. Единственное место, где это нужно явно форсировать —
// после программной правки .value из тулбара/шорткатов, т.к. это не вызывает
// нативное событие 'input'.
function syncExpandToReal(textarea) {
	if (textarea === descExpandTextarea) descriptionInput.value = textarea.value;
}

document.querySelectorAll('.desc-toolbar .toolbar-btn').forEach(btn => {
	if (btn.classList.contains('js-insert-link')) return; // обрабатывается отдельно ниже (открывает link-picker)
	btn.addEventListener('click', () => {
		const textarea = btn.closest('.desc-editor').querySelector('textarea');
		const wrap = btn.dataset.wrap;
		const align = btn.dataset.align;
		const action = btn.dataset.action;
		if (align) wrapAlign(textarea, align);
		else if (wrap === 'p') insertParagraphBreak(textarea);
		else if (wrap === 'blockquote') wrapAsQuote(textarea);
		else if (wrap && WRAP_TAGS[wrap]) wrapSelection(textarea, ...WRAP_TAGS[wrap]);
		else if (action === 'clear') clearFormatting(textarea);
		syncExpandToReal(textarea);
	});
});

// Общий обработчик — навешан и на компактную textarea, и на textarea диалога
// (см. ниже, после объявления descExpandTextarea).
function handleFormatShortcut(e) {
	if (!(e.ctrlKey || e.metaKey)) return;
	const textarea = e.currentTarget;
	if (e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSelection(textarea, ...WRAP_TAGS.b); syncExpandToReal(textarea); }
	if (e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSelection(textarea, ...WRAP_TAGS.i); syncExpandToReal(textarea); }
}
descriptionInput.addEventListener('keydown', handleFormatShortcut);

// ─── АДМИНКА: РАСКРЫТИЕ ОПИСАНИЯ В БОЛЬШОЕ ОКНО ─────────────────────────────
// Тот же стиль, что у диалога "Восстановить по умолчанию" (#revert-overlay).
// #f-description-expand — полноценный дубль поля (свой тулбар + textarea, см.
// index.html и обработчик тулбара выше): ничего никуда не переезжает и не
// клонируется, компактное поле в сайдбаре не трогается вообще. На каждый
// ввод в диалоге значение пишется обратно в настоящее #f-description —
// компактное поле просто "заполняется" по ходу печати, как обычное зеркало.
const descExpandOverlay   = document.getElementById('desc-expand-overlay');
const descExpandTextarea  = document.getElementById('f-description-expand');
const descExpandDoneBtn   = document.getElementById('desc-expand-done-btn');
const descEditorEl        = descriptionInput.closest('.desc-editor');

function openDescExpand() {
	descExpandTextarea.value = descriptionInput.value;
	descExpandOverlay.classList.remove('hidden');
	descExpandTextarea.focus();
}

descExpandTextarea.addEventListener('input', function() {
	descriptionInput.value = this.value;
});
descExpandTextarea.addEventListener('keydown', handleFormatShortcut);

function closeDescExpand() {
	descExpandOverlay.classList.add('hidden');
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
	if (!descExpandOverlay.classList.contains('hidden')) return; // уже открыто
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

// Как и остальной тулбар, продублирован в обеих .desc-editor (компактной и
// диалоговой) — activeLinkTarget запоминает, из какой textarea/кнопки был
// открыт пикер, чтобы вставить ссылку и закрыть поповер в нужном месте.
let activeLinkTarget = null; // { textarea, btn }

function openLinkPicker(textarea, btn) {
	activeLinkTarget = { textarea, btn };
	linkInsertPos = textarea.selectionStart ?? textarea.value.length;
	const btnRect = btn.getBoundingClientRect();
	linkPickerEl.style.top  = `${btnRect.bottom + 4}px`;
	linkPickerEl.style.left = `${Math.max(8, btnRect.right - 280)}px`;
	linkPickerEl.classList.remove('hidden');
	linkPickerSearch.value = '';
	renderLinkPickerResults('');
	linkPickerSearch.focus();
}

function closeLinkPicker() {
	linkPickerEl.classList.add('hidden');
	activeLinkTarget = null;
}

document.querySelectorAll('.js-insert-link').forEach(btn => {
	btn.addEventListener('click', () => openLinkPicker(btn.closest('.desc-editor').querySelector('textarea'), btn));
});

linkPickerSearch.addEventListener('input', function() {
	renderLinkPickerResults(this.value);
});

linkPickerResults.addEventListener('click', function(e) {
	const item = e.target.closest('.link-picker-item');
	if (!item || !activeLinkTarget) return;
	const { textarea } = activeLinkTarget;
	const { type, id, label } = item.dataset;
	const token = `[${label}](${type}:${id})`;
	const pos = linkInsertPos ?? textarea.value.length;
	const before = textarea.value.slice(0, pos);
	const after  = textarea.value.slice(pos);
	textarea.value = before + token + after;
	closeLinkPicker();
	textarea.focus();
	const caret = pos + token.length;
	textarea.setSelectionRange(caret, caret);
	syncExpandToReal(textarea);
});

document.addEventListener('click', function(e) {
	if (linkPickerEl.classList.contains('hidden')) return;
	if (linkPickerEl.contains(e.target) || e.target.closest('.js-insert-link')) return;
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
	document.getElementById('f-runame').value       = row.runame ?? '';
	document.getElementById('f-engname').value      = row.engname ?? '';
	document.getElementById('f-description').value  = row.description ?? '';
	document.getElementById('f-faction').value      = row.faction ?? '';
	document.getElementById('f-province').value     = row.province ?? '';
	provinceIsAuto = false; // у существующей локации провинция уже осознанно задана, не подсказка
	document.getElementById('f-locationType').value = row.location_type ?? 'city';
	locationTypeField.sync();
	document.getElementById('f-image').value        = row.image ?? '';
	(row.traits ?? []).forEach(t => {
		if (CHARACTER_TRAITS[t]) return; // персонажи больше не свойство локаций — игнорируем
		const btn = traitsIconsEl.querySelector(`.icon-toggle[data-key="${t}"]`);
		if (btn) btn.classList.add('selected');
		else selectedSystemTraits.add(t); // не нашлась среди особенностей -> системная
	});
	buildSystemTraitsChips();
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


// ─── АДМИНКА: ФОРМА ЗАДАНИЯ (добавление / редактирование / удаление) ───────
const questForm        = document.getElementById('quest-form');
const editQuestTitle   = document.getElementById('edit-quest-title');
const questFormErrorEl = document.getElementById('quest-form-error');
const addQuestBtn      = document.getElementById('add-quest-btn');
const deleteQuestBtn   = document.getElementById('delete-quest-btn');
const questAnchorModeEl = document.getElementById('q-anchor-mode');

// Кнопки режима привязки — те же градиентные текстовые пилюли .icon-toggle, что
// и чипы статусов / особенности. Выбор одиночный: setQuestAnchorMode снимает
// .selected со всех и ставит на нужную (анимация подсветки заложена в .icon-toggle).
[['location', 'Локация'], ['province', 'Провинция'], ['point', 'Точка'], ['unplaced', 'Без места']]
	.forEach(([kind, label]) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'filter-pill icon-toggle icon-toggle--text' + (kind === 'unplaced' ? ' selected' : '');
		btn.dataset.anchor = kind;
		btn.innerHTML = ICON_TOGGLE_FX_HTML + `<span class="icon-toggle__label">${label}</span>`;
		questAnchorModeEl.appendChild(btn);
	});

// «Описание» задания — тот же тулбар форматирования, что у маркера: кнопки
// .desc-toolbar .toolbar-btn и .js-insert-link уже разошлись по делегатам при
// инициализации (см. секцию «ПАНЕЛЬ ФОРМАТИРОВАНИЯ ОПИСАНИЯ»), т.к. находят
// textarea через closest('.desc-editor'); осталось повесить Ctrl+B/I.
document.getElementById('q-description').addEventListener('keydown', handleFormatShortcut);
// печатаем название задания — подпись под черновым маркером-точкой обновляется на лету
document.getElementById('q-runame').addEventListener('input', () => syncQuestDraftTooltip());

let activeQuestId    = null;   // null = создаём новое
let questAnchorKind  = 'unplaced';
let questDraftMarker = null;

function clearQuestDraftMarker() {
	if (questDraftMarker) { map.removeLayer(questDraftMarker); questDraftMarker = null; }
}

// Правим существующее точечное задание — прячем его настоящий маркер целиком
// (иконку И подпись), пока идёт редактирование; черновик его подменяет. Иначе
// на карте два значка в одной точке и «залипшая» подпись (то же, что у локаций,
// см. hideRealMarker).
let hiddenQuestId = null;
function toggleRealQuestHidden(id, hidden) {
	const m = questMarkers.get(id);
	m?.getElement()?.classList.toggle('admin-editing-hidden', hidden);
	m?.getTooltip()?.getElement()?.classList.toggle('admin-editing-hidden', hidden);
}
function hideRealQuestMarker(id) {
	restoreRealQuestMarker();
	toggleRealQuestHidden(id, true);
	hiddenQuestId = id;
}
function restoreRealQuestMarker() {
	if (hiddenQuestId !== null) {
		toggleRealQuestHidden(hiddenQuestId, false);
		hiddenQuestId = null;
	}
}

// Тот же механизм иконки, что у маркеров локаций (L.icon, а не L.divIcon) —
// иначе .leaflet-div-icon подмешивал свой фон/рамку/box-sizing, и иконка с
// подписью «наезжали» друг на друга.
function questPointIcon() {
	return L.icon({
		iconUrl: QUEST_ICON,
		iconSize: [24, 24],
		iconAnchor: [12, 12],
		className: 'quest-point-icon',
	});
}

// Подпись под черновым маркером задания — как у локаций (см. syncDraftTooltip).
function syncQuestDraftTooltip() {
	if (questDraftMarker?.getTooltip()) {
		questDraftMarker.setTooltipContent(document.getElementById('q-runame').value.trim() || 'Новое задание');
	}
}

function setQuestPoint(latlng) {
	document.getElementById('q-lng').value = latlng.lng.toFixed(1);
	document.getElementById('q-lat').value = latlng.lat.toFixed(1);
	if (questDraftMarker) {
		questDraftMarker.setLatLng(latlng);
	} else {
		questDraftMarker = L.marker(latlng, {
			icon: questPointIcon(),
			zIndexOffset: 1000, draggable: true,
		}).addTo(map);
		questDraftMarker.bindTooltip('', {
			permanent: true, direction: 'bottom', offset: [0, 12],
			className: 'location-name-label', interactive: false,
		});
		questDraftMarker.on('drag',    questDraftDragMove);
		questDraftMarker.on('dragend', questDraftDragEnd);
	}
	syncQuestDraftTooltip();
}

// Ближайший видимый маркер локации к точке (в экранных px) — цель для
// «закидывания» задания в локацию перетаскиванием чернового маркера.
function questDropLocationNear(latlng, thresholdPx = 22) {
	const p = map.latLngToContainerPoint(latlng);
	let bestId = null, bestD = thresholdPx;
	for (const id of Object.keys(markersById)) {
		const m = markersById[id];
		if (!m._map || m.getElement()?.classList.contains('admin-editing-hidden')) continue;
		const d = p.distanceTo(map.latLngToContainerPoint(m.getLatLng()));
		if (d < bestD) { bestD = d; bestId = id; }
	}
	return bestId;
}

function questDraftDragMove() {
	setQuestPoint(questDraftMarker.getLatLng());
	clearQuestDropHighlight();
	const id = questDropLocationNear(questDraftMarker.getLatLng());
	if (id) markersById[id].getElement()?.classList.add('quest-drop-target');
}

function questDraftDragEnd() {
	clearQuestDropHighlight();
	if (!questDraftMarker) return;
	const id = questDropLocationNear(questDraftMarker.getLatLng());
	if (!id) { setQuestPoint(questDraftMarker.getLatLng()); return; }
	// Бросили на локацию — привязываем к ней. Смену режима (она удаляет черновик)
	// откладываем на тик, чтобы не дёргать слой во время его же события dragend.
	document.getElementById('q-anchor-loc').value = markerRowById.get(id)?.runame ?? '';
	setTimeout(() => {
		setQuestAnchorMode('location');
		setRegionsInteractive(factionRegions, false);   // форма ещё открыта — клики по карте по-прежнему ставят точку
		setRegionsInteractive(provinceRegions, false);
	}, 0);
}

// Переключение режима привязки: показываем нужное поле, а для «точки» ещё и
// освобождаем клики карты от полигонов регионов (как в форме маркера).
function setQuestAnchorMode(kind) {
	questAnchorKind = kind;
	questAnchorModeEl.querySelectorAll('button').forEach(b =>
		b.classList.toggle('selected', b.dataset.anchor === kind));
	editQuestView.querySelectorAll('.q-anchor-field').forEach(f =>
		f.classList.toggle('hidden', f.dataset.for !== kind));

	if (kind === 'point') {
		setRegionsInteractive(factionRegions, false);
		setRegionsInteractive(provinceRegions, false);
		const lng = parseFloat(document.getElementById('q-lng').value);
		const lat = parseFloat(document.getElementById('q-lat').value);
		if (!Number.isNaN(lng) && !Number.isNaN(lat) && !questDraftMarker) {
			setQuestPoint(L.latLng(lat, lng));
		}
	} else {
		clearQuestDraftMarker();
		setRegionsInteractive(factionRegions, true);
		setRegionsInteractive(provinceRegions, true);
	}
}

questAnchorModeEl.addEventListener('click', function(e) {
	const btn = e.target.closest('button[data-anchor]');
	if (btn) setQuestAnchorMode(btn.dataset.anchor);
});

function populateQuestFormLists() {
	document.getElementById('q-loc-options').innerHTML =
		[...new Set(allMarkerRows.map(r => r.runame).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'))
			.map(n => `<option value="${n}">`).join('');
	document.getElementById('q-prov-options').innerHTML =
		regionsProvinces.features.map(f => f.properties.name).sort((a, b) => a.localeCompare(b, 'ru'))
			.map(n => `<option value="${n}">`).join('');
}

// «Персонажи» задания — МУЛЬТИвыбор пилюлями .icon-toggle (персонажи из
// CHARACTER_TRAITS), тот же вид/логика, что у ряда «Персонажи» в форме маркера.
// Ряд строится один раз; клик по пилюле переключает её .selected. Значения
// читаются из DOM на сабмите → колонка characters text[].
const questCharactersRow = document.getElementById('q-characters-row');
Object.entries(CHARACTER_TRAITS).forEach(([key, c]) => {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'trait filter-pill icon-only icon-toggle icon-toggle--16';
	btn.dataset.key = key;
	btn.dataset.tooltip = c.tooltip;   // короткое имя, наш .trait-tooltip
	btn.innerHTML = iconToggleIconHTML(c.icon ?? '', '');
	btn.addEventListener('click', () => btn.classList.toggle('selected'));
	questCharactersRow.appendChild(btn);
});

function getSelectedQuestCharacters() {
	return [...questCharactersRow.querySelectorAll('.icon-toggle.selected')].map(b => b.dataset.key);
}
function setQuestCharacters(keys) {
	const set = new Set(keys || []);
	questCharactersRow.querySelectorAll('.icon-toggle').forEach(b =>
		b.classList.toggle('selected', set.has(b.dataset.key)));
}

function resetQuestForm() {
	questForm.reset();
	questFormErrorEl.textContent = '';
	setQuestCharacters([]);           // form.reset() не снимает .selected с пилюль
	clearQuestDraftMarker();
	populateQuestFormLists();
	questStatusField.sync();          // form.reset() не обновляет подпись кастомного триггера
	pendingQuestBranch = null;
	renderQuestBranchRow();
}

// Поля формы задания, переведённые на новый компонент:
const questStatusField = upgradeFieldSelect(document.getElementById('q-status'));
upgradeFieldAutocomplete(document.getElementById('q-anchor-loc'), 'q-loc-options');
upgradeFieldAutocomplete(document.getElementById('q-anchor-prov'), 'q-prov-options');

// opts: { questId?, anchorKind?, anchorLocationId?, anchorProvinceId?, statusDefault? }
function openQuestForm(opts = {}) {
	resetQuestForm();
	map.closePopup();
	closeQuestCard();
	closeBranchCard();

	if (opts.questId) {
		const q = questsById.get(opts.questId);
		if (!q) return;
		activeQuestId = q.id;
		hideRealQuestMarker(q.id);   // точечное задание: прячем настоящий маркер, черновик его подменит
		editQuestTitle.textContent = q.runame || 'Задание';
		deleteQuestBtn.classList.remove('hidden');
		document.getElementById('q-runame').value      = q.runame ?? '';
		document.getElementById('q-engname').value     = q.engname ?? '';
		document.getElementById('q-description').value = q.description ?? '';
		document.getElementById('q-short-description').value = q.short_description ?? '';
		document.getElementById('q-status').value      = q.status ?? 'rumor';
		questStatusField.sync();
		pendingQuestBranch = q.branch_id ? { id: q.branch_id, runame: branchesById.get(q.branch_id)?.runame ?? '' } : null;
		renderQuestBranchRow();
		document.getElementById('q-branch-step').value = q.branch_step ?? '';
		document.getElementById('q-branch-or-group').value = q.branch_or_group ?? '';
		setQuestCharacters(q.characters);
		if (q.anchor_kind === 'location') {
			document.getElementById('q-anchor-loc').value = markerRowById.get(q.anchor_location_id)?.runame ?? '';
		} else if (q.anchor_kind === 'province') {
			document.getElementById('q-anchor-prov').value = provinceNameById[q.anchor_province_id] ?? '';
		} else if (q.anchor_kind === 'point') {
			document.getElementById('q-lng').value = q.lng ?? '';
			document.getElementById('q-lat').value = q.lat ?? '';
		}
		setQuestAnchorMode(q.anchor_kind || 'unplaced');
	} else {
		activeQuestId = null;
		editQuestTitle.textContent = 'Новое задание';
		deleteQuestBtn.classList.add('hidden');
		document.getElementById('q-status').value = opts.statusDefault || 'rumor';
		questStatusField.sync();
		if (opts.anchorLocationId) {
			document.getElementById('q-anchor-loc').value = markerRowById.get(opts.anchorLocationId)?.runame ?? '';
		}
		if (opts.anchorProvinceId) {
			document.getElementById('q-anchor-prov').value = provinceNameById[opts.anchorProvinceId] ?? '';
		}
		setQuestAnchorMode(opts.anchorKind || 'unplaced');
	}
	showQuestEditView();
}

addQuestBtn.addEventListener('click', () => openQuestForm({}));
document.getElementById('quest-back-btn').addEventListener('click', showNormalView);

// «+» в попапе локации/провинции  (data-add-quest="location:<id>" / "province:<id>")
document.addEventListener('click', function(e) {
	const t = e.target.closest('[data-add-quest]');
	if (!t) return;
	const [kind, id] = t.dataset.addQuest.split(':');
	openQuestForm({
		anchorKind: kind, statusDefault: 'rumor',
		anchorLocationId: kind === 'location' ? id : undefined,
		anchorProvinceId: kind === 'province' ? id : undefined,
	});
});

// «Редактировать» в карточке задания
document.addEventListener('click', function(e) {
	const t = e.target.closest('[data-edit-quest]');
	if (t && t.dataset.editQuest) openQuestForm({ questId: t.dataset.editQuest });
});

// Клик по карте при открытой форме задания — ставит точку и, если привязка была
// иной, сам переключает её на «точка» с этими координатами.
map.on('click', function(e) {
	if (editQuestView.classList.contains('hidden')) return;
	if (measuringActive) return;
	setQuestPoint(e.latlng);                       // ставит черновик + q-lng/q-lat
	if (questAnchorKind !== 'point') setQuestAnchorMode('point');   // черновик уже есть → повторно не ставит, только переключает UI
});

questForm.addEventListener('submit', async function(e) {
	e.preventDefault();
	questFormErrorEl.textContent = '';

	const runame = document.getElementById('q-runame').value.trim();
	if (!runame) { questFormErrorEl.textContent = 'Укажите название задания'; return; }

	let anchor_location_id = null, anchor_province_id = null, lng = null, lat = null;
	if (questAnchorKind === 'location') {
		const name = document.getElementById('q-anchor-loc').value.trim();
		const row = allMarkerRows.find(r => r.runame === name);
		if (!row) { questFormErrorEl.textContent = 'Локация с таким названием не найдена'; return; }
		anchor_location_id = row.id;
	} else if (questAnchorKind === 'province') {
		const name = document.getElementById('q-anchor-prov').value.trim();
		const meta = provinceRegionMeta[name];
		if (!meta || !meta.id) { questFormErrorEl.textContent = 'Провинция с таким названием не найдена'; return; }
		anchor_province_id = meta.id;
	} else if (questAnchorKind === 'point') {
		lng = parseFloat(document.getElementById('q-lng').value);
		lat = parseFloat(document.getElementById('q-lat').value);
		if (Number.isNaN(lng) || Number.isNaN(lat)) { questFormErrorEl.textContent = 'Кликните по карте, чтобы поставить точку'; return; }
	}

	// Ветка теперь редактируется/создаётся своей модалкой (#branch-edit-overlay,
	// сохраняется сразу в quest_branches) — здесь просто читаем уже готовый
	// результат её выбора.
	const branch_id = pendingQuestBranch?.id ?? null;
	const branchStepRaw = document.getElementById('q-branch-step').value;
	const branch_step = branch_id && branchStepRaw !== '' ? parseInt(branchStepRaw, 10) : null;
	const branch_or_group = branch_id ? (document.getElementById('q-branch-or-group').value.trim() || null) : null;

	const payload = {
		runame,
		engname:     document.getElementById('q-engname').value.trim() || null,
		description: document.getElementById('q-description').value.trim() || null,
		short_description: document.getElementById('q-short-description').value.trim() || null,
		status:      document.getElementById('q-status').value,
		characters:  getSelectedQuestCharacters(),
		branch_id, branch_step, branch_or_group,
		anchor_kind: questAnchorKind,
		anchor_location_id, anchor_province_id, lng, lat,
		updated_at:  new Date().toISOString(),
	};

	const query = activeQuestId
		? supabaseClient.from('quests').update(payload).eq('id', activeQuestId)
		: supabaseClient.from('quests').insert(payload);

	const result = await runWrite(query);
	if (!result.ok) { questFormErrorEl.textContent = 'Не удалось сохранить: ' + result.message; return; }

	await loadQuests();
	showNormalView();
});

deleteQuestBtn.addEventListener('click', async function() {
	if (!activeQuestId) return;
	if (!confirm('Удалить это задание?')) return;
	const result = await runWrite(supabaseClient.from('quests').delete().eq('id', activeQuestId));
	if (!result.ok) { questFormErrorEl.textContent = 'Не удалось удалить: ' + result.message; return; }
	await loadQuests();
	showNormalView();
});

document.getElementById('quest-sidebar-toggle').addEventListener('click', toggleSidebarCollapsed);


// ─── АДМИНКА: DRAG-AND-DROP ПРИВЯЗКА ЗАДАНИЯ ──────────────────────────────
// Задание тащат за насечку (не за всю строку — иначе конфликт с кликом-
// навигацией). Зоны сброса:
//   • сайдбар            → anchor_kind='unplaced' (снять с карты)
//   • маркер локации     → 'location'
//   • открытый попап пров.→ 'province'
//   • прочее на карте    → 'point' в точке курсора
// Слушатели pointermove/up вешаются на window, чтобы драг не терялся за
// пределами исходного элемента (как в прототипе).
let questDrag = null;

// Курсор двигаем только через transform — это композитинг, без реляйаута
// (в отличие от left/top). Иначе document.elementFromPoint ниже на каждый
// pointermove форсировал бы полный пересчёт раскладки всей карты (~475
// тултипов + маркеры) — отсюда и были «5 fps».
function questDragGhostMove(x, y) {
	if (questDrag?.ghost) questDrag.ghost.style.transform = `translate3d(${x + 12}px, ${y + 10}px, 0)`;
}

function markerIdFromIconEl(iconEl) {
	for (const id in markersById) if (markersById[id]._icon === iconEl) return id;
	return null;
}

function openRegionPopupTier() {
	const src = map._popup && map._popup._source;
	const props = src && src.feature && src.feature.properties;
	return props && props.tier === 'province' ? props.id : null;
}

// Возвращает { kind, id?, lng?, lat?, el? } — цель под курсором.
// Ghost имеет pointer-events:none, поэтому elementFromPoint его не «видит» —
// прятать/показывать его не нужно. needCoords=false (на каждом кадре драга)
// пропускает вычисление lng/lat для точки — они нужны только при сбросе.
function resolveQuestDrop(x, y, needCoords) {
	if (questDrag && x < questDrag.sidebarRight) return { kind: 'unplaced' };

	const mapEl = document.getElementById('map');
	const el = document.elementFromPoint(x, y);

	const popupEl = el && el.closest && el.closest('.leaflet-popup');
	if (popupEl && popupEl.querySelector('.region-popup')) {
		const pid = openRegionPopupTier();
		if (pid) return { kind: 'province', id: pid, el: popupEl };
	}
	const iconEl = el && el.closest && el.closest('.leaflet-marker-icon');
	if (iconEl && !iconEl.classList.contains('quest-point-icon')) {
		const mid = markerIdFromIconEl(iconEl);
		if (mid) return { kind: 'location', id: mid, el: iconEl };
	}
	// Провинция под курсором — когда включена политическая карта и провинции
	// отрисованы (тот же принцип, что у маркера: бросил на область — привязал).
	if (el && mapEl.contains(el) && map.hasLayer(provinceRegions)) {
		const latlng = map.mouseEventToLatLng({ clientX: x, clientY: y });
		const meta = provinceRegionMeta[detectProvinceAt(latlng)];
		if (meta?.id) {
			return { kind: 'province', id: meta.id, el: regionLayerById[meta.id]?.getElement?.() || null };
		}
	}
	if (el && mapEl.contains(el)) {
		if (!needCoords) return { kind: 'point' };
		const latlng = map.mouseEventToLatLng({ clientX: x, clientY: y });
		return { kind: 'point', lng: +latlng.lng.toFixed(1), lat: +latlng.lat.toFixed(1) };
	}
	return { kind: 'unplaced' };
}

function clearQuestDropHighlight() {
	document.querySelectorAll('.quest-drop-target').forEach(el => el.classList.remove('quest-drop-target'));
}

// Хит-тест (elementFromPoint + правки классов) — не чаще одного раза за кадр:
// pointermove может лететь по 120+ раз в секунду, а нам хватает 60.
function questDragHitTest() {
	if (!questDrag) return;
	questDrag.raf = 0;
	const { px, py } = questDrag;
	const drop = resolveQuestDrop(px, py, false);
	questDrag.drop = drop;

	if (drop.el !== questDrag.hlEl) {
		clearQuestDropHighlight();
		if ((drop.kind === 'location' || drop.kind === 'province') && drop.el) drop.el.classList.add('quest-drop-target');
		questDrag.hlEl = drop.el || null;
	}
	const valid = drop.kind !== 'point';
	questDrag.ghost.classList.toggle('over-target', valid);
	const hint = drop.kind === 'location' ? 'вложить в эту локацию'
		: drop.kind === 'province' ? 'привязать к этой провинции'
		: drop.kind === 'unplaced' ? 'снять с карты (в журнал)'
		: 'поставить своей точкой на карте';
	if (hint !== questDrag.hint) { questDragHintEl.textContent = hint; questDrag.hint = hint; }
}

function questDragMove(e) {
	if (!questDrag) return;
	if (!questDrag.moved && Math.hypot(e.clientX - questDrag.startX, e.clientY - questDrag.startY) < 4) return;
	questDrag.moved = true;
	questDrag.px = e.clientX;
	questDrag.py = e.clientY;
	questDragGhostMove(e.clientX, e.clientY);
	if (!questDrag.raf) questDrag.raf = requestAnimationFrame(questDragHitTest);
}

async function questDragEnd(e) {
	window.removeEventListener('pointermove', questDragMove);
	window.removeEventListener('pointerup', questDragEnd);
	const d = questDrag;
	if (d?.raf) cancelAnimationFrame(d.raf);
	// резолвим цель ДО обнуления questDrag (resolveQuestDrop использует sidebarRight из него)
	const drop = (d && d.moved) ? resolveQuestDrop(e.clientX, e.clientY, true) : null;
	questDrag = null;
	document.body.classList.remove('quest-dragging');
	clearQuestDropHighlight();
	questDragHintEl.classList.add('hidden');
	if (d?.ghost) d.ghost.remove();
	if (!drop) return;

	const payload = {
		anchor_kind: drop.kind,
		anchor_location_id: drop.kind === 'location' ? drop.id : null,
		anchor_province_id: drop.kind === 'province' ? drop.id : null,
		lng: drop.kind === 'point' ? drop.lng : null,
		lat: drop.kind === 'point' ? drop.lat : null,
		updated_at: new Date().toISOString(),
	};
	const result = await runWrite(supabaseClient.from('quests').update(payload).eq('id', d.id));
	if (!result.ok) { alert('Не удалось привязать задание: ' + result.message); return; }
	await loadQuests();

	// лёгкая обратная связь: показать результат в новом контексте
	if (drop.kind === 'location') {
		markersById[drop.id]?.openPopup();
	} else if (drop.kind === 'province') {
		regionLayerById[drop.id]?.openPopup();
	} else if (drop.kind === 'point') {
		openQuestCard(d.id);
	} else if (drop.kind === 'unplaced') {
		openQuestCard(d.id);
	}
}

function questDragStart(id, e) {
	if (!isAdmin) return;
	e.preventDefault();
	e.stopPropagation();
	const q = questsById.get(id);
	const ghost = document.createElement('div');
	ghost.className = 'quest-drag-ghost';
	ghost.innerHTML = `<img src="${QUEST_ICON}" width="16" height="16" alt=""><span>${q?.runame ?? ''}</span>`;
	document.body.appendChild(ghost);
	const sb = document.getElementById('sidebar-wrapper');
	questDrag = {
		id, startX: e.clientX, startY: e.clientY, moved: false, ghost, drop: null,
		px: e.clientX, py: e.clientY, raf: 0, hlEl: null, hint: null,
		sidebarRight: sb ? sb.getBoundingClientRect().right : 0,
	};
	questDragGhostMove(e.clientX, e.clientY);
	questDragHintEl.textContent = 'тащите: в локацию · в провинцию · на карту · в журнал';
	questDragHintEl.classList.remove('hidden');
	document.body.classList.add('quest-dragging');
	window.addEventListener('pointermove', questDragMove);
	window.addEventListener('pointerup', questDragEnd);
}

const questDragHintEl = document.createElement('div');
questDragHintEl.id = 'quest-drag-hint';
questDragHintEl.className = 'hidden';
document.body.appendChild(questDragHintEl);

document.addEventListener('pointerdown', function(e) {
	const h = e.target.closest('[data-drag-quest]');
	if (h) questDragStart(h.dataset.dragQuest, e);
});
// клик по насечке в попапе не должен всплывать (Leaflet/попап), а в журнале
// уже отсекается в его click-обработчике
document.addEventListener('click', function(e) {
	if (e.target.closest('[data-drag-quest]')) { e.preventDefault(); e.stopPropagation(); }
}, true);


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
				setTimeout(() => {
					marker.openPopup();
					fitPopupWidth(marker.getPopup());
				}, FOCUS_FLY_DURATION * 1000);
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
	if (!isAdmin) return;
	const editLink = e.target.closest('[data-edit-marker]');
	if (editLink?.dataset.editMarker) {
		const row = allMarkerRows.find(r => r.id === editLink.dataset.editMarker);
		if (row) openMarkerForEdit(row);
	}
});


// ─── САЙДБАР «СЛАВА» (список фракций + репутация) ──────────────────────────
// Список виден всем, редактирует только админ (см. isAdmin-проверки ниже).
// Отдельная таблица quest_branches-подобного вида — factions — никак не
// связана с существующими regionsFactions (полигоны фракций на политической
// карте): это про сюжетную репутацию отряда, а не про территории.
// Герб 16×16 — своя картинка (factions.image, путь как у markers.image),
// без неё — общая заглушка FACTION_ICON.
const FACTION_REPUTATION = {
	positive: { label: 'Положительная', title: '#64a653', score: '#95c46e', effect: '#449a44' },
	negative: { label: 'Отрицательная', title: '#cd5151', score: '#c8705d', effect: '#bc4a3b' },
	neutral:  { label: 'Нейтральная',   title: '#d09b50', score: '#d1a24f', effect: '#b48e58' },
};

let allFactionRows = [];
let factionsById   = new Map();
// Блок описания свёрнут по умолчанию — раскрывается кликом по карточке
// (не по названию — оно отдельная edit-ссылка для админа, см. ниже). Список
// не персистится, обычное UI-состояние на сессию.
const expandedFactionIds = new Set();

async function loadFactions() {
	const { data, error } = await supabaseClient.from('factions').select('*');
	if (error) {
		console.error('Не удалось загрузить фракции из Supabase:', error);
		return;
	}
	allFactionRows = data;
	factionsById = new Map(data.map(f => [f.id, f]));
	renderFactionsList();
}

function loyaltyBarHTML(score, reputation) {
	const repClass = FACTION_REPUTATION[reputation] ? reputation : 'neutral';
	const filled = Math.max(0, Math.min(10, score ?? 0));
	let html = '';
	for (let i = 0; i < 10; i++) {
		html += i < filled
			? `<span class="faction-loyalty-pip faction-loyalty-pip--${repClass}"></span>`
			: `<span class="faction-loyalty-pip"></span>`;
	}
	return html;
}

// Блок описания в вёрстке вообще только если у фракции есть текст описания
// (без description весь блок — текст + «эффект репутации» — не выводится,
// даже если effect заполнен); а из тех, что есть, показан только у
// раскрытых (expandedFactionIds) — по умолчанию свёрнуты, разворачиваются
// кликом по карточке. Название — отдельная edit-ссылка для админа (по
// аналогии с заголовком попапа, см. popup-title--editable), клик по ней не
// должен заодно разворачивать/сворачивать карточку — см. делегат кликов ниже.
function factionCardHTML(f) {
	const rep = FACTION_REPUTATION[f.reputation] ?? FACTION_REPUTATION.neutral;
	const expandable = !!f.description;
	const expanded = expandable && expandedFactionIds.has(f.id);
	const cardClasses = ['faction-card'];
	if (expandable) cardClasses.push('faction-card--expandable');
	if (expanded) cardClasses.push('faction-card--expanded'); // держит яркий градиент, пока карточка раскрыта — независимо от hover
	return `<div class="${cardClasses.join(' ')}" data-faction-id="${f.id}"${expandable ? ' tabindex="0"' : ''}>
		<div class="faction-card-header">
			<img class="faction-card-icon" src="${f.image || FACTION_ICON}" alt="">
			<div class="faction-card-row">
				<div class="faction-card-name-col">
					<p class="faction-card-name${isAdmin ? ' faction-card-name--editable' : ''}"${isAdmin ? ` data-edit-faction="${f.id}" title="Редактировать фракцию"` : ''}>${f.runame ?? ''}</p>
					${f.title ? `<p class="faction-card-title" style="color:${rep.title}">${f.title}</p>` : ''}
				</div>
				<p class="faction-card-score"><span class="faction-card-score-val" style="color:${rep.score}">${f.score ?? 0}</span><span class="faction-card-score-max">/10</span></p>
			</div>
		</div>
		<div class="faction-card-loyalty">${loyaltyBarHTML(f.score, f.reputation)}</div>
		${expanded ? `<div class="faction-card-desc">
			<div class="description">${renderDescription(f.description)}</div>
			${f.effect ? `<p class="faction-card-effect" style="color:${rep.effect}">${f.effect}</p>` : ''}
		</div>` : ''}
	</div>`;
}

function renderFactionsList() {
	const listEl = document.getElementById('factions-list');
	if (!allFactionRows.length) {
		listEl.innerHTML = `<p class="factions-empty">Фракций пока нет</p>`;
		return;
	}
	listEl.innerHTML = [...allFactionRows]
		.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (a.runame || '').localeCompare(b.runame || '', 'ru'))
		.map(factionCardHTML)
		.join('');
}

// «Слава» ⇄ «Карта Хейвена» — переход между обычным сайдбаром и списком
// фракций; .map-title-slava используется на обеих сторонах (см. style.css).
document.getElementById('glory-link').addEventListener('click', showGloryView);
document.getElementById('glory-back-link').addEventListener('click', showNormalView);
document.getElementById('glory-sidebar-toggle').addEventListener('click', toggleSidebarCollapsed);
document.getElementById('edit-faction-sidebar-toggle').addEventListener('click', toggleSidebarCollapsed);

const factionsListEl = document.getElementById('factions-list');
factionsListEl.addEventListener('click', function(e) {
	// Клик по заголовку (герб + название + титул + очки, вся .faction-card-header) —
	// у админа переход в редактирование, карточку НЕ разворачиваем. Клик-цель —
	// [data-edit-faction] на самих элементах содержимого (герб/название+титул/
	// очки), а НЕ на всей строке .faction-card-header: та растянута на 100%
	// ширины (flex-строка с justify-content:space-between между названием и
	// очками), и clientTarget в пустом промежутке/после очков — это сам
	// контейнер, а не текст. Раньше слушали closest('.faction-card-header') —
	// оттуда и был баг «переносит в редактирование при клике правее заголовка».
	const editTarget = e.target.closest('[data-edit-faction]');
	if (editTarget && isAdmin) {
		const row = factionsById.get(editTarget.dataset.editFaction);
		if (row) openFactionForm({ factionId: row.id });
		return;
	}
	// Не-админ по заголовку, или клик по остальной части раскрываемой карточки — тогл описания.
	const card = e.target.closest('.faction-card--expandable');
	if (!card) return;
	const id = card.dataset.factionId;
	if (expandedFactionIds.has(id)) expandedFactionIds.delete(id); else expandedFactionIds.add(id);
	renderFactionsList();
});
factionsListEl.addEventListener('keydown', function(e) {
	if (e.key !== 'Enter' && e.key !== ' ') return;
	if (isAdmin && e.target.closest('[data-edit-faction]')) return; // клавиатурного доступа к редактированию нет — только мышь, как у popup-title--editable
	const card = e.target.closest('.faction-card--expandable');
	if (!card) return;
	e.preventDefault();
	const id = card.dataset.factionId;
	if (expandedFactionIds.has(id)) expandedFactionIds.delete(id); else expandedFactionIds.add(id);
	renderFactionsList();
});


// ─── АДМИНКА: ФОРМА ФРАКЦИИ (добавление / редактирование / удаление) ───────
const editFactionTitle   = document.getElementById('edit-faction-title');
const addFactionBtn      = document.getElementById('add-faction-btn');
const factionBackBtn     = document.getElementById('faction-back-btn');
const deleteFactionBtn   = document.getElementById('delete-faction-btn');
const factionForm        = document.getElementById('faction-form');
const factionFormErrorEl = document.getElementById('faction-form-error');

let activeFactionId = null;

const factionReputationField = upgradeFieldSelect(document.getElementById('fc-reputation'));
document.getElementById('fc-description').addEventListener('keydown', handleFormatShortcut);

function resetFactionForm() {
	factionForm.reset();
	factionFormErrorEl.textContent = '';
	factionReputationField.sync(); // form.reset() не обновляет подпись кастомного триггера
}

// opts: { factionId? }
function openFactionForm(opts = {}) {
	resetFactionForm();

	if (opts.factionId) {
		const f = factionsById.get(opts.factionId);
		if (!f) return;
		activeFactionId = f.id;
		editFactionTitle.textContent = f.runame || 'Фракция';
		deleteFactionBtn.classList.remove('hidden');
		document.getElementById('fc-runame').value = f.runame ?? '';
		document.getElementById('fc-score').value  = f.score ?? 0;
		document.getElementById('fc-reputation').value = f.reputation ?? 'neutral';
		factionReputationField.sync();
		document.getElementById('fc-title').value       = f.title ?? '';
		document.getElementById('fc-effect').value      = f.effect ?? '';
		document.getElementById('fc-image').value       = f.image ?? '';
		document.getElementById('fc-description').value = f.description ?? '';
	} else {
		activeFactionId = null;
		editFactionTitle.textContent = 'Новая фракция';
		deleteFactionBtn.classList.add('hidden');
		document.getElementById('fc-score').value = 0;
	}
	showFactionEditView();
}

addFactionBtn.addEventListener('click', () => openFactionForm({}));
factionBackBtn.addEventListener('click', showGloryView);

factionForm.addEventListener('submit', async function(e) {
	e.preventDefault();
	factionFormErrorEl.textContent = '';

	const runame = document.getElementById('fc-runame').value.trim();
	if (!runame) { factionFormErrorEl.textContent = 'Укажите название фракции'; return; }

	const scoreRaw = parseInt(document.getElementById('fc-score').value, 10);
	const score = Math.max(0, Math.min(10, Number.isNaN(scoreRaw) ? 0 : scoreRaw));

	const payload = {
		runame,
		score,
		reputation:  document.getElementById('fc-reputation').value,
		title:       document.getElementById('fc-title').value.trim() || null,
		effect:      document.getElementById('fc-effect').value.trim() || null,
		image:       document.getElementById('fc-image').value.trim() || null,
		description: document.getElementById('fc-description').value.trim() || null,
		updated_at:  new Date().toISOString(),
	};

	const query = activeFactionId
		? supabaseClient.from('factions').update(payload).eq('id', activeFactionId)
		: supabaseClient.from('factions').insert(payload);

	const result = await runWrite(query);
	if (!result.ok) { factionFormErrorEl.textContent = 'Не удалось сохранить: ' + result.message; return; }

	await loadFactions();
	showGloryView();
});

deleteFactionBtn.addEventListener('click', async function() {
	if (!activeFactionId) return;
	if (!confirm('Удалить эту фракцию?')) return;
	const result = await runWrite(supabaseClient.from('factions').delete().eq('id', activeFactionId));
	if (!result.ok) { factionFormErrorEl.textContent = 'Не удалось удалить: ' + result.message; return; }
	await loadFactions();
	showGloryView();
});


// ─── ВЕТКА ЗАДАНИЙ: МОДАЛКА (общее описание — одно на все задания ветки) ───
// Своя карточка/описание у ветки — слишком лёгкая сущность (имя + текст) для
// отдельного сайдбара, поэтому редактируется маленьким модальным окном по
// центру экрана (тот же стиль, что «Раскрытие описания» — #desc-expand-overlay
// — но со своим сохранением: это отдельная запись в quest_branches, а не то
// же самое поле, что и в форме задания). Сохраняется сразу по кнопке
// «Сохранить» в модалке, НЕ дожидаясь сабмита формы задания — иначе описание
// ветки терялось бы, если админ передумает и закроет форму без сохранения.
let pendingQuestBranch = null;      // { id, runame } | null — ветка редактируемого/нового задания
let lastAutoFilledBranchDesc = '';  // не перетирать ручной ввод описания при переключении между ветками в автокомплите

function renderQuestBranchRow() {
	const el = document.getElementById('quest-branch-row');
	const stepField = document.getElementById('quest-branch-step-field');
	const orGroupField = document.getElementById('quest-branch-or-group-field');
	if (pendingQuestBranch) {
		el.innerHTML = `<span class="quest-branch-chip" title="Изменить ветку">${pendingQuestBranch.runame}</span>`;
		stepField.classList.remove('hidden');
		orGroupField.classList.remove('hidden');
	} else {
		el.innerHTML = `<button type="button" class="glory-add-row">${PLUS_ICON_SVG}<span>Добавить в ветку</span></button>`;
		stepField.classList.add('hidden');
		orGroupField.classList.add('hidden');
	}
}

const branchEditOverlay  = document.getElementById('branch-edit-overlay');
const branchEditTitleEl  = document.getElementById('branch-edit-title');
const beRunameInput      = document.getElementById('be-runame');
const beDescriptionInput = document.getElementById('be-description');
const branchEditErrorEl  = document.getElementById('branch-edit-error');
const branchUnlinkBtn    = document.getElementById('branch-unlink-btn');

upgradeFieldAutocomplete(beRunameInput, 'be-branch-options');
beDescriptionInput.addEventListener('keydown', handleFormatShortcut);

function populateBranchModalOptions() {
	document.getElementById('be-branch-options').innerHTML =
		allBranchRows.map(b => b.runame).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru'))
			.map(n => `<option value="${n}">`).join('');
}

// Выбрали существующую ветку из автокомплита — сразу подтягиваем её текущее
// описание, чтобы можно было тут же поправить. Не перетираем, если админ уже
// что-то вписал сам (сравниваем с тем, что сами же туда в последний раз и
// поставили — lastAutoFilledBranchDesc).
beRunameInput.addEventListener('input', function() {
	const match = allBranchRows.find(b => b.runame === this.value.trim());
	if (!match) return;
	if (beDescriptionInput.value === lastAutoFilledBranchDesc) {
		beDescriptionInput.value = match.description ?? '';
		lastAutoFilledBranchDesc = beDescriptionInput.value;
	}
});

function openBranchEditModal() {
	populateBranchModalOptions();
	branchEditErrorEl.textContent = '';
	if (pendingQuestBranch) {
		branchEditTitleEl.textContent = 'Ветка заданий';
		beRunameInput.value = pendingQuestBranch.runame;
		beDescriptionInput.value = branchesById.get(pendingQuestBranch.id)?.description ?? '';
		branchUnlinkBtn.classList.remove('hidden');
	} else {
		branchEditTitleEl.textContent = 'Новая ветка';
		beRunameInput.value = '';
		beDescriptionInput.value = '';
		branchUnlinkBtn.classList.add('hidden');
	}
	lastAutoFilledBranchDesc = beDescriptionInput.value;
	branchEditOverlay.classList.remove('hidden');
	beRunameInput.focus();
}
function closeBranchEditModal() {
	branchEditOverlay.classList.add('hidden');
	closeFieldOptions(); // на случай открытой панели автокомплита
}

document.getElementById('quest-branch-row').addEventListener('click', openBranchEditModal);

document.getElementById('branch-edit-save-btn').addEventListener('click', async function() {
	branchEditErrorEl.textContent = '';
	const runame = beRunameInput.value.trim();
	if (!runame) { branchEditErrorEl.textContent = 'Укажите название ветки'; return; }
	const description = beDescriptionInput.value.trim() || null;

	// Резолвим по точному имени — как и раньше при неявном создании ветки:
	// нашли существующую — обновляем её описание, не нашли — заводим новую.
	const existing = allBranchRows.find(b => b.runame === runame);
	const { data, error } = existing
		? await supabaseClient.from('quest_branches').update({ description }).eq('id', existing.id).select().single()
		: await supabaseClient.from('quest_branches').insert({ runame, description }).select().single();
	if (error) { branchEditErrorEl.textContent = 'Не удалось сохранить: ' + error.message; return; }

	allBranchRows = allBranchRows.filter(b => b.id !== data.id).concat(data);
	branchesById.set(data.id, data);
	pendingQuestBranch = { id: data.id, runame: data.runame };
	renderQuestBranchRow();
	closeBranchEditModal();
});

branchUnlinkBtn.addEventListener('click', function() {
	pendingQuestBranch = null;
	document.getElementById('q-branch-step').value = '';
	document.getElementById('q-branch-or-group').value = '';
	renderQuestBranchRow();
	closeBranchEditModal();
});

document.getElementById('branch-edit-cancel-btn').addEventListener('click', closeBranchEditModal);
branchEditOverlay.addEventListener('mousedown', function(e) {
	if (e.target === branchEditOverlay) closeBranchEditModal();
});
document.addEventListener('keydown', function(e) {
	if (e.key === 'Escape' && !branchEditOverlay.classList.contains('hidden')) closeBranchEditModal();
});

loadFactions();