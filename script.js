'use strict';
// ═══ Карта Хейвена — новый дизайн ═══
// Figma «Haven Map (NEW)» (fhlfue2iGO03jfkc4DPYG9). Собрано из прототипа
// (сайдбар, попапы, поиск, формы правки) + функции прежнего сайта: вход,
// линейка, векторные провинции, перетаскивание задания, большое окно описания,
// «Восстановить по умолчанию». Разметка — классы из style.css, поведение
// полей форм и окна — раздел «Поля форм и окна».
// Данные — Supabase (supabase-config.js): таблицы markers, quests,
// quest_branches, factions; картинки — хранилище, бакет images. Схема под этот
// код — supabase/2026-10-new-design.sql.

// ─── Константы ────────────────────────────────────────────────────────────
const IMG_W = 5760;
const IMG_H = 4480;

// Типы локаций — порядок и подписи как в макете (кнопки «Локации»).
// large — иконка 16px (Город/Поселение/Форт), остальные 14px.
const LOCATION_TYPES = [
	{ key: 'city',            label: 'Город',          large: true, defaultOn: true },
	{ key: 'town',            label: 'Поселение',      large: true, defaultOn: true },
	{ key: 'fort',            label: 'Форт',           large: true, defaultOn: true },
	{ key: 'camp',            label: 'Лагерь',         defaultOn: true },
	{ key: 'shrine',          label: 'Святилище',      defaultOn: true },
	{ key: 'pointOfInterest', label: 'Точка интереса', defaultOn: true },
	{ key: 'polarGates',      label: 'Врата Древних',  defaultOn: false },
	{ key: 'quest',           label: 'Задания',        defaultOn: false },
];
const TYPE_GROUP = type => type === 'polarGatesBroken' ? 'polarGates' : type;
const MARKER_SIZE = {
	city: 30, town: 28, fort: 28, camp: 24, shrine: 24, pointOfInterest: 24,
	polarGates: 24, polarGatesBroken: 24, quest: 24,
};
const markerIconUrl = type => `images/icons/${MARKER_SIZE[type] ? type : 'settlement'}.png`;

const TRAITS = [
	{ key: 'port',     label: 'Порт' },
	{ key: 'mountain', label: 'Гора' },
	{ key: 'forest',   label: 'Лес' },
	{ key: 'colony',   label: 'Древняя эльфийская колония' },
];
const CHARACTERS = [
	{ key: 'algalon', label: 'Алгалон' },
	{ key: 'vein',    label: 'Вейн' },
	{ key: 'mane',    label: 'Грива' },
	{ key: 'mitra',   label: 'Митра' },
	{ key: 'ulfric',  label: 'Ульфрик' },
];

// Статуса «Активно» больше нет (решение автора): старые «active» читаются
// как «Известно» (см. load).
const STATUS_LABEL = { rumor: 'Слух', known: 'Известно', done: 'Завершено', failed: 'Провалено' };
// «Провалено» фильтруется вместе с «Завершено» (как на сайте).
const statusGroup = s => s === 'failed' ? 'done' : (STATUS_LABEL[s] ? s : 'known');
const isClosedStatus = s => s === 'done' || s === 'failed';

const MAP_LAYERS = [
	{ key: 'political', label: 'Политическая карта' },
	{ key: 'provinces', label: 'Провинции' },
	{ key: 'labels',    label: 'Названия локаций' },
];

// ─── Состояние ────────────────────────────────────────────────────────────
const state = {
	isAdmin: false,
	openSection: 'journal',   // по умолчанию открыт журнал (в разметке — тоже)
	typesOn: new Set(LOCATION_TYPES.filter(t => t.defaultOn).map(t => t.key)),
	layers: { political: false, provinces: true, labels: true },
	status: { rumor: true, known: true, done: false },   // «Завершено» по умолчанию выключено
	// query — варианты слов запроса (см. makeQuery), null — пусто; modes —
	// как сочетать выбранные особенности/персонажей: 'or' | 'and' | 'exclude'.
	search: { query: null, types: new Set(), traits: new Set(), chars: new Set(), modes: { traits: 'or', chars: 'or' } },
	openChainId: null,
	chainTab: {},      // id ветки -> ключ группы
	chainQuest: {},    // id ветки -> id открытого задания
	openFactionId: null,
	openProvinces: new Set(),
	measuring: false,
};
// Открытая форма правки (админ): { kind: 'marker'|'quest'|'faction', id, draft, … } или null.
let edit = null;

// ─── Данные ───────────────────────────────────────────────────────────────
let markers = [], quests = [], branches = [], factions = [];
const markerById = new Map();
const branchById = new Map();
const questsByBranch = new Map();
const questsByLocation = new Map();
const provinceMeta = {};      // название -> { id, owner, engname, feature }
const provinceNameById = {};  // id -> название
regionsProvinces.features.forEach(f => {
	const p = f.properties;
	provinceMeta[p.name] = { id: p.id, owner: p.owner, engname: p.engname, feature: f };
	provinceNameById[p.id] = p.name;
});
// Территории фракций политической карты — к ним тоже привязываются задания.
const factionRegionById = Object.fromEntries(regionsFactions.features.map(f => [f.properties.id, f]));

// ─── Утилиты ──────────────────────────────────────────────────────────────
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plural = (n, one, few, many) => {
	const m10 = n % 10, m100 = n % 100;
	if (m10 === 1 && m100 !== 11) return one;
	if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
	return many;
};
const byName = (a, b) => (a.runame || '').localeCompare(b.runame || '', 'ru');
const pushTo = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };

// Провинция по точке — как detectProvinceAt в script.js
function pointInRing(x, y, ring) {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
		if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
	}
	return inside;
}
const pointInRings = (x, y, rings) => pointInRing(x, y, rings[0]) && !rings.slice(1).some(r => pointInRing(x, y, r));
function pointInGeometry(x, y, g) {
	if (g.type === 'Polygon') return pointInRings(x, y, g.coordinates);
	if (g.type === 'MultiPolygon') return g.coordinates.some(r => pointInRings(x, y, r));
	return false;
}
const detectProvinceAt = (lat, lng) =>
	regionsProvinces.features.find(f => pointInGeometry(lng, lat, f.geometry))?.properties.name ?? '';

// Центр области — середина рамки самого большого кольца (для заданий,
// привязанных к провинции или территории фракции целиком).
const provinceCenter = name => geometryCenter(provinceMeta[name]?.feature.geometry);
function geometryCenter(g) {
	if (!g) return null;
	const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
	let best = null, bestSize = -1;
	for (const rings of polys) {
		const xs = rings[0].map(p => p[0]), ys = rings[0].map(p => p[1]);
		const size = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
		if (size > bestSize) { bestSize = size; best = [(Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...xs) + Math.max(...xs)) / 2]; }
	}
	return best;
}

// Описания — тот же лёгкий markdown, что на сайте (renderDescription).
const DESC_LINK_RE = /\[([^\]]+)\]\((loc|province|faction):([^)]+)\)/g;
function renderMarkdownBlock(block) {
	const t = block.trim();
	if (!t) return '';
	if (t.startsWith('<')) return t;
	const lines = t.split('\n');
	if (lines.every(l => l.trim().startsWith('>') || !l.trim())) {
		const inner = lines.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
		return `<blockquote>${inner.split(/\n\s*\n/).map(renderMarkdownBlock).join('')}</blockquote>`;
	}
	return `<p>${t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/_([^_]+)_/g, '<i>$1</i>').replace(/\n/g, '<br>')}</p>`;
}
// Ссылка в описании — с иконкой того, куда ведёт: провинция / фракция или
// тип локации (как на прежнем сайте); клик — попап локации или региона.
function descLinkIcon(type, id) {
	if (type === 'province') return 'images/icons/province.png';
	if (type === 'faction') return 'images/icons/faction.png';
	return markerIconUrl(markerById.get(id)?.location_type);
}
function renderDescription(text) {
	if (!text) return '';
	return text.split(/\n\s*\n/).map(renderMarkdownBlock).join('')
		.replace(DESC_LINK_RE, (m, label, type, id) =>
			`<span class="desc-link" data-action="ref" data-ref-type="${type}" data-ref-id="${esc(id)}"><img src="${descLinkIcon(type, id)}" alt="">${label}</span>`);
}
// Первый абзац описания простым текстом — для карточек (ветка, задание).
function firstParagraph(md) {
	if (!md) return '';
	const d = document.createElement('div');
	d.innerHTML = renderDescription(md);
	return (d.querySelector('p') ?? d).textContent.trim();
}

// ─── Задания: видимость, место, прогресс ──────────────────────────────────
const questVisibleBase = q => q.status !== 'rumor' || state.isAdmin;

function questPlace(q) {
	if (q.anchor_kind === 'location') return markerById.get(q.anchor_location_id)?.runame ?? 'Где-то в мире';
	if (q.anchor_kind === 'province') return provinceNameById[q.anchor_province_id] ?? 'Где-то в мире';
	if (q.anchor_kind === 'faction') return factionRegionById[q.anchor_faction_id]?.properties.name ?? 'Где-то в мире';
	if (q.anchor_kind === 'point' && q.lat != null) return detectProvinceAt(q.lat, q.lng) || 'В неизведанных землях';
	return 'Где-то в мире';
}
function questLatLng(q) {
	if (q.anchor_kind === 'location') { const m = markerById.get(q.anchor_location_id); return m ? [m.lat, m.lng] : null; }
	if (q.anchor_kind === 'province') return provinceCenter(provinceNameById[q.anchor_province_id]);
	if (q.anchor_kind === 'faction') return geometryCenter(factionRegionById[q.anchor_faction_id]?.geometry);
	if (q.anchor_kind === 'point' && q.lat != null) return [q.lat, q.lng];
	return null;
}

const branchGroupKey = q => q.branch_or_group || `__solo_${q.id}`;
// «Выполнено/всего» — по шагам, как branchProgress в script.js
function branchProgress(members) {
	const steps = new Map();
	for (const q of members) {
		const stepKey = q.branch_step ?? `__nostep_${q.id}`;
		if (!steps.has(stepKey)) steps.set(stepKey, new Map());
		pushTo(steps.get(stepKey), branchGroupKey(q), q);
	}
	let done = 0;
	for (const groups of steps.values()) {
		if ([...groups.values()].some(g => g.every(q => statusGroup(q.status) === 'done'))) done++;
	}
	return { done, total: steps.size };
}

// ─── Поиск и его фильтры — «всё сразу»: провинции, журнал, слава, метки ──
// Фракции ищутся по названию и титулу; фильтры по локациям и персонажам
// к ним не относятся.

// Текст — «с защитой от дурака»: не важны регистр, ё/е, апострофы, дефисы,
// скобки и пробелы («Чи Ан» = «Чи'Ан» = «чиан»), порядок слов, а также
// раскладка клавиатуры («Xb Fy» = «Чи Ан»).
const LAYOUT_EN = "`qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const LAYOUT_RU = 'ёйцукенгшщзхъфывапролджэячсмитьбю';
const swapLayout = (s, from, to) => [...s].map(c => { const i = from.indexOf(c); return i < 0 ? c : to[i]; }).join('');
const searchWords = s => String(s ?? '').toLowerCase().replace(/ё/g, 'е').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
function makeQuery(raw) {
	const low = String(raw).toLowerCase();
	const variants = [...new Set([low, swapLayout(low, LAYOUT_EN, LAYOUT_RU), swapLayout(low, LAYOUT_RU, LAYOUT_EN)])]
		.map(searchWords).filter(words => words.length);
	return variants.length ? variants : null;
}
// Совпадение: все слова запроса есть в одном поле (название, место, ветка…),
// поле — без пробелов и знаков. Слова в разных полях не считаются: иначе
// короткие «чи» и «ан» находили бы что угодно.
function textMatches(fields) {
	const query = state.search.query;
	if (!query) return true;
	const compact = fields.map(f => searchWords(f).join('')).filter(Boolean);
	return query.some(words => compact.some(f => words.every(w => f.includes(w))));
}

// Выбранные ключи против ключей у сущности (как matchesTraitSet на сайте):
// «или» — любой из выбранных, «и» — все сразу, «искл.» — ни одного.
function matchesSet(keys, selected, mode) {
	if (!selected.size) return true;
	if (mode === 'exclude') return ![...selected].some(k => keys.includes(k));
	return mode === 'and' ? [...selected].every(k => keys.includes(k)) : [...selected].some(k => keys.includes(k));
}
const hasSearchFilters = () => state.search.types.size || state.search.traits.size || state.search.chars.size;
const searchActive = () => !!state.search.query || !!hasSearchFilters();
// Персонажи локации — все персонажи её заданий.
const locationChars = row => (questsByLocation.get(row.id) || []).filter(questVisibleBase).flatMap(q => q.characters || []);

function locationPasses(row) {
	const s = state.search;
	if (s.types.size && !s.types.has(TYPE_GROUP(row.location_type))) return false;
	if (!matchesSet(row.traits || [], s.traits, s.modes.traits)) return false;
	if (!matchesSet(locationChars(row), s.chars, s.modes.chars)) return false;
	return textMatches([row.runame, row.engname, row.province]);
}
// Тип и особенности задания — его локации (у задания без локации их нет).
function questPasses(q) {
	const s = state.search;
	if (!questVisibleBase(q)) return false;
	if (!matchesSet(q.characters || [], s.chars, s.modes.chars)) return false;
	const row = q.anchor_kind === 'location' ? markerById.get(q.anchor_location_id) : null;
	if (s.types.size && !(row && s.types.has(TYPE_GROUP(row.location_type)))) return false;
	if (!matchesSet(row?.traits || [], s.traits, s.modes.traits)) return false;
	return textMatches([q.runame, questPlace(q), branchById.get(q.branch_id)?.runame]);
}
const questInJournal = q => questPasses(q) && state.status[statusGroup(q.status)];
const factionPasses = f => textMatches([f.runame, f.title]);

// ─── Карта ────────────────────────────────────────────────────────────────
const HavenCRS = L.Util.extend({}, L.CRS.Simple, { transformation: new L.Transformation(1, 0, -1, IMG_H) });
const map = L.map('map', { crs: HavenCRS, minZoom: -5, maxZoom: 1, zoomControl: false, attributionControl: false });
const bounds = [[0, 0], [IMG_H, IMG_W]];
const tileOptions = { tileSize: 256, bounds, noWrap: true, minZoom: -5, maxZoom: 1, maxNativeZoom: 0 };
L.tileLayer('tiles/{z}/{x}/{y}.png', tileOptions).addTo(map);
map.fitBounds(bounds);

map.createPane('provincesPane');
const provincesTiles = L.tileLayer('tiles_provinces/{z}/{x}/{y}.png', { ...tileOptions, updateWhenZooming: false, pane: 'provincesPane' });
map.createPane('regionsPane');
map.getPane('regionsPane').style.zIndex = 350;
map.getPane('regionsPane').style.filter = 'blur(2px)';

// ─── Политическая карта (как на прежнем сайте): фракции + провинции ───────
// На малом зуме — владения фракций; с зума POLITICAL_TIER_ZOOM поверх лежат
// провинции: в покое невидимы, при наведении или открытом попапе заливка
// такая, что вместе с фракцией под ней даёт ту же яркость, что подсветка
// фракции. Фракции тогда — только подложка (не перехватывают наведение и
// клики). Клик — попап региона (у провинции — с её заданиями); в режиме
// правки и с линейкой клик уходит карте.
const POLITICAL_TIER_ZOOM = -1;
const REGION_FILL = 0.32, REGION_FILL_HOVER = 0.55;
const PROVINCE_FILL_ACTIVE = 1 - (1 - REGION_FILL_HOVER) / (1 - REGION_FILL);
const regionsRenderer = L.svg({ padding: 2, pane: 'regionsPane' });
const regionLayerById = new Map();
let hoveredRegion = null, selectedRegion = null;
function regionStyle(layer) {
	const r = layer._region;
	const active = !r.noHighlight && (layer === hoveredRegion || layer === selectedRegion);
	layer.setStyle({ fillOpacity: active ? r.fillActive : r.fill });
}
function makeRegionLayer(geojson, tier, fill, fillActive) {
	return L.geoJSON(geojson, {
		pane: 'regionsPane',
		renderer: regionsRenderer,
		style: f => ({ className: 'region-shape', stroke: false, fillColor: f.properties.color, fillOpacity: fill }),
		onEachFeature: (f, layer) => {
			// owner '' — «ничья» земля: попап есть, подсветки нет
			layer._region = { props: { ...f.properties, tier }, fill, fillActive, noHighlight: f.properties.owner === '' };
			layer.on('mouseover', () => {
				const prev = hoveredRegion;
				hoveredRegion = layer;
				if (prev) regionStyle(prev);
				regionStyle(layer);
			});
			layer.on('mouseout', () => {
				if (hoveredRegion === layer) hoveredRegion = null;
				regionStyle(layer);
			});
			layer.on('click', e => { if (!edit && !state.measuring) openRegionPopup(layer, e.latlng); });
			if (f.properties.id != null) regionLayerById.set(String(f.properties.id), layer);
		},
	});
}
const factionRegions = makeRegionLayer(regionsFactions, 'faction', REGION_FILL, REGION_FILL_HOVER);
const provinceRegions = makeRegionLayer(regionsProvinces, 'province', 0, PROVINCE_FILL_ACTIVE);
// подстраховка: курсор резко ушёл с карты, а mouseout не пришёл
map.on('mouseout', () => { const prev = hoveredRegion; hoveredRegion = null; if (prev) regionStyle(prev); });
// Слой-обёртка: включается одним чекбоксом «Политическая карта», ярус — по зуму.
const PoliticalLayer = L.Layer.extend({
	onAdd(m) {
		m.addLayer(factionRegions);
		this._sync();
		m.on('zoomend', this._sync, this);
	},
	onRemove(m) {
		m.off('zoomend', this._sync, this);
		m.removeLayer(factionRegions);
		m.removeLayer(provinceRegions);
	},
	_sync() {
		const provincesOn = this._map.getZoom() >= POLITICAL_TIER_ZOOM;
		if (provincesOn !== this._map.hasLayer(provinceRegions)) provincesOn ? this._map.addLayer(provinceRegions) : this._map.removeLayer(provinceRegions);
		factionRegions.eachLayer(l => l.getElement()?.classList.toggle('region-inert', provincesOn));
	},
});
const politicalLayer = new PoliticalLayer();

const markerLayerById = new Map();   // id локации -> L.Marker
const questPointLayers = new Map();  // id задания (точка) -> L.Marker

function makeIcon(type) {
	const s = MARKER_SIZE[type] ?? 24;
	return L.icon({ iconUrl: markerIconUrl(type), iconSize: [s, s] });
}
function buildMarkers() {
	for (const row of markers) {
		if (row.lat == null || row.lng == null) continue;
		const m = L.marker([row.lat, row.lng], { icon: makeIcon(row.location_type) });
		m.bindTooltip(row.runame ?? '', { permanent: true, direction: 'bottom', offset: [0, (MARKER_SIZE[row.location_type] ?? 24) / 2], className: 'location-name-label', interactive: false });
		m.on('click', () => edit ? editMarkerClicked(row) : openLocationPopup(row, { fly: false }));
		markerLayerById.set(row.id, m);
	}
	for (const q of quests) {
		if (q.anchor_kind !== 'point' || q.lat == null) continue;
		const m = L.marker([q.lat, q.lng], { icon: makeIcon('quest') });
		m.bindTooltip(q.runame ?? '', { permanent: true, direction: 'bottom', offset: [0, 12], className: 'location-name-label', interactive: false });
		m.on('click', () => { if (!edit) openQuestPopup(q, { fly: false }); });
		questPointLayers.set(q.id, m);
	}
}
// После загрузки или правки — всё заново: индексы, метки на карте, разделы.
function clearMapMarkers() {
	[...markerLayerById.values(), ...questPointLayers.values()].forEach(m => m.remove());
	markerLayerById.clear();
	questPointLayers.clear();
}
function refreshAll() {
	indexData();
	clearMapMarkers();
	buildMarkers();
	renderAll();
}
// Метка видна, если включён её тип в «Локациях» и она проходит поиск и его
// фильтры. При включённых «Заданиях» локация с заданием становится типа
// «задание» (как на сайте): другая иконка, управляется только «Заданиями».
// Метка, которую сейчас правят, спрятана — вместо неё черновик (см. «Админка»).
function updateMarkers() {
	const questsOn = state.typesOn.has('quest');
	const editing = kind => edit?.kind === kind ? edit.id : null;
	for (const row of markers) {
		const m = markerLayerById.get(row.id);
		if (!m) continue;
		const hasQuest = (questsByLocation.get(row.id) || []).some(questVisibleBase);
		const asQuest = questsOn && hasQuest;
		const group = asQuest ? 'quest' : TYPE_GROUP(row.location_type);
		if (m._asQuest !== asQuest) { m.setIcon(makeIcon(asQuest ? 'quest' : row.location_type)); m._asQuest = asQuest; }
		const show = state.typesOn.has(group) && locationPasses(row) && row.id !== editing('marker');
		if (show !== map.hasLayer(m)) show ? m.addTo(map) : m.remove();
	}
	for (const [id, m] of questPointLayers) {
		const q = quests.find(x => x.id === id);
		const show = questsOn && questPasses(q) && id !== editing('quest');
		if (show !== map.hasLayer(m)) show ? m.addTo(map) : m.remove();
	}
}
function updateLayers() {
	const toggle = (layer, on) => { if (on !== map.hasLayer(layer)) on ? layer.addTo(map) : layer.remove(); };
	toggle(politicalLayer, state.layers.political);
	toggle(provincesTiles, state.layers.provinces);
	document.getElementById('map').classList.toggle('show-location-names', state.layers.labels && map.getZoom() >= 0);
}
map.on('zoomend', updateLayers);
map.on('zoomanim', e => { if (e.zoom < 0) document.getElementById('map').classList.remove('show-location-names'); });

// ─── Попапы ───────────────────────────────────────────────────────────────
const sidebarEl = document.getElementById('sidebar');
const sidebarWidth = () => sidebarEl.classList.contains('is-collapsed') ? 0 : sidebarEl.offsetWidth;

// Без точки привязки (задание без места) — попап внизу по центру карты.
function openPopup(latlng, html, { offsetY = 0 } = {}) {
	const popup = L.popup({
		className: 'popup',
		closeButton: false,
		minWidth: 340,
		maxWidth: 340,
		maxHeight: Math.max(240, map.getSize().y - 120),
		offset: [0, offsetY],
		autoPanPaddingTopLeft: [sidebarWidth() + 24, 24],
		autoPanPaddingBottomRight: [80, 24],
	});
	popup.setLatLng(latlng ?? map.containerPointToLatLng([(sidebarWidth() + map.getSize().x) / 2, map.getSize().y - 60]))
		.setContent(html)
		.openOn(map);
	return popup;
}
// Перелёт к точке: она встаёт в середину видимой части карты (справа от
// сайдбара), а then (открыть попап) — когда карта доехала. Иначе анимация
// перекрывала подстройку попапа, и он оставался наполовину под сайдбаром.
function flyTo(latlng, then) {
	const zoom = Math.max(map.getZoom(), -1);
	const center = map.unproject(map.project(latlng, zoom).subtract([sidebarWidth() / 2, 0]), zoom);
	if (then) map.once('moveend', then);
	map.setView(center, zoom, { animate: true });
}

function infoGridHTML(items) {
	const list = items.filter(Boolean);
	if (!list.length) return '';
	return `<div class="pop__info">${list.map((it, i) =>
		`<span class="pop__info-label" style="grid-column:${i + 1}">${it.label}</span>`
		+ `<span class="pop__info-value" style="grid-column:${i + 1}"${it.action ? ` data-action="${it.action}" data-id="${esc(it.id)}"` : ''}>${esc(it.value)}</span>`
	).join('')}</div>`;
}

function questLinkHTML(q) {
	return `<span class="quest-link" role="link" tabindex="0" data-action="open-quest" data-id="${q.id}"><span>Перейти к заданию</span>`
		+ `<span class="quest-link__arrow"><svg class="quest-link__arrow-rest" width="14" height="6" aria-hidden="true"><use href="#arrow"/></svg>`
		+ `<svg class="quest-link__arrow-hover" width="14" height="6" aria-hidden="true"><use href="#arrow"/></svg></span></span>`;
}
function questStatusHTML(q) {
	const s = STATUS_LABEL[q.status] ? q.status : 'known';
	return `<p class="quest-status quest-status--${s}"><span class="quest-status__word">${STATUS_LABEL[s]}</span> `
		+ `<span class="quest-status__place">• ${esc(questPlace(q))}</span></p>`;
}
// «Последствия» — чем закончилось задание (quest_done-update / quest_failed-update
// в макете): блок цитаты прямым шрифтом, полоса — цвет статуса.
const outcomeHTML = q => q.outcome
	? `<p class="outcome outcome--${STATUS_LABEL[q.status] ? q.status : 'known'}">${esc(q.outcome).replace(/\n/g, '<br>')}</p>` : '';
// У админа правые 40px карточки — зона, за которую задание тащат на карту
// (см. «Перетаскивание задания»).
function questCardHTML(q) {
	const desc = q.short_description || firstParagraph(q.description);
	return `<div class="quest-card${isClosedStatus(q.status) ? ' is-closed' : ''}"${state.isAdmin ? ` data-drag-quest="${q.id}"` : ''}>`
		+ `<p class="quest-card__title">${esc(q.runame)}</p>`
		+ questStatusHTML(q)
		+ (desc ? `<p class="quest-card__desc">${esc(desc)}</p>` : '')
		+ outcomeHTML(q)
		+ questLinkHTML(q)
		+ `</div>`;
}

// Картинка-фон попапа локации. Видимая область — row.image_view
// { x, y, zoom } (выбирается в форме локации; x/y — доли 0…1), по умолчанию —
// низ картинки по центру.
const DEFAULT_IMAGE_VIEW = { x: .5, y: 1, zoom: 1 };
const imageViewStyle = v => `--x: ${(v.x * 100).toFixed(2)}%; --y: ${(v.y * 100).toFixed(2)}%; --zoom: ${(+v.zoom).toFixed(3)}`;
const popBgHTML = row => row.image
	? `<div class="pop__bg" style="${imageViewStyle(row.image_view ?? DEFAULT_IMAGE_VIEW)}"><img src="${esc(row.image)}" alt=""></div>` : '';

// Карандаш у заголовка попапа (только админ) — открывает форму правки.
const popEditHTML = (action, id, title) => state.isAdmin
	? `<img class="pop__edit" src="images/ui/edit.svg" alt="" title="${title}" data-action="${action}" data-id="${id}">` : '';

// preview — живой вид в форме локации: без заданий и админских кнопок.
function locationPopupHTML(row, { preview = false } = {}) {
	const traits = (row.traits || []).filter(t => TRAITS.some(x => x.key === t))
		.map(t => `<img src="images/icons/${t}.png" alt="" title="${esc(TRAITS.find(x => x.key === t).label)}">`).join('');
	const qs = preview ? [] : (questsByLocation.get(row.id) || []).filter(questVisibleBase).sort(byName);
	const addQuest = state.isAdmin && !preview ? addButtonHTML('Новое задание', 'new-quest', `location:${row.id}`) : '';
	return `<div class="pop">`
		+ popBgHTML(row)
		+ `<div class="pop__head"><div class="pop__title-row"><h2 class="pop__title">${esc(row.runame)}</h2>${preview ? '' : popEditHTML('edit-marker', row.id, 'Редактировать локацию')}${traits}</div>`
		+ (row.engname ? `<p class="pop__eng">${esc(row.engname)}</p>` : '')
		+ `</div>`
		+ infoGridHTML([
			row.faction && { label: 'Фракция', value: row.faction, ...regionAction(factionRegionId(row.faction)) },
			row.province && { label: 'Провинция', value: row.province, action: 'open-province', id: row.province },
		])
		+ (row.description ? `<div class="pop__desc">${renderDescription(row.description)}</div>` : '')
		+ questsBlockHTML(qs, addQuest)
		+ `</div>`;
}
// Блок «Задания» в попапе локации / провинции.
const questsBlockHTML = (qs, addQuest) => qs.length || addQuest
	? `<div class="pop__quests"><div class="pop__quests-head"><p class="pop__section-label">Задания</p>${addQuest}</div>${qs.map(questCardHTML).join('')}</div>` : '';
// Значение в инфо-сетке, ведущее к региону на карте (если он есть).
const regionAction = id => id ? { action: 'focus-region', id } : {};
const factionRegionId = name => name ? regionsFactions.features.find(f => f.properties.name === name)?.properties.id : null;
function questPopupHTML(q) {
	const chars = (q.characters || []).map(c => `<img src="images/icons/${c}.png" alt="" title="${esc(CHARACTERS.find(x => x.key === c)?.label ?? c)}">`).join('');
	const branch = branchById.get(q.branch_id);
	return `<div class="pop pop--quest">`
		+ `<div class="pop__head"><div class="pop__title-row"><h2 class="pop__title">${esc(q.runame)}</h2>${popEditHTML('edit-quest', q.id, 'Редактировать задание')}${chars}</div></div>`
		+ infoGridHTML([
			{ label: 'Место', value: questPlace(q), ...(q.anchor_kind === 'location' ? { action: 'open-location', id: q.anchor_location_id }
				: q.anchor_kind === 'province' ? regionAction(q.anchor_province_id)
				: q.anchor_kind === 'faction' ? regionAction(q.anchor_faction_id) : {}) },
			branch && { label: 'Ветка заданий', value: branch.runame, action: 'open-chain', id: q.id },
		])
		+ (q.description ? `<div class="pop__desc">${renderDescription(q.description)}</div>`
			: q.short_description ? `<div class="pop__desc"><p>${esc(q.short_description)}</p></div>` : '')
		+ (q.outcome ? `<div class="pop__outcome">${outcomeHTML(q)}</div>` : '')
		+ `</div>`;
}
// Попап региона — провинции или территории фракции: его задания и, для
// админа, «+ Новое задание» с привязкой к нему.
function regionPopupHTML(p) {
	const kind = p.tier === 'province' ? 'province' : 'faction';
	const idKey = `anchor_${kind}_id`;
	const qs = p.id ? quests.filter(q => q.anchor_kind === kind && q[idKey] === p.id && questVisibleBase(q)).sort(byName) : [];
	const addQuest = p.id && state.isAdmin ? addButtonHTML('Новое задание', 'new-quest', `${kind}:${p.id}`) : '';
	return `<div class="pop">`
		+ `<div class="pop__head"><div class="pop__title-row"><h2 class="pop__title">${esc(p.name)}</h2></div>`
		+ (p.engname ? `<p class="pop__eng">${esc(p.engname)}</p>` : '')
		+ `</div>`
		+ infoGridHTML([p.owner && p.owner !== p.name && { label: 'Фракция', value: p.owner, ...regionAction(factionRegionId(p.owner)) }])
		+ (p.description ? `<div class="pop__desc">${renderDescription(p.description)}</div>` : '')
		+ questsBlockHTML(qs, addQuest)
		+ `</div>`;
}
// Открытый попап держит подсветку своего региона.
function openRegionPopup(layer, latlng) {
	const p = layer._region.props;
	openPopup(latlng, regionPopupHTML(p));
	popupPlace = { kind: p.tier === 'province' ? 'province' : 'faction', id: p.id, name: p.name };
	const prev = selectedRegion;
	selectedRegion = layer;
	if (prev) regionStyle(prev);
	regionStyle(layer);
}
// Место, чей попап открыт (локация / провинция / территория фракции), — на
// него можно бросить задание, перетаскивая (см. «Перетаскивание задания»).
let popupPlace = null;
map.on('popupclose', () => {
	popupPlace = null;
	const prev = selectedRegion;
	selectedRegion = null;
	if (prev) regionStyle(prev);
});
// Перейти к региону (ссылка в описании, «Фракция» / «Место» в попапе):
// включить политическую карту, долететь и открыть его попап.
function focusRegion(id) {
	const layer = regionLayerById.get(String(id));
	if (!layer) return;
	if (!state.layers.political) { state.layers.political = true; syncLayers(); updateLayers(); }
	const center = layer.getBounds().getCenter();
	flyTo(center, () => openRegionPopup(layer, center));
}

function openLocationPopup(row, { fly = true } = {}) {
	const latlng = [row.lat, row.lng];
	const shownAsQuest = markerLayerById.get(row.id)?._asQuest;
	const open = () => {
		openPopup(latlng, locationPopupHTML(row), { offsetY: -(shownAsQuest ? MARKER_SIZE.quest : MARKER_SIZE[row.location_type] ?? 24) / 2 });
		popupPlace = { kind: 'location', id: row.id, name: row.runame };
	};
	fly ? flyTo(latlng, open) : open();
}
// Попап встаёт над верхним краем иконки на месте задания: у локации это её
// метка (или иконка задания, если включены «Задания»), у точки — иконка задания.
function questIconHalf(q) {
	if (q.anchor_kind === 'province' || q.anchor_kind === 'faction') return 0;
	if (q.anchor_kind === 'location') {
		const m = markerLayerById.get(q.anchor_location_id);
		const row = markerById.get(q.anchor_location_id);
		return (m?._asQuest ? MARKER_SIZE.quest : MARKER_SIZE[row?.location_type] ?? 24) / 2;
	}
	return MARKER_SIZE.quest / 2;
}
function openQuestPopup(q, { fly = true } = {}) {
	const latlng = questLatLng(q);
	const open = () => openPopup(latlng, questPopupHTML(q), { offsetY: -questIconHalf(q) });
	latlng && fly ? flyTo(latlng, open) : open();
}

// ─── Сайдбар: разметка разделов ───────────────────────────────────────────
const sectionEls = Object.fromEntries([...document.querySelectorAll('.sb-section')].map(s => [s.dataset.section, s]));
const setContent = (key, html) => { sectionEls[key].querySelector('[data-content]').innerHTML = html; };
const setCount = (key, text) => { sectionEls[key].querySelector('[data-count]').textContent = text; };

function iconButtonHTML({ icon, label, count, large, selected, action, key, closed }) {
	return `<button type="button" class="btn ${large ? 'btn--icon-lg' : 'btn--icon'}${selected ? ' selected' : ''}${closed ? ' is-closed' : ''}" data-action="${action}" data-key="${esc(key)}">`
		+ `<span class="btn__icon"><img class="btn__raster" src="${icon}" alt=""></span>`
		+ `<span class="btn__label">${esc(label)}</span>`
		+ (count != null ? `<span class="btn__count">${count}</span>` : '')
		+ `</button>`;
}
function statusButtonHTML(status, count) {
	return `<button type="button" class="btn btn--icon${state.status[status] ? ' selected' : ''}" data-action="status" data-key="${status}">`
		+ `<span class="status-icon status-icon--${status}"><img src="images/ui/status/${status}.svg" alt=""></span>`
		+ `<span class="btn__label">${STATUS_LABEL[status]}</span><span class="btn__count">${count}</span></button>`;
}
function addButtonHTML(label, action, key = '') {
	return `<button type="button" class="btn btn--icon btn--add" data-action="${action}" data-key="${esc(key)}"><span class="btn__icon"><img src="images/ui/plus.svg" alt=""></span><span class="btn__label">${label}</span></button>`;
}

function renderLocations() {
	const typeCount = {};
	markers.forEach(r => { const g = TYPE_GROUP(r.location_type); typeCount[g] = (typeCount[g] || 0) + 1; });
	typeCount.quest = quests.filter(questVisibleBase).length;
	setContent('locations', `<div class="btn-row">${LOCATION_TYPES.map(t => iconButtonHTML({
		icon: `images/icons/${t.key}.png`, label: t.label, count: typeCount[t.key] ?? 0, large: t.large,
		selected: state.typesOn.has(t.key), action: 'type', key: t.key,
	})).join('')}${state.isAdmin ? addButtonHTML('Новый маркер', 'new-marker') : ''}</div>`);
	setCount('locations', `${state.typesOn.size}/${LOCATION_TYPES.length}`);
}
// Переключения кнопок и чекбоксов — на месте, без перерисовки: новая кнопка
// сразу в новом состоянии, и анимация выбора не видна.
function syncLocations() {
	sectionEls.locations.querySelectorAll('[data-action="type"]').forEach(b => b.classList.toggle('selected', state.typesOn.has(b.dataset.key)));
	setCount('locations', `${state.typesOn.size}/${LOCATION_TYPES.length}`);
}

function renderLayers() {
	setContent('layers', `<div class="checkbox-list">${MAP_LAYERS.map(l =>
		`<div class="checkbox${state.layers[l.key] ? ' selected' : ''}" data-action="layer" data-key="${l.key}">`
		+ `<span class="checkbox__box"><span class="checkbox__frame"></span><img src="images/ui/checkbox--checked.svg" alt=""></span><span>${l.label}</span></div>`
	).join('')}</div>`);
	syncLayers();
}
function syncLayers() {
	sectionEls.layers.querySelectorAll('[data-action="layer"]').forEach(c => c.classList.toggle('selected', state.layers[c.dataset.key]));
	setCount('layers', `${MAP_LAYERS.filter(l => state.layers[l.key]).length}/${MAP_LAYERS.length}`);
}

// Журнал: ветки (свёрнута/раскрыта) и отдельные задания.
function chainGroups(members) {
	const groups = new Map();
	[...members].sort((a, b) => (a.branch_step ?? Infinity) - (b.branch_step ?? Infinity) || byName(a, b))
		.forEach(q => pushTo(groups, branchGroupKey(q), q));
	return groups;
}
// Название «или»-группы — quest_branches.or_group_titles { метка: название }
// (правится в окне ветки); нет — название задания, если оно в группе одно.
function groupTitle(branch, key, list) {
	return branch.or_group_titles?.[key] || (list.length === 1 ? list[0].runame : key);
}
const chainMembers = id => (questsByBranch.get(id) || []).filter(questVisibleBase);

// Тело ветки (вкладки «или»-групп, чипы-задания, открытое задание) рисуется
// всегда — раскрытие только переключает .is-open, чтобы работали переходы.
function chainBodyHTML(branch, members) {
	const groups = chainGroups(members);
	const showTabs = groups.size >= 2 && [...groups.values()].some(g => g.length >= 2);
	let html = '';
	let chips;
	if (showTabs) {
		const keys = [...groups.keys()];
		let tab = state.chainTab[branch.id];
		if (!groups.has(tab)) tab = keys.find(k => groups.get(k).some(q => !isClosedStatus(q.status))) ?? keys[0];
		state.chainTab[branch.id] = tab;
		chips = groups.get(tab);
		html += `<div class="chain__tabs">${keys.map(k => {
			const g = groups.get(k), n = g.length, d = g.filter(q => isClosedStatus(q.status)).length;
			return `<button type="button" class="chain-tab${k === tab ? ' selected' : ''}" data-action="chain-tab" data-id="${branch.id}" data-key="${esc(k)}">`
				+ `<span class="chain-tab__title">${esc(groupTitle(branch, k, g))}</span>`
				+ `<span class="chain-tab__sub">${n} ${plural(n, 'задание', 'задания', 'заданий')}${d ? ` • ${d} завершено` : ''}</span></button>`;
		}).join('')}</div>`;
	} else {
		chips = [...groups.values()].flat();
	}
	let sel = chips.find(q => q.id === state.chainQuest[branch.id]);
	if (!sel) sel = chips.find(q => !isClosedStatus(q.status)) ?? chips[0];
	state.chainQuest[branch.id] = sel?.id;
	// В ветке одно задание и нет вариантов — выбирать не из чего, чипов нет.
	if (!showTabs && chips.length === 1) return html + questCardHTML(sel);
	html += `<div class="chain__chips">${chips.map(q =>
		`<button type="button" class="btn${q === sel ? ' selected' : ''}${isClosedStatus(q.status) ? ' is-closed' : ''}" data-action="chain-quest" data-id="${branch.id}" data-key="${q.id}"><span class="btn__label">${esc(q.anchor_kind === 'unplaced' || !q.anchor_kind ? q.runame : questPlace(q))}</span></button>`
	).join('')}</div>`;
	if (sel) html += questCardHTML(sel);
	return html;
}
function chainHTML(branch, members) {
	const open = state.openChainId === branch.id;
	const { done, total } = branchProgress(members);
	const desc = firstParagraph(branch.description);
	return `<div class="chain${open ? ' is-open' : ''}" data-chain="${branch.id}">`
		+ `<div class="chain__head glow" data-action="chain" data-id="${branch.id}">`
		+ `<div class="chain__row"><p class="chain__title">${esc(branch.runame)}</p><span class="progress"><b>${done}</b>/${total}</span></div>`
		+ (desc ? `<p class="chain__desc">${esc(desc)}</p>` : '')
		+ `</div>`
		+ `<div class="chain__body"><div class="chain__body-inner">${chainBodyHTML(branch, members)}</div></div>`
		+ `</div>`;
}
// Раскрыть/свернуть ветку на месте — без перерисовки, с переходами.
function setOpenChain(id) {
	state.openChainId = id;
	document.querySelectorAll('.chain').forEach(c => c.classList.toggle('is-open', c.dataset.chain === id));
}
// Раскрыть/свернуть ветку, прокручивая журнал в такт — одним движением:
// — раскрытая ветка, не помещающаяся в видимую часть, докручивается в вид:
//   целиком, а если она выше видимой части — от начала;
// — при сворачивании, если журнал укорачивается снизу, прокрутка уменьшается
//   вместе с ним — сами, а не «упором» браузера (тот поджимает её целыми
//   пикселями и спорит с «якорем» прокрутки — отсюда рывки).
// Цель — по итоговой раскладке (у раскрытой ветки рамка тоньше, текст
// переносится иначе — прикидкой не посчитать): её меряем на невидимой копии
// списка (measureJournal), живые переходы не трогаем — прерванная анимация
// продолжается с того же места. Доля прокрутки равна доле раскрытия/
// сворачивания тела ведущей ветки — тайминг тот же, что у CSS-перехода.
let chainScrollRun = 0; // новый клик останавливает прокрутку от прежнего
function switchChain(nextId) {
	const run = ++chainScrollRun;
	const prevId = state.openChainId;
	const scroller = sectionEls.journal.querySelector('.sb-section__inner');
	const chainEl = cid => cid ? scroller.querySelector(`.chain[data-chain="${CSS.escape(cid)}"]`) : null;
	const chain = chainEl(nextId);
	const leadId = chain ? nextId : prevId; // тело этой ветки задаёт такт прокрутки
	const lead = chainEl(leadId);
	if (!lead) { setOpenChain(nextId); return; }
	const body = lead.querySelector('.chain__body');
	const bodyFrom = body.getBoundingClientRect().height;
	const s0 = scroller.scrollTop;
	const view = scroller.clientHeight;
	const final = measureJournal(scroller, nextId, leadId);
	const bodyTo = final.leadBody;
	let s1 = s0;
	if (chain) {
		const { top, height } = final;
		if (top < s0 || (top + height > s0 + view && height > view)) s1 = top;
		else if (top + height > s0 + view) s1 = top + height - view;
	}
	s1 = Math.max(0, Math.min(s1, final.contentHeight - view));

	scroller.style.overflowAnchor = 'none'; // вид держим сами, без «якоря» браузера
	setOpenChain(nextId);
	const ms = animDuration() * 1000;
	const done = () => { if (run !== chainScrollRun) return; scroller.scrollTop = s1; scroller.style.overflowAnchor = ''; };
	if (!ms) { done(); return; }
	if (Math.abs(bodyTo - bodyFrom) < 1) { scroller.style.overflowAnchor = ''; scroller.scrollTo({ top: s1, behavior: 'smooth' }); return; } // уже раскрыта
	const t0 = performance.now();
	const fallback = setTimeout(done, ms + 150); // если кадры не идут (вкладка скрыта)
	const step = () => {
		if (run !== chainScrollRun) return;
		const k = Math.min(1, Math.max(0, (body.getBoundingClientRect().height - bodyFrom) / (bodyTo - bodyFrom)));
		scroller.scrollTop = s0 + (s1 - s0) * k;
		if (k < 1 && performance.now() - t0 < ms + 100) requestAnimationFrame(step);
		else { clearTimeout(fallback); done(); }
	};
	requestAnimationFrame(step);
}
// Итоговая раскладка журнала: невидимая копия списка рядом с настоящим, той
// же ширины, с раскрытой веткой nextId. Возвращает положение и высоту этой
// ветки, высоту тела ведущей ветки и полную высоту содержимого.
function measureJournal(scroller, nextId, leadId) {
	const probe = scroller.cloneNode(true);
	probe.querySelectorAll('.chain').forEach(c => c.classList.toggle('is-open', c.dataset.chain === nextId));
	probe.style.cssText = `position:absolute; top:0; left:0; box-sizing:border-box; width:${scroller.offsetWidth}px; height:auto; visibility:hidden; pointer-events:none;`;
	scroller.after(probe);
	const origin = probe.getBoundingClientRect().top;
	const chainRect = nextId ? probe.querySelector(`.chain[data-chain="${CSS.escape(nextId)}"]`)?.getBoundingClientRect() : null;
	const result = {
		top: chainRect ? chainRect.top - origin : 0,
		height: chainRect?.height ?? 0,
		leadBody: probe.querySelector(`.chain[data-chain="${CSS.escape(leadId)}"] .chain__body`)?.getBoundingClientRect().height ?? 0,
		contentHeight: probe.scrollHeight,
	};
	probe.remove();
	return result;
}
// Вкладка или чип внутри ветки — обновляется только её тело. Ряды кнопок с
// тем же набором (вкладки; чипы той же группы) — на месте, чтобы была видна
// анимация выбора; остальное (другие чипы, карточка задания) заменяется.
function refreshChainBody(id) {
	const el = document.querySelector(`.chain[data-chain="${CSS.escape(id)}"] .chain__body-inner`);
	const branch = branchById.get(id);
	if (!el || !branch) return;
	const next = document.createElement('div');
	next.innerHTML = chainBodyHTML(branch, chainMembers(id));
	const keys = row => [...row.children].map(b => b.dataset.key).join('\n');
	const oldParts = [...el.children], newParts = [...next.children];
	if (oldParts.length !== newParts.length || oldParts.some((p, i) => p.className !== newParts[i].className)) {
		el.replaceChildren(...newParts);
		return;
	}
	oldParts.forEach((part, i) => {
		const fresh = newParts[i];
		const isRow = part.matches('.chain__tabs, .chain__chips');
		if (isRow && keys(part) === keys(fresh)) [...part.children].forEach((b, j) => {
			const f = fresh.children[j];
			b.className = f.className;
			if (b.innerHTML !== f.innerHTML) b.innerHTML = f.innerHTML; // подписи могли смениться
		});
		else part.replaceWith(fresh);
	});
}
function renderJournal() {
	const visible = quests.filter(questInJournal);
	const entries = [];
	const seenBranch = new Set();
	for (const q of visible) {
		if (q.branch_id && branchById.has(q.branch_id)) {
			if (seenBranch.has(q.branch_id)) continue;
			seenBranch.add(q.branch_id);
			const b = branchById.get(q.branch_id);
			const members = chainMembers(b.id);
			entries.push({ name: b.runame, chain: true, html: () => chainHTML(b, members) });
		} else {
			entries.push({ name: q.runame, chain: false, html: () => questCardHTML(q) });
		}
	}
	// Базовое правило (прототип и сайт): сначала задания без ветки, потом
	// ветки; внутри — по алфавиту.
	entries.sort((a, b) => (a.chain - b.chain) || a.name.localeCompare(b.name, 'ru'));

	const counts = { rumor: 0, known: 0, done: 0 };
	quests.filter(questPasses).forEach(q => { const g = statusGroup(q.status); if (g in counts) counts[g]++; });
	const statuses = (state.isAdmin ? ['rumor'] : []).concat(['known', 'done']);
	const listHTML = entries.length ? entries.map(e => e.html()).join('') : '<p class="empty">Ничего не найдено</p>';
	// Кнопки статусов — на месте, если их набор тот же (иначе не видна анимация
	// выбора); список перерисовывается.
	const row = sectionEls.journal.querySelector('.journal > .btn-row');
	const btns = row ? [...row.querySelectorAll('[data-action="status"]')] : [];
	if (btns.length && btns.map(b => b.dataset.key).join() === statuses.join()) {
		btns.forEach(b => {
			b.classList.toggle('selected', state.status[b.dataset.key]);
			b.querySelector('.btn__count').textContent = counts[b.dataset.key];
		});
		sectionEls.journal.querySelector('.journal__list').innerHTML = listHTML;
	} else {
		setContent('journal', `<div class="journal">`
			+ `<div class="btn-row">${statuses.map(s => statusButtonHTML(s, counts[s])).join('')}${state.isAdmin ? addButtonHTML('Новое задание', 'new-quest') : ''}</div>`
			+ `<div class="journal__list">${listHTML}</div>`
			+ `</div>`);
	}
	setCount('journal', String(visible.length));
}

function renderProvinces() {
	const byProvince = new Map();
	markers.filter(locationPasses).sort(byName).forEach(r => pushTo(byProvince, r.province || 'Без провинции', r));
	const names = [...byProvince.keys()].sort((a, b) => a.localeCompare(b, 'ru'));
	const filtering = searchActive();
	setContent('provinces', names.length ? `<div class="provinces">${names.map(name => {
		const open = filtering || state.openProvinces.has(name);
		const rows = byProvince.get(name).map(r => {
			const qs = (questsByLocation.get(r.id) || []).filter(questVisibleBase);
			const top = qs.find(q => q.status === 'known') ?? qs.find(q => q.status === 'rumor') ?? qs[0];
			const st = top ? (isClosedStatus(top.status) ? 'done' : (top.status === 'rumor' ? 'rumor' : 'known')) : null;
			return `<div class="location-row" data-action="open-location" data-id="${r.id}">`
				+ `<span class="location-row__main"><img class="location-row__icon" src="${markerIconUrl(r.location_type)}" alt=""><span class="location-row__name">${esc(r.runame)}</span></span>`
				+ (st ? `<span class="status-icon status-icon--${st}"><img src="images/ui/status/${st}.svg" alt=""></span>` : '')
				+ `</div>`;
		}).join('');
		return `<div class="province${open ? ' is-open' : ''}" data-province="${esc(name)}">`
			+ `<div class="province-header${open ? ' is-open' : ''}" data-action="province" data-key="${esc(name)}"><span class="chevron"></span><span>${esc(name)}</span></div>`
			+ `<div class="province__rows"><div class="province__rows-inner"><div class="province__list">${rows}</div></div></div>`
			+ `</div>`;
	}).join('')}</div>` : '<p class="empty">Ничего не найдено</p>');
	setCount('provinces', String(names.length));
}

const factionRep = f => f.reputation === 'positive' ? 'positive' : f.reputation === 'negative' ? 'negative' : 'neutral';
// Базовое правило (прототип и сайт): по качеству репутации — дружественные,
// враждебные, нейтральные; внутри — по алфавиту.
const REP_ORDER = { positive: 0, negative: 1, neutral: 2 };

function factionHTML(f) {
	const open = state.openFactionId === f.id;
	const rep = factionRep(f);
	const score = Math.max(0, Math.min(10, Number(f.score) || 0));
	return `<div class="faction faction--${rep}${open ? ' is-open' : ''}" data-faction="${f.id}">`
		+ `<div class="faction__head glow" data-action="faction" data-id="${f.id}">`
		+ `<div class="faction__top">`
		+ (f.image ? `<img class="faction__emblem" src="${esc(f.image)}" alt="">` : '')
		+ `<div class="faction__titles"><div class="faction__name-row">`
		+ `<p class="faction__name">${esc(f.runame)}${state.isAdmin ? `<img class="faction__edit" src="images/ui/edit.svg" alt="" title="Редактировать" data-action="edit-faction" data-id="${f.id}">` : ''}</p>`
		+ `<span class="faction__score"><b>${score}</b>/10</span></div>`
		+ `<p class="faction__title">${esc(f.title || '—')}</p></div></div>`
		+ `<div class="faction__bars">${Array.from({ length: 10 }, (_, i) => `<span class="faction__bar${i < score ? ' is-on' : ''}"></span>`).join('')}</div>`
		+ `</div>`
		+ `<div class="faction__body"><div class="faction__body-inner"><div class="faction__content">`
		+ (f.description ? `<div class="faction__desc">${renderDescription(f.description)}</div>` : '')
		+ (f.effect ? `<div class="faction__effect">${esc(f.effect)}</div>` : '')
		+ `</div></div></div>`
		+ `</div>`;
}
function renderFactions() {
	const list = factions.filter(factionPasses).sort((a, b) => REP_ORDER[factionRep(a)] - REP_ORDER[factionRep(b)] || byName(a, b));
	const add = state.isAdmin ? `<div class="btn-row">${addButtonHTML('Новая фракция', 'new-faction')}</div>` : '';
	setContent('factions', `<div class="factions">${add}${list.length ? list.map(factionHTML).join('') : '<p class="empty">Ничего не найдено</p>'}</div>`);
	setCount('factions', String(list.length));
}

// Режим сочетания выбранного (как в прежнем дизайне; в макете его нет).
const SEARCH_MODES = [{ key: 'or', label: 'или' }, { key: 'and', label: 'и' }, { key: 'exclude', label: 'искл.' }];
function renderSearchFilters() {
	const modes = group => `<div class="mode" role="group" aria-label="Как сочетать выбранное">${SEARCH_MODES.map(m =>
		`<button type="button" class="mode__btn${state.search.modes[group] === m.key ? ' selected' : ''}" data-action="f-mode" data-group="${group}" data-key="${m.key}"><span>${m.label}</span></button>`
	).join('')}</div>`;
	// «сбросить» — у каждой группы своя, видна, пока в группе что-то выбрано.
	const group = (label, items, action, setKey, modeGroup) => {
		const set = state.search[setKey];
		return `<div class="search-group${set.size ? ' has-selection' : ''}" data-group="${setKey}">`
			+ `<div class="search-group__head"><div class="search-group__title"><p class="search-group__label">${label}</p>`
			+ `<button type="button" class="search-group__reset" data-action="f-reset" data-key="${setKey}"><span>сбросить</span></button></div>`
			+ `${modeGroup ? modes(modeGroup) : ''}</div>`
			+ `<div class="btn-row">${items.map(it => iconButtonHTML({ ...it, selected: set.has(it.key), action })).join('')}</div></div>`;
	};
	document.getElementById('search-filters').innerHTML =
		group('Тип локации', LOCATION_TYPES.filter(t => t.key !== 'quest').map(t => ({ key: t.key, label: t.label, large: t.large, icon: `images/icons/${t.key}.png` })), 'f-type', 'types')
		+ group('Особенности', TRAITS.map(t => ({ ...t, icon: `images/icons/${t.key}.png` })), 'f-trait', 'traits', 'traits')
		+ group('Персонажи', CHARACTERS.map(c => ({ ...c, icon: `images/icons/${c.key}.png` })), 'f-char', 'chars', 'chars');
}
function syncSearchFilters() {
	const sets = { 'f-type': state.search.types, 'f-trait': state.search.traits, 'f-char': state.search.chars };
	const root = document.getElementById('search-filters');
	root.querySelectorAll('[data-action^="f-"]:not([data-action="f-reset"])').forEach(b => b.classList.toggle('selected', b.dataset.action === 'f-mode'
		? state.search.modes[b.dataset.group] === b.dataset.key
		: sets[b.dataset.action].has(b.dataset.key)));
	root.querySelectorAll('.search-group').forEach(g => g.classList.toggle('has-selection', state.search[g.dataset.group].size > 0));
}

// Поиск нашёл задания в ветке — при раскрытии ветки открыто одно из найденных:
// первое незавершённое по порядку шагов, иначе первое. Выбор пользователя
// среди найденных не трогаем.
function focusFoundQuests() {
	if (!searchActive()) return;
	for (const id of questsByBranch.keys()) {
		const found = [...chainGroups(chainMembers(id)).values()].flat().filter(questPasses);
		if (!found.length || found.some(q => q.id === state.chainQuest[id])) continue;
		const pick = found.find(q => !isClosedStatus(q.status)) ?? found[0];
		state.chainQuest[id] = pick.id;
		state.chainTab[id] = branchGroupKey(pick);
	}
}

function renderAll() {
	renderLocations();
	renderLayers();
	renderJournal();
	renderProvinces();
	renderFactions();
	renderSearchFilters();
	updateMarkers();
	updateLayers();
}
// Перерисовка того, что зависит от поиска (без самих фильтров — чтобы
// не сбивать их анимацию).
function renderFiltered() {
	focusFoundQuests();
	renderJournal();
	renderProvinces();
	renderFactions();
	updateMarkers();
	document.getElementById('search').classList.toggle('has-query', searchActive());
}

// ─── Разделы: аккордеон ───────────────────────────────────────────────────
// Раскрытие и сворачивание анимируются высотой самих разделов в пикселях —
// от текущей к итоговой (её меряем, применив итоговое состояние). Так один
// раздел сворачивается ровно настолько, насколько раскрывается другой, даже
// если содержимое в разы выше сайдбара, и содержимое не сдвигается: раздел
// обрезает его снизу, а у сворачиваемого тело остаётся раскрытым до конца
// (.is-closing). Классы и явная высота снимаются по окончании перехода.
const sectionsEl = document.getElementById('sections');
const animDuration = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration')) || 0;
function openSection(key) {
	const els = Object.values(sectionEls);
	const from = els.map(el => el.getBoundingClientRect().height);
	els.forEach(el => { el.classList.remove('is-animating', 'is-closing'); el.style.height = ''; });
	state.openSection = state.openSection === key ? null : key;
	for (const [k, el] of Object.entries(sectionEls)) {
		const open = k === state.openSection;
		el.classList.toggle('is-open', open);
		el.querySelector('.section-label').classList.toggle('is-open', open);
	}
	if (!animDuration()) return;
	const to = els.map(el => el.getBoundingClientRect().height);
	const moving = els.map((el, i) => ({ el, from: from[i], to: to[i] })).filter(m => Math.abs(m.from - m.to) > .5);
	moving.forEach(({ el, from }) => {
		el.classList.add('is-animating');
		el.classList.toggle('is-closing', !el.classList.contains('is-open'));
		el.style.height = `${from}px`;
	});
	sectionsEl.offsetHeight; // стартовые высоты — до перехода
	moving.forEach(({ el, to }) => { el.style.height = `${to}px`; });
}
sectionsEl.addEventListener('transitionend', e => {
	const el = e.target;
	if (e.propertyName !== 'height' || !el.classList.contains('sb-section')) return;
	el.classList.remove('is-animating', 'is-closing');
	el.style.height = '';
});
function revealSection(key) {
	if (state.openSection !== key) openSection(key);
}

// ─── Поля форм и окна (админка) ──────────────────────────────────────────
// Поведение — делегированием по классам и data-атрибутам: работает для любой
// разметки с этими классами, в том числе построенной позже. Стили — блок
// «АДМИНКА — ФОРМЫ» в style.css.
//   .select            — выпадающий список (родной <select> внутри хранит значение)
//   input[data-combo]  — поле с подсказками; список — forms.lists[имя]()
//   .editor            — описание с панелью форматирования (markdown, как на
//                           сайте); «ссылка» берёт варианты из forms.links(),
//                           крайняя справа кнопка — то же поле в большом окне
//   .score             — очки славы делениями (значение — в скрытом input)
//   [data-confirm]     — действие в два клика (удалить): первый клик только
//                           просит подтверждения, второй проходит дальше
//   forms.dialog(…)     — окно поверх страницы (большое описание, окна сайта)
// Страница может заменить forms.match(текст, запрос) — сравнение для подсказок.
const forms = (() => {
	// Иконки панели форматирования и кнопок форм — с прежнего сайта (index.html).
	const ICONS = {
		p:      ['0 0 8 9',   'M2.85714 9V5.625C2.06667 5.625 1.39286 5.35078 0.835714 4.80234C0.278571 4.25391 0 3.59062 0 2.8125C0 2.03437 0.278571 1.37109 0.835714 0.822656C1.39286 0.274219 2.06667 0 2.85714 0H8V1.125H6.85714V9H5.71429V1.125H4V9H2.85714Z'],
		quote:  ['0 0 9 7',   'M3.74362 0V2.87428C3.74362 5.0925 2.3445 6.59594 0.375 7L0.001875 6.1635C0.913875 5.80689 1.5 4.74872 1.5 3.88889H0V0H3.74362ZM9 0V2.87428C9 5.0925 7.5945 6.59633 5.625 7L5.2515 6.1635C6.16388 5.80689 6.75 4.74872 6.75 3.88889H5.25638V0H9Z'],
		link:   ['0 0 10 5',  'M4.5 5H2.5C1.80833 5 1.21875 4.75625 0.73125 4.26875C0.24375 3.78125 0 3.19167 0 2.5C0 1.80833 0.24375 1.21875 0.73125 0.73125C1.21875 0.24375 1.80833 0 2.5 0H4.5V1H2.5C2.08333 1 1.72917 1.14583 1.4375 1.4375C1.14583 1.72917 1 2.08333 1 2.5C1 2.91667 1.14583 3.27083 1.4375 3.5625C1.72917 3.85417 2.08333 4 2.5 4H4.5V5ZM3 3V2H7V3H3ZM5.5 5V4H7.5C7.91667 4 8.27083 3.85417 8.5625 3.5625C8.85417 3.27083 9 2.91667 9 2.5C9 2.08333 8.85417 1.72917 8.5625 1.4375C8.27083 1.14583 7.91667 1 7.5 1H5.5V0H7.5C8.19167 0 8.78125 0.24375 9.26875 0.73125C9.75625 1.21875 10 1.80833 10 2.5C10 3.19167 9.75625 3.78125 9.26875 4.26875C8.78125 4.75625 8.19167 5 7.5 5H5.5Z'],
		b:      ['0 0 7 8',   'M0 8V0H3.71875C4.44792 0 5.12099 0.190476 5.73798 0.571429C6.35497 0.952381 6.66346 1.48095 6.66346 2.15714C6.66346 2.64286 6.53445 3.01667 6.27644 3.27857C6.01843 3.54048 5.77724 3.72857 5.55288 3.84286C5.83333 3.94762 6.14463 4.14286 6.48678 4.42857C6.82893 4.71429 7 5.14286 7 5.71429C7 6.5619 6.63542 7.15476 5.90625 7.49286C5.17708 7.83095 4.49279 8 3.85337 8H0ZM2.03606 6.4H3.78606C4.32452 6.4 4.65264 6.28333 4.77043 6.05C4.88822 5.81667 4.94711 5.64762 4.94711 5.54286C4.94711 5.4381 4.88822 5.26905 4.77043 5.03571C4.65264 4.80238 4.30769 4.68571 3.73558 4.68571H2.03606V6.4ZM2.03606 3.14286H3.60096C3.97115 3.14286 4.24038 3.0619 4.40865 2.9C4.57692 2.7381 4.66106 2.55714 4.66106 2.35714C4.66106 2.12857 4.5657 1.94286 4.375 1.8C4.18429 1.65714 3.9375 1.58571 3.63462 1.58571H2.03606V3.14286Z'],
		i:      ['0 0 7 8',   'M0 8V6.57143H2.15385L3.76923 1.42857H1.61538V0H7V1.42857H5.11538L3.5 6.57143H5.38462V8H0Z'],
		clear:  ['0 0 11 11', 'M6.55556 4.19444L5.26389 2.90278L3.58333 1.22222H10.3333V2.88889H7.11111L6.55556 4.19444ZM10.2222 11L5.61111 6.38889L4.5 9H2.68056L4.33333 5.11111L0 0.777778L0.777778 0L11 10.2222L10.2222 11Z'],
		left:   ['0 0 10 10', 'M0 10V8.88889H10V10H0ZM0 7.77778V6.66667H6.66667V7.77778H0ZM0 5.55556V4.44444H10V5.55556H0ZM0 3.33333V2.22222H6.66667V3.33333H0ZM0 1.11111V0H10V1.11111H0Z'],
		center: ['0 0 10 10', 'M0 10V8.88889H10V10H0ZM2.22222 7.77778V6.66667H7.77778V7.77778H2.22222ZM0 5.55556V4.44444H10V5.55556H0ZM2.22222 3.33333V2.22222H7.77778V3.33333H2.22222ZM0 1.11111V0H10V1.11111H0Z'],
		right:  ['0 0 10 10', 'M0 1.11111V0H10V1.11111H0ZM3.33333 3.33333V2.22222H10V3.33333H3.33333ZM0 5.55556V4.44444H10V5.55556H0ZM3.33333 7.77778V6.66667H10V7.77778H3.33333ZM0 10V8.88889H10V10H0Z'],
		trash:  ['0 0 8 10',  'M3.11111 0L2.66667 0.5H0V1.5H8V0.5H5.33333L4.88889 0H3.11111ZM0.606771 2.5L1.28559 9.13184C1.34426 9.62684 1.72311 10 2.16667 10H5.83247C6.27602 10 6.6553 9.62743 6.71441 9.12793L7.39323 2.5H0.606771Z'],
		plus:   ['0 0 8 8',   'M4.44434 3.55566H8V4.44434H4.44434V8H3.55566V4.44434H0V3.55566H3.55566V0H4.44434V3.55566Z'],
		x:      ['0 0 8 8',   'M0.7 0L4 3.3L7.3 0L8 0.7L4.7 4L8 7.3L7.3 8L4 4.7L0.7 8L0 7.3L3.3 4L0 0.7L0.7 0Z'],
		upload: ['0 0 8 9',   'M4 0L7.5 3.5L6.8 4.2L4.5 1.9V6.5H3.5V1.9L1.2 4.2L0.5 3.5L4 0ZM0 8H8V9H0V8Z'],
		expand: ['0 0 10 10', 'M0 0H4V1H1.7L4 3.3L3.3 4L1 1.7V4H0V0ZM10 10H6V9H8.3L6 6.7L6.7 6L9 8.3V6H10V10Z'],
	};
	const icon = (name, cls = '') => {
		const [box, d] = ICONS[name];
		const [, , w, h] = box.split(' ');
		return `<svg class="${cls}" width="${w}" height="${h}" viewBox="${box}" aria-hidden="true"><path d="${d}"/></svg>`;
	};

	// ─── Разметка ───
	function selectHTML({ id, name, options, value }) {
		const cur = options.find(o => o.value === value) ?? options[0];
		return `<div class="select"><select class="select__native" tabindex="-1"${name ? ` name="${name}"` : ''}>`
			+ options.map(o => `<option value="${esc(o.value)}"${o === cur ? ' selected' : ''}>${esc(o.label)}</option>`).join('')
			+ `</select><button type="button" class="input select__trigger"${id ? ` id="${id}"` : ''}>`
			+ `<span class="select__label">${esc(cur?.label)}</span><span class="select__chevron"></span></button></div>`;
	}
	const TOOLBAR = [['p', 'Абзац'], ['quote', 'Цитата'], ['link', 'Ссылка на локацию, провинцию или фракцию'], '|',
		['b', 'Жирный (Ctrl+B)'], ['i', 'Курсив (Ctrl+I)'], ['clear', 'Убрать разметку'], '|',
		['left', 'По левому краю'], ['center', 'По центру'], ['right', 'По правому краю']];
	// expand — кнопка «в большое окно» (у поля в самом окне её нет).
	function editorHTML({ id, name, value = '', placeholder = '', expand = true }) {
		return `<div class="editor"><div class="editor__toolbar">`
			+ TOOLBAR.map(t => t === '|' ? '<span class="editor__sep"></span>'
				: `<button type="button" class="editor__btn" data-format="${t[0]}" title="${t[1]}">${icon(t[0])}</button>`).join('')
			+ (expand ? `<button type="button" class="editor__btn editor__btn--expand" data-expand title="Открыть в большом окне">${icon('expand')}</button>` : '')
			+ `</div><textarea class="editor__area"${id ? ` id="${id}"` : ''}${name ? ` name="${name}"` : ''} placeholder="${esc(placeholder)}">${esc(value)}</textarea></div>`;
	}
	function scoreHTML({ name, value = 0, rep = 'neutral' }) {
		return `<div class="score" data-rep="${rep}"><input type="hidden" name="${name}" value="${value}">`
			+ `<div class="score__bars">${Array.from({ length: 10 }, (_, i) => `<button type="button" class="score__bar${i < value ? ' is-on' : ''}" data-score="${i + 1}" aria-label="${i + 1}"></button>`).join('')}</div>`
			+ `<span class="score__value"><b>${value}</b>/10</span></div>`;
	}

	// ─── Панель вариантов (одна на страницу) ───
	let panel = null; // { el, list, anchor, items, onPick, onClose }
	function close() {
		if (!panel) return;
		const p = panel;
		panel = null;
		p.el.remove();
		p.anchor.classList.remove('is-open');
		p.onClose?.();
	}
	function position() {
		if (!panel) return;
		const r = panel.anchor.getBoundingClientRect(), s = panel.el.style;
		if (panel.detached) {
			const w = 280;
			s.width = `${w}px`;
			s.left = `${Math.max(8, Math.min(r.right - w, innerWidth - w - 8))}px`;
			s.top = `${r.bottom + 4}px`;
		} else {
			s.width = `${r.width}px`;
			s.left = `${r.left}px`;
			s.top = `${r.bottom}px`;
		}
	}
	function render(items) {
		let group = null;
		panel.items = items;
		panel.list.innerHTML = items.length ? items.map(it => {
			const head = it.group && it.group !== group ? `<div class="options__group">${esc(group = it.group)}</div>` : '';
			return head + `<div class="option${it.current ? ' is-current is-active' : ''}">${esc(it.label)}${it.sub ? `<span class="option__sub">${esc(it.sub)}</span>` : ''}</div>`;
		}).join('') : `<div class="options__empty">Ничего не найдено</div>`;
		panel.list.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
	}
	function open(anchor, { items, onPick, onClose, detached = false, search = '' }) {
		close();
		const el = document.createElement('div');
		el.className = `options${detached ? ' options--detached' : ''}`;
		el.innerHTML = (search ? `<input type="text" class="input options__search" placeholder="${esc(search)}" autocomplete="off">` : '')
			+ '<div class="options__list"></div>';
		document.body.appendChild(el);
		panel = { el, list: el.querySelector('.options__list'), anchor, onPick, onClose, detached };
		anchor.classList.add('is-open');
		render(items);
		position();
		// mousedown, а не click: выбор раньше, чем поле потеряет фокус
		el.addEventListener('mousedown', e => {
			if (e.target.closest('.options__search')) return;
			e.preventDefault();
			const opt = e.target.closest('.option');
			if (opt) pick([...panel.list.querySelectorAll('.option')].indexOf(opt));
		});
		return panel;
	}
	function pick(index) {
		const p = panel, it = p?.items[index];
		if (!it) return;
		close();
		p.onPick(it);
	}
	function move(dir) {
		const opts = [...panel.list.querySelectorAll('.option')];
		if (!opts.length) return;
		let i = opts.findIndex(o => o.classList.contains('is-active'));
		i = i < 0 ? (dir > 0 ? 0 : opts.length - 1) : (i + dir + opts.length) % opts.length;
		opts.forEach((o, j) => o.classList.toggle('is-active', j === i));
		opts[i].scrollIntoView({ block: 'nearest' });
	}
	const activeIndex = () => [...panel.list.querySelectorAll('.option')].findIndex(o => o.classList.contains('is-active'));
	// Стрелки, Enter, Escape — для поля, у которого открыта панель.
	function keys(e, reopen) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (!panel) reopen?.(); else move(e.key === 'ArrowDown' ? 1 : -1);
		} else if (e.key === 'Enter' && panel) {
			const i = activeIndex();
			if (i >= 0) { e.preventDefault(); pick(i); }
		} else if (e.key === 'Escape' && panel) {
			e.preventDefault();
			close();
		}
	}

	document.addEventListener('mousedown', e => {
		if (panel && !panel.el.contains(e.target) && !panel.anchor.contains(e.target)) close();
	});
	// Прокрутка формы — панель едет за полем; своя прокрутка списка её не двигает.
	window.addEventListener('scroll', e => { if (panel && !panel.el.contains(e.target)) position(); }, true);
	window.addEventListener('resize', position);

	// ─── Выпадающий список ───
	function syncSelect(wrap) {
		const native = wrap.querySelector('.select__native');
		wrap.querySelector('.select__label').textContent = native.selectedOptions[0]?.textContent ?? '';
	}
	function toggleSelect(trigger) {
		if (panel?.anchor === trigger) return close();
		const wrap = trigger.closest('.select'), native = wrap.querySelector('.select__native');
		open(trigger, {
			items: [...native.options].map(o => ({ value: o.value, label: o.textContent, current: o.selected })),
			onPick: it => {
				native.value = it.value;
				syncSelect(wrap);
				native.dispatchEvent(new Event('change', { bubbles: true }));
			},
		});
	}
	document.addEventListener('click', e => {
		const trigger = e.target.closest('.select__trigger');
		if (trigger) toggleSelect(trigger);
	});
	document.addEventListener('keydown', e => {
		const trigger = e.target.closest?.('.select__trigger');
		if (!trigger) return;
		if ((e.key === 'Enter' || e.key === ' ') && panel?.anchor !== trigger) { e.preventDefault(); toggleSelect(trigger); return; }
		keys(e, () => toggleSelect(trigger));
	});

	// ─── Поле с подсказками ───
	function openCombo(input) {
		const source = api.lists[input.dataset.combo];
		if (!source) return;
		const q = input.value.trim();
		const items = source().filter(v => !q || api.match(v, q)).slice(0, 200)
			.map(v => ({ value: v, label: v, current: v === input.value }));
		if (panel?.anchor === input) { render(items); return; }
		open(input, {
			items,
			onPick: it => {
				input.value = it.value;
				input.dispatchEvent(new Event('input', { bubbles: true }));
				input.dispatchEvent(new Event('change', { bubbles: true }));
			},
		});
	}
	document.addEventListener('focusin', e => { if (e.target.matches?.('input[data-combo]')) openCombo(e.target); });
	document.addEventListener('input', e => {
		// своё событие после выбора варианта (isTrusted = false) панель не открывает заново
		if (e.isTrusted && e.target.matches?.('input[data-combo]')) openCombo(e.target);
	});
	document.addEventListener('keydown', e => {
		if (e.target.matches?.('input[data-combo]')) keys(e, () => openCombo(e.target));
	});
	document.addEventListener('focusout', e => {
		if (panel && panel.anchor === e.target && !panel.el.contains(e.relatedTarget)) close();
	});

	// ─── Описание: панель форматирования (синтаксис — как renderDescription) ───
	function wrapSelection(area, open, close) {
		const { selectionStart: a, selectionEnd: b, value } = area;
		const sel = value.slice(a, b);
		area.value = value.slice(0, a) + open + sel + close + value.slice(b);
		area.focus();
		area.setSelectionRange(a + open.length, a + open.length + sel.length);
	}
	const stripFormatting = s => s.replace(/<[^>]+>/g, '').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/_([^_]*)_/g, '$1').replace(/^\s*>\s?/gm, '');
	const FORMATS = {
		p(area) {
			const { selectionStart: a, selectionEnd: b, value } = area;
			area.value = value.slice(0, a) + '\n\n' + value.slice(b);
			area.focus();
			area.setSelectionRange(a + 2, a + 2);
		},
		quote(area) {
			const { selectionStart: a, selectionEnd: b, value } = area;
			const sel = value.slice(a, b);
			const quoted = sel ? sel.split('\n').map(l => l ? `> ${l}` : '>').join('\n') : '> ';
			area.value = value.slice(0, a) + quoted + value.slice(b);
			area.focus();
			area.setSelectionRange(sel ? a : a + quoted.length, a + quoted.length);
		},
		b: area => wrapSelection(area, '**', '**'),
		i: area => wrapSelection(area, '_', '_'),
		clear(area) {
			const { selectionStart: a, selectionEnd: b, value } = area;
			if (a === b) { area.value = stripFormatting(value); area.focus(); return; }
			const stripped = stripFormatting(value.slice(a, b));
			area.value = value.slice(0, a) + stripped + value.slice(b);
			area.focus();
			area.setSelectionRange(a, a + stripped.length);
		},
		left:   area => wrapSelection(area, '<div style="text-align:left">', '</div>'),
		center: area => wrapSelection(area, '<div style="text-align:center">', '</div>'),
		right:  area => wrapSelection(area, '<div style="text-align:right">', '</div>'),
	};
	function openLinkPicker(btn, area) {
		if (panel?.anchor === btn) return close();
		const pos = area.selectionStart ?? area.value.length;
		const build = q => (api.links?.() ?? []).flatMap(g =>
			g.items.filter(it => !q || api.match(it.label, q)).slice(0, 30)
				.map(it => ({ group: g.group, label: it.label, sub: it.sub, token: `[${it.label}](${g.type}:${it.id})` })));
		const p = open(btn, {
			detached: true,
			search: 'Локация, провинция или фракция',
			items: build(''),
			onPick: it => {
				area.value = area.value.slice(0, pos) + it.token + area.value.slice(pos);
				area.focus();
				area.setSelectionRange(pos + it.token.length, pos + it.token.length);
				area.dispatchEvent(new Event('input', { bubbles: true }));
			},
		});
		const search = p.el.querySelector('.options__search');
		search.addEventListener('input', () => render(build(search.value.trim())));
		search.addEventListener('keydown', e => keys(e));
		search.focus();
	}
	document.addEventListener('click', e => {
		const btn = e.target.closest('.editor__btn');
		if (!btn) return;
		const area = btn.closest('.editor').querySelector('.editor__area');
		if (btn.hasAttribute('data-expand')) { openExpanded(area); return; }
		if (btn.dataset.format === 'link') { openLinkPicker(btn, area); return; }
		FORMATS[btn.dataset.format]?.(area);
		area.dispatchEvent(new Event('input', { bubbles: true }));
	});
	document.addEventListener('keydown', e => {
		if (!e.target.matches?.('.editor__area') || !(e.ctrlKey || e.metaKey)) return;
		const k = e.key.toLowerCase();
		const format = k === 'b' || k === 'и' ? 'b' : k === 'i' || k === 'ш' ? 'i' : null;
		if (!format) return;
		e.preventDefault();
		FORMATS[format](e.target);
		e.target.dispatchEvent(new Event('input', { bubbles: true }));
	});

	// ─── Окно поверх страницы ───
	// Затемнение + коробка по центру: заголовок, содержимое, низ с кнопками.
	// Закрывается кнопкой [data-dialog-close], Esc или кликом мимо коробки
	// (если не modal). Окна могут идти одно поверх другого.
	const dialogs = [];
	function dialog({ title, body, foot = '', wide = false, modal = false, onClose }) {
		const el = document.createElement('div');
		el.className = 'dialog';
		el.innerHTML = `<div class="dialog__box${wide ? ' dialog__box--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">`
			+ `<p class="dialog__title">${esc(title)}</p><div class="dialog__body">${body}</div>`
			+ (foot ? `<div class="dialog__foot">${foot}</div>` : '') + `</div>`;
		document.body.appendChild(el);
		const d = { el, modal, onClose, close: () => closeDialog(d) };
		dialogs.push(d);
		el.offsetHeight; // начальное состояние — до перехода
		el.classList.add('is-open');
		return d;
	}
	function closeDialog(d = dialogs.at(-1)) {
		const i = dialogs.indexOf(d);
		if (i < 0) return;
		dialogs.splice(i, 1);
		close(); // панель вариантов могла остаться от поля окна
		d.el.classList.remove('is-open');
		d.el.classList.add('is-closing');
		const ms = parseFloat(getComputedStyle(d.el).transitionDuration) * 1000 || 0;
		setTimeout(() => d.el.remove(), ms);
		d.onClose?.();
	}
	document.addEventListener('click', e => {
		const btn = e.target.closest('[data-dialog-close]');
		if (btn) closeDialog(dialogs.find(d => d.el.contains(btn)));
	});
	document.addEventListener('mousedown', e => {
		const top = dialogs.at(-1);
		if (top && !top.modal && e.target === top.el) closeDialog(top);
	});
	document.addEventListener('keydown', e => {
		if (e.key !== 'Escape' || e.defaultPrevented || !dialogs.length) return;
		e.preventDefault();
		closeDialog();
	});

	// Описание в большом окне — то же поле: всё, что набрано там, сразу
	// попадает в исходное (со своим событием input — для живого вида).
	function openExpanded(area) {
		const label = area.closest('.field')?.querySelector('.field__label')?.firstChild?.textContent?.trim() || 'Описание';
		const d = dialog({
			title: label,
			wide: true,
			body: editorHTML({ value: area.value, placeholder: area.placeholder, expand: false }),
			foot: `<span class="dialog__spacer"></span><button type="button" class="btn btn--primary" data-dialog-close><span class="btn__label">Готово</span></button>`,
			onClose: () => area.focus({ preventScroll: true }),
		});
		const big = d.el.querySelector('.editor__area');
		big.addEventListener('input', () => {
			area.value = big.value;
			area.dispatchEvent(new Event('input', { bubbles: true }));
		});
		big.focus();
		big.setSelectionRange(area.selectionStart ?? 0, area.selectionEnd ?? 0);
	}

	// ─── Очки славы ───
	function setScore(wrap, value) {
		wrap.querySelector('input').value = value;
		wrap.querySelectorAll('.score__bar').forEach((b, i) => b.classList.toggle('is-on', i < value));
		wrap.querySelector('.score__value b').textContent = value;
		wrap.dispatchEvent(new Event('change', { bubbles: true }));
	}
	document.addEventListener('click', e => {
		const bar = e.target.closest('.score__bar');
		if (!bar) return;
		const wrap = bar.closest('.score'), n = +bar.dataset.score;
		setScore(wrap, +wrap.querySelector('input').value === n ? n - 1 : n);
	});

	// ─── Действие в два клика ───
	// Перехват на погружении: первый клик до обработчиков страницы не доходит.
	// Через 3 с (или resetConfirm — например, при открытии другой формы)
	// кнопка возвращается в исходный вид.
	const confirmTimers = new WeakMap();
	function resetConfirm(btn) {
		clearTimeout(confirmTimers.get(btn));
		if (!btn.classList.contains('is-confirming')) return;
		btn.classList.remove('is-confirming');
		btn.querySelector('.btn__label').textContent = btn.dataset.label;
	}
	document.addEventListener('click', e => {
		const btn = e.target.closest('[data-confirm]');
		if (!btn || btn.classList.contains('is-confirming')) return;
		e.stopImmediatePropagation();
		e.preventDefault();
		const label = btn.querySelector('.btn__label');
		btn.dataset.label = label.textContent;
		btn.classList.add('is-confirming');
		label.textContent = btn.dataset.confirm;
		confirmTimers.set(btn, setTimeout(() => resetConfirm(btn), 3000));
	}, true);

	const api = {
		lists: {},
		links: null,
		match: (text, q) => String(text).toLowerCase().includes(q.toLowerCase()),
		icon, selectHTML, editorHTML, scoreHTML, syncSelect, setScore, resetConfirm, close, dialog, closeDialog,
	};
	return api;
})();

// ─── Админка: формы правки ────────────────────────────────────────────────
// Сайдбар переключается на форму (как на сайте: локация, задание, фракция).
// «Сохранить» и «Удалить» пишут в базу (права — у вошедшего), затем данные
// перечитываются. Поля и их поведение — «Поля форм и окна», стили — «АДМИНКА —
// ФОРМЫ» в style.css. При открытой форме локации или задания клик по карте
// ставит точку (метку-черновик можно перетаскивать); при правке задания клик
// по метке локации привязывает задание к ней.
const editForm = document.getElementById('edit-form');
const editDeleteBtn = document.getElementById('edit-delete');
const editSaveBtn = document.querySelector('.edit__foot [type="submit"]');
editDeleteBtn.querySelector('.btn__icon').innerHTML = forms.icon('trash', 'btn__svg');
const sidebarTitle = sidebarEl.querySelector('.sidebar__title');
const sidebarYear = sidebarEl.querySelector('.sidebar__year');
const SIDEBAR_HEAD = { title: sidebarTitle.textContent, year: sidebarYear.textContent };

// ─── Запись в базу ───
// Если сессия истекла, база молча ничего не меняет — пустой ответ тоже
// ошибка (как на прежнем сайте).
const SESSION_EXPIRED_MSG = 'нет прав на изменение (сессия могла истечь — войдите заново)';
const db = table => supabaseClient.from(table);
const now = () => new Date().toISOString();
async function runWrite(query) {
	const { data, error } = await query.select();
	if (error) return { ok: false, message: error.message };
	if (!data?.length) return { ok: false, message: SESSION_EXPIRED_MSG };
	return { ok: true, row: data[0] };
}
// Новая запись — вставка, правка — обновление по id.
const saveRow = (table, id, payload) => runWrite(id ? db(table).update(payload).eq('id', id) : db(table).insert(payload));

// Сообщение внизу карты — для ошибок вне формы (перетаскивание задания).
let toastTimer = 0;
function showToast(text) {
	let el = document.getElementById('toast');
	if (!el) {
		el = Object.assign(document.createElement('div'), { id: 'toast', className: 'toast' });
		el.setAttribute('role', 'alert');
		document.body.append(el);
	}
	el.textContent = text;
	el.style.left = `${(sidebarWidth() + innerWidth) / 2}px`;
	el.offsetHeight; // начальное положение — до перехода
	el.classList.add('is-shown');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => el.classList.remove('is-shown'), 6000);
}

// Названия сравниваются так же нестрого, как в поиске («Чи Ан» = «Чи'Ан»).
const compactName = s => searchWords(s).join('');
const sameName = (a, b) => !!compactName(a) && compactName(a) === compactName(b);
forms.match = (text, raw) => {
	const query = makeQuery(raw);
	const field = compactName(text);
	return !query || query.some(words => words.every(w => field.includes(w)));
};
const sortRu = list => [...new Set(list.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
forms.lists.provinces = () => sortRu([...Object.keys(provinceMeta), ...markers.map(r => r.province)]);
forms.lists.factionRegions = () => sortRu(regionsFactions.features.map(f => f.properties.name));
forms.lists.factions = () => sortRu(markers.map(r => r.faction));
forms.lists.locations = () => sortRu(markers.map(r => r.runame));
forms.lists.branches = () => sortRu(branches.map(b => b.runame));
forms.lists.orGroups = () => sortRu(quests.map(q => q.branch_or_group));
forms.links = () => [
	{ group: 'Локации', type: 'loc', items: [...markers].sort(byName).map(r => ({ id: r.id, label: r.runame, sub: r.province })) },
	{ group: 'Провинции', type: 'province', items: regionsProvinces.features.map(f => ({ id: f.properties.id, label: f.properties.name })).sort((a, b) => a.label.localeCompare(b.label, 'ru')) },
	{ group: 'Фракции', type: 'faction', items: regionsFactions.features.filter(f => f.properties.name).map(f => ({ id: f.properties.id, label: f.properties.name })) },
];

const LOCATION_TYPE_OPTIONS = [
	['city', 'Город'], ['town', 'Поселение'], ['fort', 'Форт'], ['camp', 'Лагерь'], ['shrine', 'Святилище'],
	['pointOfInterest', 'Точка интереса'], ['polarGates', 'Врата Древних'], ['polarGatesBroken', 'Разрушенные врата Древних'], ['quest', 'Задание'],
].map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }));
const REPUTATION_OPTIONS = [['neutral', 'Нейтральная'], ['positive', 'Положительная'], ['negative', 'Отрицательная']].map(([value, label]) => ({ value, label }));
const ANCHORS = [{ key: 'location', label: 'Локация' }, { key: 'province', label: 'Провинция' }, { key: 'faction', label: 'Фракция' }, { key: 'point', label: 'Точка' }, { key: 'unplaced', label: 'Без места' }];

// ─── Разметка полей ───
const fieldLabel = (text, forId, required) =>
	`<label class="field__label"${forId ? ` for="${forId}"` : ''}>${text}${required ? '<span class="field__req">*</span>' : ''}</label>`;
const hintHTML = (hint, id) => hint != null ? `<p class="field__hint"${id ? ` id="${id}"` : ''}>${hint}</p>` : '';
function inputField({ name, label, value, required, placeholder = '', hint, type = 'text', combo }) {
	const id = `f-${name}`;
	return `<div class="field">${fieldLabel(label, id, required)}`
		+ `<input type="${type}" class="input" id="${id}" name="${name}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" autocomplete="off"`
		+ `${combo ? ` data-combo="${combo}"` : ''}${type === 'number' ? ' min="1" step="1"' : ''}>${hintHTML(hint)}</div>`;
}
function textareaField({ name, label, value, placeholder = '', hint }) {
	const id = `f-${name}`;
	return `<div class="field">${fieldLabel(label, id)}<textarea class="textarea" id="${id}" name="${name}" rows="2" placeholder="${esc(placeholder)}">${esc(value ?? '')}</textarea>${hintHTML(hint)}</div>`;
}
const editorField = ({ name, label, value }) =>
	`<div class="field">${fieldLabel(label, `f-${name}`)}${forms.editorHTML({ id: `f-${name}`, name, value: value ?? '' })}</div>`;
const selectField = ({ name, label, value, options }) =>
	`<div class="field">${fieldLabel(label, `f-${name}`)}${forms.selectHTML({ id: `f-${name}`, name, value, options })}</div>`;
// Ряд кнопок-переключателей (с иконкой или текстом); data-single — выбор одного.
const togglesHTML = ({ group, items, selected, single }) =>
	`<div class="btn-row" data-group="${group}"${single ? ' data-single' : ''}>${items.map(it => it.icon
		? iconButtonHTML({ icon: it.icon, label: it.label, selected: selected.includes(it.key), action: 'edit-toggle', key: it.key })
		: `<button type="button" class="btn${selected.includes(it.key) ? ' selected' : ''}" data-action="edit-toggle" data-key="${it.key}"><span class="btn__label">${it.label}</span></button>`
	).join('')}</div>`;
const coordsHTML = (lng, lat) => `<div class="field__pair">`
	+ `<input type="number" class="input" name="lng" step="any" placeholder="lng" value="${lng ?? ''}" aria-label="Долгота">`
	+ `<input type="number" class="input" name="lat" step="any" placeholder="lat" value="${lat ?? ''}" aria-label="Широта"></div>`;
const iconItems = list => list.map(t => ({ ...t, icon: `images/icons/${t.key}.png` }));
const selectedKeys = group => [...editForm.querySelectorAll(`[data-group="${group}"] .btn.selected`)].map(b => b.dataset.key);

// ─── Формы ───
const EDITORS = {
	marker: {
		newTitle: 'Новая локация', title: 'Локация', table: 'markers', list: () => markers,
		html(r) {
			edit.systemTraits = (r.traits || []).filter(t => !TRAITS.some(x => x.key === t));
			edit.provinceAuto = !r.province;
			return inputField({ name: 'runame', label: 'Название (рус.)', value: r.runame, required: true })
				+ inputField({ name: 'engname', label: 'Название (англ.)', value: r.engname })
				+ editorField({ name: 'description', label: 'Описание', value: r.description })
				+ inputField({ name: 'faction', label: 'Фракция', value: r.faction, placeholder: 'Название фракции', combo: 'factions' })
				+ inputField({ name: 'province', label: 'Провинция', value: r.province, placeholder: 'Название провинции', combo: 'provinces', hint: 'Если не задана — подставится по координатам' })
				+ selectField({ name: 'location_type', label: 'Тип', value: r.location_type ?? 'city', options: LOCATION_TYPE_OPTIONS })
				+ `<div class="field"><p class="field__label">Особенности</p>${togglesHTML({ group: 'traits', items: iconItems(TRAITS), selected: r.traits || [] })}</div>`
				+ `<div class="field">${fieldLabel('Системные особенности', 'f-system-trait')}<div class="chip-row" id="f-chips"></div>`
				+ `<div class="field__add"><input type="text" class="input" id="f-system-trait" placeholder="Новая особенность…" autocomplete="off">`
				+ `<button type="button" class="input-btn" data-action="chip-add" title="Добавить">${forms.icon('plus')}</button></div></div>`
				+ imageFieldHTML(r)
				+ `<div class="field">${fieldLabel('Координаты', null, true)}${coordsHTML(r.lng, r.lat)}${hintHTML('Кликните по карте или перетащите метку')}</div>`
				// у локаций, что были в проекте до админки, — «как было» (default_data)
				+ (r.is_default && r.default_data ? `<div class="field"><button type="button" class="btn btn--action" data-action="edit-revert"><span class="btn__label">Восстановить по умолчанию</span></button>`
					+ `${hintHTML('Какой локация была в проекте изначально — сначала покажет отличия')}</div>` : '');
		},
		init(r) {
			renderSystemTraits();
			if (r.image) loadCropImage(r.image, r.image_view);
			if (r.lat != null) setDraft(L.latLng(r.lat, r.lng), { pan: true });
		},
		async save() {
			const f = editForm.elements;
			const runame = f.runame.value.trim();
			if (!runame) return 'Укажите название локации';
			const ll = readCoords();
			if (!ll) return 'Кликните по карте, чтобы указать положение локации';
			const src = f.image.value.trim();
			const view = imageViewFor(src);
			const image = await uploadPendingImage(src, 'locations');
			if (image.error) return image.error;
			const res = await saveRow('markers', edit.id, {
				runame,
				engname: f.engname.value.trim() || null,
				// описание, фракция, провинция у локаций — пустая строка, не null (как на прежнем сайте)
				description: f.description.value.trim(),
				faction: f.faction.value.trim(),
				province: f.province.value.trim() || detectProvinceAt(ll.lat, ll.lng),
				location_type: f.location_type.value,
				traits: [...selectedKeys('traits'), ...edit.systemTraits],
				image: image.url,
				image_view: image.url ? view : null,
				lat: ll.lat, lng: ll.lng,
			});
			if (!res.ok) return `Не удалось сохранить: ${res.message}`;
			await finishEdit(() => { const row = markerById.get(res.row.id); if (row) openLocationPopup(row); });
		},
	},

	quest: {
		newTitle: 'Новое задание', title: 'Задание', table: 'quests', list: () => quests,
		html(q, opts) {
			const anchor = q.anchor_kind || opts.anchorKind || 'unplaced';
			const branch = branchById.get(q.branch_id)?.runame ?? '';
			const locName = markerById.get(q.anchor_location_id ?? opts.anchorLocationId)?.runame ?? '';
			const sub = (key, inner) => `<div class="field" data-anchor-field="${key}"${anchor === key ? '' : ' hidden'}>${inner}</div>`;
			return inputField({ name: 'runame', label: 'Название', value: q.runame, required: true })
				+ textareaField({ name: 'short_description', label: 'Краткое описание', value: q.short_description, placeholder: 'Текст для попапа локации / провинции' })
				+ editorField({ name: 'description', label: 'Описание', value: q.description })
				+ selectField({ name: 'status', label: 'Статус', value: STATUS_LABEL[q.status] ? q.status : 'rumor', options: STATUS_OPTIONS })
				+ textareaField({ name: 'outcome', label: 'Последствия', value: q.outcome, placeholder: 'Чем закончилось задание',
					hint: 'В карточке и попапе — под описанием, полоса цвета статуса' })
				+ `<div class="field"><p class="field__label">Персонажи</p>${togglesHTML({ group: 'characters', items: iconItems(CHARACTERS), selected: q.characters || [] })}</div>`
				+ `<div class="field">${fieldLabel('Ветка заданий', 'f-branch')}<div class="field__add">`
				+ `<input type="text" class="input" id="f-branch" name="branch" value="${esc(branch)}" placeholder="Без ветки" autocomplete="off" data-combo="branches">`
				+ `<button type="button" class="input-btn" data-action="branch-dialog" title="Ветка: название, описание, названия вариантов"><img src="images/ui/edit.svg" alt=""></button></div>`
				+ `${hintHTML('Такой ветки нет — при сохранении будет создана новая', 'f-branch-new')}</div>`
				+ `<div class="field" id="f-branch-extra"${branch ? '' : ' hidden'}><div class="field__pair">`
				+ inputField({ name: 'branch_step', label: 'Шаг в ветке', type: 'number', value: q.branch_step, placeholder: 'Необязательно' })
				+ inputField({ name: 'branch_or_group', label: 'Группа «или»', value: q.branch_or_group, placeholder: 'Необязательно', combo: 'orGroups' })
				+ `</div>${hintHTML('У заданий одного шага: одна и та же группа — «и» (нужны все), разные группы или без группы — «или» (любое одно)')}</div>`
				+ `<div class="field"><p class="field__label">Привязка</p>${togglesHTML({ group: 'anchor', items: ANCHORS, selected: [anchor], single: true })}</div>`
				+ sub('location', `<input type="text" class="input" name="anchor_location" value="${esc(locName)}" placeholder="Название локации" autocomplete="off" data-combo="locations" aria-label="Локация">`
					+ hintHTML('Или кликните по метке локации на карте'))
				+ sub('province', `<input type="text" class="input" name="anchor_province" value="${esc(provinceNameById[q.anchor_province_id ?? opts.anchorProvinceId] ?? '')}" placeholder="Название провинции" autocomplete="off" data-combo="provinces" aria-label="Провинция">`)
				+ sub('faction', `<input type="text" class="input" name="anchor_faction" value="${esc(factionRegionById[q.anchor_faction_id ?? opts.anchorFactionId]?.properties.name ?? '')}" placeholder="Территория фракции на карте" autocomplete="off" data-combo="factionRegions" aria-label="Фракция">`)
				+ sub('point', coordsHTML(q.lng, q.lat) + hintHTML('Кликните по карте, чтобы поставить точку'));
		},
		init(q) {
			syncBranch();
			if (q.anchor_kind === 'point' && q.lat != null) setDraft(L.latLng(q.lat, q.lng), { pan: true });
		},
		async save() {
			const f = editForm.elements;
			const runame = f.runame.value.trim();
			if (!runame) return 'Укажите название задания';
			const anchor = selectedKeys('anchor')[0] || 'unplaced';
			const place = { anchor_kind: anchor, anchor_location_id: null, anchor_province_id: null, anchor_faction_id: null, lat: null, lng: null };
			if (anchor === 'location') {
				const row = markers.find(r => sameName(r.runame, f.anchor_location.value));
				if (!row) return 'Локация с таким названием не найдена';
				place.anchor_location_id = row.id;
			} else if (anchor === 'province') {
				const name = Object.keys(provinceMeta).find(n => sameName(n, f.anchor_province.value));
				if (!name) return 'Провинция с таким названием не найдена';
				place.anchor_province_id = provinceMeta[name].id;
			} else if (anchor === 'faction') {
				const region = regionsFactions.features.find(r => sameName(r.properties.name, f.anchor_faction.value));
				if (!region) return 'Территория фракции с таким названием не найдена';
				place.anchor_faction_id = region.properties.id;
			} else if (anchor === 'point') {
				const ll = readCoords();
				if (!ll) return 'Кликните по карте, чтобы поставить точку';
				Object.assign(place, { lat: ll.lat, lng: ll.lng });
			}
			// Новая ветка (вписана в поле, но такой нет) создаётся первой.
			const branchName = f.branch.value.trim();
			let branch = branchName ? branches.find(b => sameName(b.runame, branchName)) : null;
			if (branchName && !branch) {
				const created = await runWrite(db('quest_branches').insert({ runame: branchName }));
				if (!created.ok) return `Не удалось создать ветку: ${created.message}`;
				branches.push(branch = created.row);
			}
			const step = parseInt(f.branch_step.value, 10);
			const res = await saveRow('quests', edit.id, {
				...place,
				runame,
				short_description: f.short_description.value.trim() || null,
				description: f.description.value.trim() || null,
				status: f.status.value,
				outcome: f.outcome.value.trim() || null,
				characters: selectedKeys('characters'),
				branch_id: branch?.id ?? null,
				branch_step: branch && !Number.isNaN(step) ? step : null,
				branch_or_group: branch ? f.branch_or_group.value.trim() || null : null,
				updated_at: now(),
			});
			if (!res.ok) return `Не удалось сохранить: ${res.message}`;
			if (anchor === 'point') showQuestPoints();
			await finishEdit(() => { const q = quests.find(x => x.id === res.row.id); if (q) openQuestPopup(q); });
		},
	},

	faction: {
		newTitle: 'Новая фракция', title: 'Фракция', table: 'factions', list: () => factions,
		html(f) {
			const rep = factionRep(f);
			return inputField({ name: 'runame', label: 'Название фракции', value: f.runame, required: true })
				+ selectField({ name: 'reputation', label: 'Репутация', value: rep, options: REPUTATION_OPTIONS })
				+ `<div class="field"><p class="field__label">Очки славы</p>${forms.scoreHTML({ name: 'score', value: Math.max(0, Math.min(10, Number(f.score) || 0)), rep })}</div>`
				+ inputField({ name: 'title', label: 'Титул отряда', value: f.title, placeholder: 'Как фракция называет отряд' })
				+ textareaField({ name: 'effect', label: 'Эффект репутации', value: f.effect, placeholder: 'Последствие или бонус — необязательно' })
				+ imageFieldHTML(f, { label: 'Герб', crop: false })
				+ editorField({ name: 'description', label: 'Описание', value: f.description });
		},
		init(f) {
			if (f.image) syncEmblem(f.image);
		},
		async save() {
			const f = editForm.elements;
			const runame = f.runame.value.trim();
			if (!runame) return 'Укажите название фракции';
			const image = await uploadPendingImage(f.image.value.trim(), 'factions');
			if (image.error) return image.error;
			const res = await saveRow('factions', edit.id, {
				runame,
				reputation: f.reputation.value,
				score: Math.max(0, Math.min(10, Number(f.score.value) || 0)),
				title: f.title.value.trim() || null,
				effect: f.effect.value.trim() || null,
				image: image.url,
				description: f.description.value.trim() || null,
				updated_at: now(),
			});
			if (!res.ok) return `Не удалось сохранить: ${res.message}`;
			await finishEdit(() => { state.openFactionId = res.row.id; renderFactions(); revealSection('factions'); });
		},
	},
};

// ─── Открыть / закрыть ───
function openEditor(kind, id = null, opts = {}) {
	if (edit?.busy) return;
	const cfg = EDITORS[kind];
	const item = id ? cfg.list().find(x => x.id === id) : null;
	if (id && !item) return;
	closeEditor();
	// item — запись, как она в базе; files — выбранные файлы картинок (см. useImageFile)
	edit = { kind, id, item: item ?? {}, draft: null, files: new Map() };
	map.closePopup();
	setSearchOpen(false);
	if (sidebarEl.classList.contains('is-collapsed')) document.getElementById('collapse').click();
	editForm.innerHTML = `<div class="form">${cfg.html(item ?? {}, opts)}<p class="form__error" id="f-error"></p></div>`;
	editDeleteBtn.hidden = !id;
	forms.resetConfirm(editDeleteBtn); // «Точно удалить?» от прошлой формы не переносится
	sidebarTitle.textContent = id ? cfg.title : cfg.newTitle;
	sidebarYear.textContent = item?.runame ?? '';
	sidebarYear.hidden = !id;
	sidebarEl.classList.add('is-editing');
	editForm.scrollTop = 0;
	cfg.init?.(item ?? {}, opts);
	updateMarkers();
}
function closeEditor() {
	if (!edit) return;
	edit.draft?.remove();
	edit.files.forEach((_, url) => URL.revokeObjectURL(url));
	forms.close();
	edit = null;
	setBusy(false);
	sidebarEl.classList.remove('is-editing');
	sidebarTitle.textContent = SIDEBAR_HEAD.title;
	sidebarYear.textContent = SIDEBAR_HEAD.year;
	sidebarYear.hidden = false;
	editForm.innerHTML = '';
	updateMarkers();
}
// Пока идёт запись, кнопки низа не нажимаются (и «Назад» тоже — форма
// закроется сама, когда данные перечитаны).
function setBusy(busy, what = 'save') {
	if (edit) edit.busy = busy;
	document.querySelectorAll('.edit__foot .btn').forEach(b => { b.disabled = busy; });
	editSaveBtn.querySelector('.btn__label').textContent = busy && what === 'save' ? 'Сохраняю…' : 'Сохранить';
	editDeleteBtn.querySelector('.btn__label').textContent = busy && what === 'delete' ? 'Удаляю…' : 'Удалить';
}
function showEditError(text) {
	const el = editForm.querySelector('#f-error');
	if (!el) return;
	el.textContent = text;
	el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
// После записи — перечитать данные, закрыть форму, показать результат.
async function finishEdit(after) {
	await load();
	closeEditor();
	after?.();
}
async function removeEdited() {
	if (!edit?.id || edit.busy) return;
	const session = edit, { kind, id } = edit;
	forms.resetConfirm(editDeleteBtn);
	setBusy(true, 'delete');
	let res = { ok: true };
	// Задания удаляемой локации не пропадают — остаются без места.
	if (kind === 'marker' && questsByLocation.has(id)) {
		res = await runWrite(db('quests').update({ anchor_kind: 'unplaced', anchor_location_id: null, updated_at: now() }).eq('anchor_location_id', id));
	}
	if (res.ok) res = await runWrite(db(EDITORS[kind].table).delete().eq('id', id));
	if (edit !== session) return;
	if (res.ok) { await finishEdit(); return; }
	setBusy(false);
	showEditError(`Не удалось удалить: ${res.message}`);
}
editForm.addEventListener('submit', async e => {
	e.preventDefault();
	if (!edit || edit.busy) return;
	const session = edit;
	editForm.querySelector('#f-error').textContent = '';
	setBusy(true);
	const error = await EDITORS[edit.kind].save();
	if (edit !== session) return; // сохранено — форма уже закрыта
	setBusy(false);
	if (error) showEditError(error);
});

// ─── Переключатели, ветка, привязка, системные особенности ───
function toggleEditButton(btn) {
	const row = btn.closest('[data-group]');
	if (row.hasAttribute('data-single')) row.querySelectorAll('.btn').forEach(b => b.classList.toggle('selected', b === btn));
	else btn.classList.toggle('selected');
	if (row.dataset.group === 'anchor') syncAnchor();
}
function setAnchor(key) {
	editForm.querySelectorAll('[data-group="anchor"] .btn').forEach(b => b.classList.toggle('selected', b.dataset.key === key));
	syncAnchor();
}
function syncAnchor() {
	const kind = selectedKeys('anchor')[0];
	editForm.querySelectorAll('[data-anchor-field]').forEach(el => { el.hidden = el.dataset.anchorField !== kind; });
	if (kind !== 'point') clearDraft();
	else if (!edit.draft) { const ll = readCoords(); if (ll) setDraft(ll); }
}
function syncBranch() {
	const name = editForm.elements.branch.value.trim();
	document.getElementById('f-branch-extra').hidden = !name;
	document.getElementById('f-branch-new').hidden = !name || branches.some(b => sameName(b.runame, name));
}
function renderSystemTraits() {
	document.getElementById('f-chips').innerHTML = edit.systemTraits.map((t, i) =>
		`<button type="button" class="btn selected" data-action="chip-remove" data-key="${i}" title="Убрать"><span class="btn__label">${esc(t)}</span>${forms.icon('x', 'btn__remove')}</button>`).join('');
}
function addSystemTrait() {
	const input = document.getElementById('f-system-trait');
	const value = input.value.trim();
	if (value && !edit.systemTraits.includes(value)) edit.systemTraits.push(value);
	input.value = '';
	input.focus();
	renderSystemTraits();
}
editForm.addEventListener('keydown', e => {
	if (e.key === 'Enter' && e.target.id === 'f-system-trait') { e.preventDefault(); addSystemTrait(); }
});
editForm.addEventListener('input', e => {
	if (!edit) return;
	const name = e.target.name;
	if (name === 'runame') syncDraft();
	if (name === 'province') edit.provinceAuto = !e.target.value.trim();
	if (name === 'branch') syncBranch();
	if (name === 'lng' || name === 'lat') {
		const ll = readCoords();
		if (ll && edit.draft) edit.draft.setLatLng(ll);
		else if (ll) setDraft(ll, { write: false });
	}
});
editForm.addEventListener('change', e => {
	if (e.target.name === 'location_type') syncDraft();
	if (e.target.name === 'reputation') editForm.querySelector('.score').dataset.rep = e.target.value;
});

// ─── Окно ветки: название, описание, названия вариантов ───
// Ветка — та, что вписана в поле формы задания; такой нет — окно создаёт
// новую. Как на прежнем сайте, сохраняется сразу, не дожидаясь формы
// задания (иначе описание ветки терялось бы, если форму закрыть без
// сохранения). Варианты — «или»-группы: метки у заданий ветки и в этой форме;
// название варианта — подпись вкладки в журнале.
const dialogError = (d, text) => { d.el.querySelector('[data-error]').textContent = text; };
function openBranchDialog() {
	const input = editForm.elements.branch;
	const name = input.value.trim();
	const branch = name ? branches.find(b => sameName(b.runame, name)) : null;
	const members = branch ? quests.filter(q => q.branch_id === branch.id) : [];
	const keys = sortRu([...members.map(q => q.branch_or_group), editForm.elements.branch_or_group.value.trim()]);
	const titles = branch?.or_group_titles ?? {};
	const fallback = key => { const list = members.filter(q => q.branch_or_group === key); return list.length === 1 ? list[0].runame : key; };
	const d = forms.dialog({
		title: branch ? 'Ветка заданий' : 'Новая ветка',
		modal: true,
		body: `<div class="form">`
			+ inputField({ name: 'branch_runame', label: 'Название', value: branch?.runame ?? name, required: true })
			+ editorField({ name: 'branch_description', label: 'Описание', value: branch?.description })
			+ (keys.length ? `<div class="field"><p class="field__label">Названия вариантов</p>`
				+ keys.map((k, i) => `<label class="or-title"><span class="or-title__key" title="Метка группы «или» у заданий">${esc(k)}</span>`
					+ `<input type="text" class="input" name="or_title_${i}" value="${esc(titles[k] ?? '')}" placeholder="${esc(fallback(k))}" autocomplete="off"></label>`).join('')
				+ hintHTML('Подписи вкладок «или»-групп в журнале; пусто — название задания, если оно в группе одно') + `</div>` : '')
			+ `<p class="form__error" data-error></p></div>`,
		foot: `<button type="button" class="btn btn--action" data-dialog-close><span class="btn__label">Отмена</span></button>`
			+ `<span class="dialog__spacer"></span>`
			+ `<button type="button" class="btn btn--primary" data-save><span class="btn__label">Сохранить</span></button>`,
	});
	const field = n => d.el.querySelector(`[name="${n}"]`);
	const saveBtn = d.el.querySelector('[data-save]');
	field('branch_runame').focus();
	saveBtn.addEventListener('click', async () => {
		const runame = field('branch_runame').value.trim();
		if (!runame) return dialogError(d, 'Укажите название ветки');
		if (branches.some(b => b !== branch && sameName(b.runame, runame))) return dialogError(d, 'Ветка с таким названием уже есть');
		const or_group_titles = { ...titles };
		keys.forEach((k, i) => { const v = field(`or_title_${i}`).value.trim(); if (v) or_group_titles[k] = v; else delete or_group_titles[k]; });
		saveBtn.disabled = true;
		saveBtn.querySelector('.btn__label').textContent = 'Сохраняю…';
		const res = await saveRow('quest_branches', branch?.id, { runame, description: field('branch_description').value.trim() || null, or_group_titles });
		saveBtn.disabled = false;
		saveBtn.querySelector('.btn__label').textContent = 'Сохранить';
		if (!res.ok) return dialogError(d, `Не удалось сохранить: ${res.message}`);
		branches = branches.filter(b => b.id !== res.row.id).concat(res.row);
		if (edit?.kind === 'quest') { input.value = res.row.runame; syncBranch(); }
		d.close();
		refreshAll();
	});
}

// ─── Восстановить локацию по умолчанию ───
// У локаций, что были в проекте до админки, в default_data — как было
// задумано. Окно сравнивает сохранённое в базе с этим; «Восстановить» пишет
// значения по умолчанию и открывает форму заново. Видимая область картинки
// сбрасывается, только если меняется сама картинка.
const REVERT_FIELDS = [
	['runame', 'Название (рус.)'], ['engname', 'Название (англ.)'], ['description', 'Описание'], ['faction', 'Фракция'],
	['province', 'Провинция'], ['location_type', 'Тип'], ['traits', 'Особенности'], ['image', 'Картинка'],
];
function revertText(key, v) {
	if (key === 'location_type') return LOCATION_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v ?? '';
	if (key === 'traits') return (v || []).map(t => TRAITS.find(x => x.key === t)?.label ?? t).join(', ');
	return v ?? '';
}
function openRevertDialog() {
	const row = markerById.get(edit?.id), def = row?.default_data;
	if (!def) return;
	const cell = (text, diff) => `<span class="compare__value${diff ? ' is-diff' : ''}">${esc(text) || '—'}</span>`;
	let diffs = 0;
	const rowHTML = (label, a, b) => { if (a !== b) diffs++; return `<span class="compare__label">${label}</span>${cell(a, a !== b)}${cell(b, a !== b)}`; };
	const rows = REVERT_FIELDS.map(([k, label]) => rowHTML(label, revertText(k, row[k]), revertText(k, def[k]))).join('')
		+ rowHTML('Координаты', `${row.lng}, ${row.lat}`, `${def.lng}, ${def.lat}`);
	const d = forms.dialog({
		title: 'Восстановить по умолчанию',
		wide: true,
		body: hintHTML(diffs ? 'Отличия выделены. Несохранённые правки в форме пропадут.' : 'Отличий нет — в базе локация такая, как по умолчанию.')
			+ `<div class="compare"><span></span><span class="compare__head">Сейчас</span><span class="compare__head">По умолчанию</span>${rows}</div>`
			+ `<p class="form__error" data-error></p>`,
		foot: `<button type="button" class="btn btn--action" data-dialog-close><span class="btn__label">${diffs ? 'Отмена' : 'Закрыть'}</span></button>`
			+ (diffs ? `<span class="dialog__spacer"></span><button type="button" class="btn btn--primary" data-revert><span class="btn__label">Восстановить</span></button>` : ''),
	});
	const btn = d.el.querySelector('[data-revert]');
	btn?.addEventListener('click', async () => {
		const payload = {
			runame: def.runame, engname: def.engname ?? null, description: def.description ?? '',
			faction: def.faction ?? '', province: def.province ?? '', location_type: def.location_type,
			traits: def.traits ?? [], image: def.image ?? null, lng: def.lng, lat: def.lat,
		};
		if (payload.image !== row.image) payload.image_view = null;
		btn.disabled = true;
		btn.querySelector('.btn__label').textContent = 'Восстанавливаю…';
		const res = await runWrite(db('markers').update(payload).eq('id', row.id));
		btn.disabled = false;
		btn.querySelector('.btn__label').textContent = 'Восстановить';
		if (!res.ok) return dialogError(d, `Не удалось восстановить: ${res.message}`);
		d.close();
		await load();
		closeEditor();
		openEditor('marker', row.id);
	});
}

// ─── Точка на карте: метка-черновик ───
function readCoords() {
	const lng = parseFloat(editForm.elements.lng?.value), lat = parseFloat(editForm.elements.lat?.value);
	return Number.isNaN(lng) || Number.isNaN(lat) ? null : L.latLng(lat, lng);
}
const draftType = () => edit.kind === 'marker' ? editForm.elements.location_type.value : 'quest';
function writeCoords(ll) {
	const f = editForm.elements;
	f.lng.value = ll.lng.toFixed(1);
	f.lat.value = ll.lat.toFixed(1);
	if (edit.kind === 'marker' && edit.provinceAuto) f.province.value = detectProvinceAt(ll.lat, ll.lng);
}
function setDraft(latlng, { pan = false, write = true } = {}) {
	if (!edit.draft) {
		edit.draft = L.marker(latlng, { icon: makeIcon(draftType()), draggable: true, zIndexOffset: 1000 }).addTo(map);
		edit.draft.bindTooltip('', { permanent: true, direction: 'bottom', className: 'location-name-label', interactive: false });
		edit.draft.on('drag', () => writeCoords(edit.draft.getLatLng()));
	} else {
		edit.draft.setLatLng(latlng);
	}
	if (write) writeCoords(latlng);
	syncDraft();
	if (pan) map.panTo(latlng);
}
function syncDraft() {
	const draft = edit?.draft;
	if (!draft) return;
	const type = draftType();
	draft.setIcon(makeIcon(type));
	draft.getTooltip().options.offset = [0, (MARKER_SIZE[type] ?? 24) / 2];
	draft.setTooltipContent(editForm.elements.runame.value.trim() || EDITORS[edit.kind].newTitle);
}
function clearDraft() {
	edit?.draft?.remove();
	if (edit) edit.draft = null;
}
// ─── Картинка: источник и видимая область ───
// Источник — ссылка откуда угодно или файл (кнопка, перетаскивание файла или
// картинки из другой вкладки, Ctrl+V). Файл до сохранения живёт по
// blob:-ссылке, при сохранении загружается в хранилище (бакет images; папки
// locations/ и factions/), в базу идёт постоянная ссылка оттуда. У локации
// видимая область — рамка кадра фона попапа (340×365) поверх всей картинки:
// тянется мышью (клик мимо рамки — перенести её туда), колесо и ползунок —
// масштаб. Хранится как { x, y, zoom } (см. popBgHTML) — кадр не искажается
// при любом размере картинки. У фракции — просто герб, как в «Славе».
const BG_W = 340, BG_H = 365;
const CROP_MAX = { w: 324, h: 200 };   // обзор — по ширине поля, не выше 200px
// Что принимает хранилище (supabase/2026-10-new-design.sql, бакет images).
const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
const IMAGE_MAX_MB = 10;

function imageFieldHTML(r, { label = 'Картинка', crop = true } = {}) {
	return `<div class="field" id="f-image-field">${fieldLabel(label, 'f-image')}`
		+ `<div class="field__add"><input type="text" class="input" id="f-image" name="image" value="${esc(r.image ?? '')}" placeholder="Ссылка на картинку или файл" autocomplete="off">`
		+ `<button type="button" class="input-btn" data-action="image-file" title="Выбрать файл">${forms.icon('upload')}</button>`
		+ `<input type="file" accept="${Object.keys(IMAGE_TYPES).join(',')}" id="f-image-file" hidden></div>`
		+ `<p class="field__hint" id="f-image-pending" hidden></p>`
		+ `<p class="field__hint" id="f-image-loading" hidden>Загружаю картинку…</p><p class="form__error" id="f-image-error"></p>`
		+ (crop ? `<div class="crop" id="f-crop" hidden>`
			+ `<div class="crop__overview"><img class="crop__image" alt=""><div class="crop__window"><div class="crop__replica"><img alt=""></div></div></div>`
			+ `<div class="crop__zoom"><span class="crop__zoom-label">Масштаб</span><input type="range" class="range" min="1" max="4" step="0.01" value="1" aria-label="Масштаб"></div>`
			+ `<div class="crop__preview"></div></div>`
			+ hintHTML('Ссылка откуда угодно, файл, перетаскивание или Ctrl+V. Рамку двигайте мышью, колесо или ползунок — масштаб; ярко — то, что будет видно в попапе.')
			: `<img class="emblem-preview" id="f-emblem" alt="" hidden>`
			+ hintHTML('Ссылка откуда угодно, файл, перетаскивание или Ctrl+V.'))
		+ `</div>`;
}
// Новый источник: у локации — в обзор с рамкой, у фракции — в превью герба.
// Выбранный, но ещё не загруженный файл — подпись под полем.
function setImageSource(src) {
	const pending = edit.files.get(src);
	const note = document.getElementById('f-image-pending');
	note.hidden = !pending;
	note.textContent = pending ? `Файл «${pending.file.name}» загрузится в хранилище при сохранении` : '';
	if (edit.kind === 'marker') loadCropImage(src);
	else syncEmblem(src);
}
function syncEmblem(src) {
	const img = document.getElementById('f-emblem');
	const error = document.getElementById('f-image-error');
	error.textContent = '';
	img.hidden = true;
	img.onload = () => { img.hidden = false; };
	img.onerror = () => { if (src) error.textContent = 'Не удалось загрузить картинку по этой ссылке'; };
	if (src) img.src = src; else img.removeAttribute('src');
}
// Видимая область для записи: выбранная рамкой; если картинка та же, а
// обзор ещё не успел её загрузить, — прежняя; иначе — по умолчанию (null).
function imageViewFor(src) {
	if (!src) return null;
	if (edit.crop?.src === src) {
		const v = edit.crop.view, clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
		return { x: +clamp(v.x, 0, 1).toFixed(4), y: +clamp(v.y, 0, 1).toFixed(4), zoom: +clamp(v.zoom, 1, 4).toFixed(3) };
	}
	return src === edit.item.image ? edit.item.image_view ?? null : null;
}
// Ссылка для записи в базу: выбранный файл — загрузить в хранилище (один
// раз: при повторной попытке сохранить ссылка уже есть), иначе — как в поле.
async function uploadPendingImage(src, folder) {
	const pending = edit.files.get(src);
	if (!pending) return { url: src || null };
	if (pending.url) return { url: pending.url };
	const { file } = pending;
	const ext = IMAGE_TYPES[file.type];
	if (!ext) return { error: 'Хранилище принимает только PNG, JPEG, WebP, GIF и AVIF' };
	if (file.size > IMAGE_MAX_MB * 1024 * 1024) return { error: `Картинка больше ${IMAGE_MAX_MB} МБ — хранилище её не примет` };
	const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
	const bucket = supabaseClient.storage.from('images');
	const { error } = await bucket.upload(path, file, { contentType: file.type, cacheControl: '31536000' });
	if (error) return { error: `Не удалось загрузить картинку: ${error.message}` };
	pending.url = bucket.getPublicUrl(path).data.publicUrl;
	return { url: pending.url };
}
function loadCropImage(src, view) {
	const crop = document.getElementById('f-crop');
	const error = document.getElementById('f-image-error');
	const loading = document.getElementById('f-image-loading');
	error.textContent = '';
	loading.hidden = !src;
	if (!src) { edit.crop = null; crop.hidden = true; return; }
	const img = new Image();
	const current = () => edit?.kind === 'marker' && editForm.elements.image.value.trim() === src;
	img.onload = () => {
		if (!current()) return;
		loading.hidden = true;
		const keep = edit.crop?.src === src ? edit.crop.view : null;
		edit.crop = { src, a: img.naturalWidth / img.naturalHeight, view: { ...(keep ?? view ?? DEFAULT_IMAGE_VIEW) } };
		crop.querySelectorAll('img').forEach(i => { i.src = src; });
		crop.hidden = false;
		renderCrop();
	};
	img.onerror = () => {
		if (!current()) return;
		loading.hidden = true;
		edit.crop = null;
		crop.hidden = true;
		error.textContent = 'Не удалось загрузить картинку по этой ссылке';
	};
	img.src = src;
}
function useImageFile(file) {
	if (!file?.type.startsWith('image/')) return;
	const url = URL.createObjectURL(file);
	edit.files.set(url, { file });
	editForm.elements.image.value = url;
	setImageSource(url);
}
// Видимая часть картинки (в долях 0…1) для { x, y, zoom } — то же, что делают
// object-fit: cover + object-position + scale в .pop__bg img.
function cropRect(a, v) {
	const f = BG_W / BG_H;
	const w = Math.min(1, f / a) / v.zoom, h = Math.min(1, a / f) / v.zoom;
	return { left: v.x * (1 - w), top: v.y * (1 - h), w, h };
}
function setCropRect(left, top, w, h) {
	const v = edit.crop.view;
	left = Math.min(Math.max(left, 0), 1 - w);
	top = Math.min(Math.max(top, 0), 1 - h);
	if (w < 1 - 1e-6) v.x = left / (1 - w);
	if (h < 1 - 1e-6) v.y = top / (1 - h);
	renderCrop();
}
function setCropZoom(zoom) {
	const c = edit.crop;
	const r = cropRect(c.a, c.view);
	c.view.zoom = Math.min(4, Math.max(1, zoom));
	const n = cropRect(c.a, c.view);
	setCropRect(r.left + r.w / 2 - n.w / 2, r.top + r.h / 2 - n.h / 2, n.w, n.h); // центр рамки на месте
}
function renderCrop() {
	const c = edit.crop, crop = document.getElementById('f-crop');
	const ow = Math.min(CROP_MAX.w, CROP_MAX.h * c.a), oh = ow / c.a;
	const r = cropRect(c.a, c.view);
	Object.assign(crop.querySelector('.crop__overview').style, { width: `${ow}px`, height: `${oh}px` });
	Object.assign(crop.querySelector('.crop__window').style, { left: `${r.left * ow}px`, top: `${r.top * oh}px`, width: `${r.w * ow}px`, height: `${r.h * oh}px` });
	crop.querySelector('.crop__replica').style.cssText = `${imageViewStyle(c.view)}; transform: scale(${r.w * ow / BG_W})`;
	crop.querySelector('.range').value = c.view.zoom;
	renderCropPreview();
}
function renderCropPreview() {
	const box = document.querySelector('#f-crop .crop__preview');
	if (!box || !edit?.crop) return;
	const f = editForm.elements;
	box.innerHTML = locationPopupHTML({
		runame: f.runame.value.trim() || 'Новая локация',
		engname: f.engname.value.trim(),
		faction: f.faction.value.trim(),
		province: f.province.value.trim(),
		description: f.description.value.trim(),
		traits: selectedKeys('traits'),
		image: edit.crop.src,
		image_view: edit.crop.view,
	}, { preview: true });
}
// Тянуть рамку; клик мимо неё — перенести рамку туда и тянуть дальше.
editForm.addEventListener('pointerdown', e => {
	const overview = e.target.closest('.crop__overview');
	if (!overview || !edit?.crop || e.button !== 0) return;
	e.preventDefault();
	const ow = overview.clientWidth, oh = overview.clientHeight;
	if (!e.target.closest('.crop__window')) {
		const box = overview.getBoundingClientRect(), r = cropRect(edit.crop.a, edit.crop.view);
		setCropRect((e.clientX - box.left) / ow - r.w / 2, (e.clientY - box.top) / oh - r.h / 2, r.w, r.h);
	}
	const start = { x: e.clientX, y: e.clientY, r: cropRect(edit.crop.a, edit.crop.view) };
	overview.setPointerCapture(e.pointerId);
	const move = ev => setCropRect(start.r.left + (ev.clientX - start.x) / ow, start.r.top + (ev.clientY - start.y) / oh, start.r.w, start.r.h);
	const up = () => ['pointermove', 'pointerup', 'pointercancel'].forEach((t, i) => overview.removeEventListener(t, i ? up : move));
	overview.addEventListener('pointermove', move);
	overview.addEventListener('pointerup', up);
	overview.addEventListener('pointercancel', up);
});
editForm.addEventListener('wheel', e => {
	if (!edit?.crop || !e.target.closest('.crop__overview')) return;
	e.preventDefault();
	setCropZoom(edit.crop.view.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
}, { passive: false });
editForm.addEventListener('input', e => {
	if (e.target.matches('.range') && edit?.crop) setCropZoom(+e.target.value);
	if (['runame', 'engname', 'faction', 'province', 'description'].includes(e.target.name)) renderCropPreview();
});
editForm.addEventListener('change', e => {
	if (e.target.id === 'f-image') setImageSource(e.target.value.trim());
	if (e.target.id === 'f-image-file') { useImageFile(e.target.files[0]); e.target.value = ''; }
});
editForm.addEventListener('keydown', e => {
	if (e.key === 'Enter' && e.target.id === 'f-image') { e.preventDefault(); setImageSource(e.target.value.trim()); }
});
editForm.addEventListener('paste', e => {
	if (!e.target.closest?.('#f-image-field')) return;
	const file = [...e.clipboardData.files].find(f => f.type.startsWith('image/'));
	if (file) { e.preventDefault(); useImageFile(file); }
});
// Перетаскивание: файл с компьютера или картинка/ссылка из другой вкладки.
editForm.addEventListener('dragover', e => {
	const field = e.target.closest?.('#f-image-field');
	if (!field) return;
	e.preventDefault();
	field.classList.add('is-dropping');
});
editForm.addEventListener('dragleave', e => e.target.closest?.('#f-image-field')?.classList.remove('is-dropping'));
editForm.addEventListener('drop', e => {
	const field = e.target.closest?.('#f-image-field');
	if (!field) return;
	e.preventDefault();
	field.classList.remove('is-dropping');
	const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
	if (file) { useImageFile(file); return; }
	const url = (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')).split('\n')[0].trim();
	if (url) { editForm.elements.image.value = url; setImageSource(url); }
});

function editMarkerClicked(row) {
	if (edit.kind !== 'quest') return;
	editForm.elements.anchor_location.value = row.runame;
	setAnchor('location');
}
map.on('click', e => {
	if (!edit || state.measuring) return;
	if (edit.kind === 'marker') setDraft(e.latlng);
	if (edit.kind === 'quest') { setAnchor('point'); setDraft(e.latlng); }
});

// ─── Перетаскивание задания (как на прежнем сайте, админ) ─────────────────
// Тащат за правые 40px карточки задания (журнал, ветка, попап) — без ручки,
// курсор там «рука». Куда бросить:
//   • метка локации или её открытый попап — привязать к локации;
//   • провинция (когда видны провинции) / территория фракции (при отдалении)
//     или их открытый попап — привязать к ней;
//   • прочее место карты — своя точка; сайдбар — снять с карты (без места).
// Пока тащишь, цель подсвечена, у курсора — название и что произойдёт.
// Результат виден сразу, запись в базу — следом; не вышло — сообщение внизу
// карты, данные перечитываются (задание вернётся на прежнее место).
const DRAG_ZONE = 40;
let questDrag = null;

function resolveQuestDrop(x, y) {
	const sb = sidebarEl.getBoundingClientRect();
	if (!sidebarEl.classList.contains('is-collapsed') && x < sb.right) return { kind: 'unplaced', el: sidebarEl };
	const el = document.elementFromPoint(x, y);
	if (!el || !map.getContainer().contains(el)) return null;
	if (el.closest('.leaflet-popup')) return popupPlace ? { ...popupPlace } : null;
	const icon = el.closest('.leaflet-marker-icon');
	const id = icon && questDrag.iconToMarker.get(icon);
	if (id) return { kind: 'location', id, name: markerById.get(id)?.runame, el: icon };
	const latlng = map.mouseEventToLatLng({ clientX: x, clientY: y });
	if (map.hasLayer(provinceRegions)) {
		const name = detectProvinceAt(latlng.lat, latlng.lng);
		const pid = provinceMeta[name]?.id;
		if (pid) return { kind: 'province', id: pid, name, latlng, el: regionLayerById.get(String(pid))?.getElement() };
	} else if (map.hasLayer(factionRegions)) {
		const f = regionsFactions.features.find(r => r.properties.owner !== '' && pointInGeometry(latlng.lng, latlng.lat, r.geometry));
		if (f) return { kind: 'faction', id: f.properties.id, name: f.properties.name, latlng, el: regionLayerById.get(String(f.properties.id))?.getElement() };
	}
	return { kind: 'point', latlng };
}
const DROP_HINT = {
	location: d => `привязать к локации «${d.name}»`,
	province: d => `привязать к провинции «${d.name}»`,
	faction: d => `привязать к фракции «${d.name}»`,
	point: () => 'поставить своей точкой на карте',
	unplaced: () => 'снять с карты (без места)',
};
function questDragFrame() {
	const d = questDrag;
	d.raf = 0;
	d.drop = resolveQuestDrop(d.x, d.y);
	const target = d.drop?.el ?? null;
	if (target !== d.target) {
		d.target?.classList.remove('drop-target');
		target?.classList.add('drop-target');
		d.target = target;
	}
	d.ghost.style.transform = `translate3d(${d.x + 14}px, ${d.y + 12}px, 0)`;
	d.ghost.classList.toggle('is-valid', !!d.drop);
	d.hint.textContent = d.drop ? DROP_HINT[d.drop.kind](d.drop) : 'сюда нельзя';
	// своей точкой — иконка задания прямо под курсором, там, где оно встанет
	d.pin.hidden = d.drop?.kind !== 'point';
	d.pin.style.transform = `translate3d(${d.x - MARKER_SIZE.quest / 2}px, ${d.y - MARKER_SIZE.quest / 2}px, 0)`;
}
function onQuestDragMove(e) {
	const d = questDrag;
	if (!d.started) {
		if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 4) return;
		d.started = true;
		d.ghost = document.createElement('div');
		d.ghost.className = 'drag-ghost';
		d.ghost.innerHTML = `<img src="images/icons/quest.png" alt=""><span>${esc(d.quest.runame)}</span><span class="drag-ghost__hint"></span>`;
		d.hint = d.ghost.querySelector('.drag-ghost__hint');
		d.pin = Object.assign(document.createElement('img'), { className: 'drag-pin', src: markerIconUrl('quest'), alt: '', hidden: true });
		document.body.append(d.ghost, d.pin);
		document.body.classList.add('dragging');
	}
	d.x = e.clientX;
	d.y = e.clientY;
	if (!d.raf) d.raf = requestAnimationFrame(questDragFrame);
}
function onQuestDragEnd(e) {
	window.removeEventListener('pointermove', onQuestDragMove);
	window.removeEventListener('pointerup', onQuestDragEnd);
	window.removeEventListener('pointercancel', onQuestDragEnd);
	const d = questDrag;
	questDrag = null;
	if (!d.started) return;
	cancelAnimationFrame(d.raf);
	d.target?.classList.remove('drop-target');
	d.ghost.remove();
	d.pin.remove();
	document.body.classList.remove('dragging');
	if (e.type === 'pointerup') {
		questDrag = d; // resolveQuestDrop читает карту меток из questDrag
		const drop = resolveQuestDrop(e.clientX, e.clientY);
		questDrag = null;
		if (drop) applyQuestDrop(d.quest, drop);
	}
}
// Задания-точки видны только с включённым типом «Задания» (по умолчанию он
// выключен, как на прежнем сайте) — когда задание встаёт своей точкой
// (перетаскиванием или формой), тип включается, иначе его иконки не видно.
function showQuestPoints() {
	state.typesOn.add('quest');
}
// Привязать задание к месту, куда его бросили, и показать результат.
async function applyQuestDrop(q, drop) {
	const place = {
		anchor_kind: drop.kind,
		anchor_location_id: drop.kind === 'location' ? drop.id : null,
		anchor_province_id: drop.kind === 'province' ? drop.id : null,
		anchor_faction_id: drop.kind === 'faction' ? drop.id : null,
		lat: drop.kind === 'point' ? +drop.latlng.lat.toFixed(1) : null,
		lng: drop.kind === 'point' ? +drop.latlng.lng.toFixed(1) : null,
	};
	Object.assign(q, place);
	if (drop.kind === 'point') showQuestPoints();
	refreshAll();
	if (drop.kind === 'location') openLocationPopup(markerById.get(drop.id), { fly: false });
	else if (drop.kind === 'province' || drop.kind === 'faction') {
		const layer = regionLayerById.get(String(drop.id));
		if (layer) openRegionPopup(layer, drop.latlng ?? layer.getBounds().getCenter());
	} else openQuestPopup(q, { fly: false });
	const res = await runWrite(db('quests').update({ ...place, updated_at: now() }).eq('id', q.id));
	if (res.ok) return;
	showToast(`Не удалось привязать задание «${q.runame}»: ${res.message}`);
	map.closePopup();
	await load();
}
// Захват — на погружении: попапы Leaflet гасят всплытие нажатий.
document.addEventListener('pointerdown', e => {
	const card = e.target.closest('[data-drag-quest]');
	if (!card || e.button !== 0 || !state.isAdmin || edit || state.measuring) return;
	if (e.clientX < card.getBoundingClientRect().right - DRAG_ZONE) return;
	const quest = quests.find(x => x.id === card.dataset.dragQuest);
	if (!quest) return;
	e.preventDefault(); // без выделения текста
	const iconToMarker = new Map([...markerLayerById].filter(([, m]) => map.hasLayer(m)).map(([id, m]) => [m.getElement(), id]));
	questDrag = { quest, startX: e.clientX, startY: e.clientY, started: false, raf: 0, target: null, iconToMarker };
	window.addEventListener('pointermove', onQuestDragMove);
	window.addEventListener('pointerup', onQuestDragEnd);
	window.addEventListener('pointercancel', onQuestDragEnd);
}, true);

// ─── События ──────────────────────────────────────────────────────────────
function toggleInSet(set, key) { set.has(key) ? set.delete(key) : set.add(key); }

document.addEventListener('click', e => {
	const el = e.target.closest('[data-action]');
	if (!el) return;
	const { action, key, id } = el.dataset;
	switch (action) {
		case 'section': openSection(el.closest('.sb-section').dataset.section); break;
		case 'type': toggleInSet(state.typesOn, key); syncLocations(); updateMarkers(); break;
		case 'layer': state.layers[key] = !state.layers[key]; syncLayers(); updateLayers(); break;
		case 'status': state.status[key] = !state.status[key]; renderJournal(); break;
		case 'chain': switchChain(state.openChainId === id ? null : id); break;
		case 'chain-tab': state.chainTab[id] = key; delete state.chainQuest[id]; refreshChainBody(id); break;
		case 'chain-quest': state.chainQuest[id] = key; refreshChainBody(id); break;
		case 'faction':
			state.openFactionId = state.openFactionId === id ? null : id;
			document.querySelectorAll('.faction').forEach(f => f.classList.toggle('is-open', f.dataset.faction === state.openFactionId));
			break;
		case 'province': toggleInSet(state.openProvinces, key); {
			const p = el.closest('.province'), open = state.openProvinces.has(key);
			p.classList.toggle('is-open', open); el.classList.toggle('is-open', open);
		} break;
		case 'open-location': { const row = markerById.get(id); if (row) openLocationPopup(row); } break;
		case 'open-quest': { const q = quests.find(x => x.id === id); if (q) openQuestPopup(q); } break;
		case 'open-province':
			state.openProvinces.add(key ?? id); revealSection('provinces'); renderProvinces();
			sectionEls.provinces.querySelector(`[data-province="${CSS.escape(key ?? id)}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
			break;
		case 'open-chain': {
			const q = quests.find(x => x.id === id);
			if (!q?.branch_id) break;
			if (chainGroups(chainMembers(q.branch_id)).size >= 2) state.chainTab[q.branch_id] = branchGroupKey(q);
			state.chainQuest[q.branch_id] = q.id;
			refreshChainBody(q.branch_id);
			// Если журнал был свёрнут — ветка раскрывается, когда он раскрылся:
			// прокрутка считается по его итоговой высоте.
			const journalWasOpen = state.openSection === 'journal';
			revealSection('journal');
			setTimeout(() => switchChain(q.branch_id), journalWasOpen ? 0 : animDuration() * 1000 + 30);
		} break;
		case 'f-type': toggleInSet(state.search.types, key); syncSearchFilters(); renderFiltered(); break;
		case 'f-trait': toggleInSet(state.search.traits, key); syncSearchFilters(); renderFiltered(); break;
		case 'f-char': toggleInSet(state.search.chars, key); syncSearchFilters(); renderFiltered(); break;
		case 'f-mode': state.search.modes[el.dataset.group] = key; syncSearchFilters(); renderFiltered(); break;
		case 'f-reset': state.search[key].clear(); syncSearchFilters(); renderFiltered(); break;
		case 'ref': {
			const { refType, refId } = el.dataset;
			if (refType === 'loc') { const row = markerById.get(refId); if (row) openLocationPopup(row); }
			else focusRegion(refId);
		} break;
		case 'focus-region': focusRegion(id); break;
		// ─── админка (см. «Админка: формы правки») ───
		case 'new-marker': openEditor('marker'); break;
		case 'new-quest': {
			const [kind, anchorId] = (key || '').split(':');
			openEditor('quest', null, kind === 'location' ? { anchorKind: 'location', anchorLocationId: anchorId }
				: kind === 'province' ? { anchorKind: 'province', anchorProvinceId: anchorId }
				: kind === 'faction' ? { anchorKind: 'faction', anchorFactionId: anchorId } : {});
		} break;
		case 'new-faction': openEditor('faction'); break;
		case 'edit-marker': openEditor('marker', id); break;
		case 'edit-quest': openEditor('quest', id); break;
		case 'edit-faction': openEditor('faction', id); break;
		case 'edit-back': if (!edit?.busy) closeEditor(); break;
		case 'edit-revert': openRevertDialog(); break;
		case 'branch-dialog': openBranchDialog(); break;
		case 'edit-delete': removeEdited(); break;
		case 'edit-toggle': toggleEditButton(el); break;
		case 'chip-add': addSystemTrait(); break;
		case 'image-file': document.getElementById('f-image-file').click(); break;
		case 'chip-remove': edit.systemTraits.splice(+key, 1); renderSystemTraits(); break;
	}
});

// ПКМ по типу локации — «соло», повторный ПКМ — снова все (как на сайте)
document.addEventListener('contextmenu', e => {
	const el = e.target.closest('[data-action="type"]');
	if (!el) return;
	e.preventDefault();
	const solo = state.typesOn.size === 1 && state.typesOn.has(el.dataset.key);
	state.typesOn = solo ? new Set(LOCATION_TYPES.map(t => t.key)) : new Set([el.dataset.key]);
	syncLocations();
	updateMarkers();
});

// Поиск: поле внизу, фильтры раскрываются над ним оверлеем; пока они
// открыты, остальной сайдбар затемнён и неактивен (клик по нему закрывает).
const searchEl = document.getElementById('search');
const searchInput = document.getElementById('search-input');
function setSearchOpen(open) {
	searchEl.classList.toggle('is-open', open);
	sidebarEl.classList.toggle('is-searching', open);
}
searchInput.addEventListener('focus', () => setSearchOpen(true));
searchInput.addEventListener('input', () => { state.search.query = makeQuery(searchInput.value); renderFiltered(); });
document.addEventListener('pointerdown', e => {
	if (!searchEl.contains(e.target)) setSearchOpen(false);
});
// Крестик — очистить поиск: текст и выбранные фильтры (режимы «или/и/искл.»
// остаются). Виден, пока поиск открыт или в нём что-то задано.
const searchClear = document.getElementById('search-clear');
searchClear.addEventListener('mousedown', e => e.preventDefault()); // фокус остаётся в поле
searchClear.addEventListener('click', () => {
	searchInput.value = '';
	state.search.query = null;
	['types', 'traits', 'chars'].forEach(k => state.search[k].clear());
	syncSearchFilters();
	renderFiltered();
});

// Сворачивание сайдбара
document.getElementById('collapse').addEventListener('click', e => {
	const collapsed = sidebarEl.classList.toggle('is-collapsed');
	e.currentTarget.title = collapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар';
});

// Кнопки карты: «крест» навигации.
const sysButton = (name, title) => `<button type="button" class="sys-btn sys-btn--${name}" title="${title}" data-map="${name}"><img src="images/ui/sys/${name}.svg" alt=""></button>`;
const navEl = document.getElementById('map-nav');
navEl.innerHTML = sysButton('plus', 'Приблизить') + sysButton('minus', 'Отдалить') + sysButton('fit', 'Показать всю карту') + sysButton('measure', 'Измерить расстояние (клик — точка, двойной клик или Esc — закончить)');
navEl.addEventListener('click', e => {
	const btn = e.target.closest('[data-map]');
	if (!btn) return;
	const act = btn.dataset.map;
	if (act === 'plus') map.zoomIn();
	if (act === 'minus') map.zoomOut();
	if (act === 'fit') map.fitBounds(bounds);
	if (act === 'measure') setMeasuring(!state.measuring);
});

// ─── Линейка (как на прежнем сайте) ───────────────────────────────────────
// Клик — точка, у каждого отрезка — его длина, у последней точки — сумма,
// у курсора — сумма с текущим хвостом. Двойной клик или Esc — закончить.
// Пока линейка включена, клики по меткам и регионам уходят карте.
map.createPane('measurePane');
map.getPane('measurePane').style.zIndex = 710; // выше попапов (700)
map.getPane('measurePane').style.pointerEvents = 'none';
const KM_PER_UNIT = 2.8; // 1 единица карты — 2.8 км (как на сайте)
const measure = { points: [], layers: [], total: 0, rubber: null, cursor: null, sum: null };
const distKm = (a, b) => Math.hypot(b.lng - a.lng, b.lat - a.lat) * KM_PER_UNIT;
const measureIcon = (text, mod = '', anchor = [-6, 10]) =>
	L.divIcon({ className: `measure-label${mod ? ` measure-label--${mod}` : ''}`, html: `<span>${text}</span>`, iconSize: null, iconAnchor: anchor });
const measureMarker = (latlng, icon) => L.marker(latlng, { icon, interactive: false, pane: 'measurePane' }).addTo(map);
const stopMeasuring = () => setMeasuring(false);
function setMeasuring(on) {
	if (state.measuring === on) return;
	state.measuring = on;
	navEl.querySelector('[data-map="measure"]').classList.toggle('selected', on);
	map.getContainer().classList.toggle('measuring', on);
	map.doubleClickZoom[on ? 'disable' : 'enable']();
	map[on ? 'on' : 'off']({ click: onMeasureClick, mousemove: onMeasureMove, dblclick: stopMeasuring });
	if (on) { map.closePopup(); return; }
	[...measure.layers, measure.rubber, measure.cursor, measure.sum].forEach(l => l?.remove());
	Object.assign(measure, { points: [], layers: [], total: 0, rubber: null, cursor: null, sum: null });
}
function onMeasureClick(e) {
	if (e.originalEvent.detail > 1) return; // второй клик двойного — это «закончить»
	const ll = e.latlng, last = measure.points.at(-1);
	if (last) {
		const d = distKm(last, ll);
		measure.total += d;
		measure.rubber?.remove();
		measure.rubber = null;
		measure.layers.push(L.polyline([last, ll], { className: 'measure-line', weight: 2, pane: 'measurePane' }).addTo(map));
		measure.layers.push(measureMarker([(last.lat + ll.lat) / 2, (last.lng + ll.lng) / 2], measureIcon(`${Math.round(d)} км`)));
	}
	measure.points.push(ll);
	measure.layers.push(L.circleMarker(ll, { className: 'measure-dot', radius: 4, weight: 2, fillOpacity: 1, pane: 'measurePane' }).addTo(map));
	measure.sum?.remove();
	measure.sum = measure.total ? measureMarker(ll, measureIcon(`${Math.round(measure.total)} км`, 'total', [-6, -4])) : null;
}
function onMeasureMove(e) {
	const last = measure.points.at(-1);
	if (!last) return;
	if (measure.rubber) measure.rubber.setLatLngs([last, e.latlng]);
	else measure.rubber = L.polyline([last, e.latlng], { className: 'measure-line measure-line--rubber', weight: 1.5, dashArray: '7 5', pane: 'measurePane' }).addTo(map);
	const icon = measureIcon(`${Math.round(measure.total + distKm(last, e.latlng))} км`, 'cursor', [-10, 20]);
	if (measure.cursor) measure.cursor.setLatLng(e.latlng).setIcon(icon);
	else measure.cursor = measureMarker(e.latlng, icon);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.measuring) setMeasuring(false); });

// ─── Вход (админ) ─────────────────────────────────────────────────────────
// Админ — любой вошедший (так же устроены правила доступа в базе). Слухи база
// отдаёт только вошедшему, поэтому при входе и выходе данные перечитываются.
const loginBtn = document.getElementById('login');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
function setLoginOpen(open) {
	loginForm.hidden = !open;
	loginBtn.classList.toggle('selected', open);
	loginError.textContent = '';
	if (open) loginForm.elements.email.focus();
}
function applyAdmin(admin) {
	state.isAdmin = admin;
	const name = admin ? 'logout' : 'login';
	loginBtn.className = `sys-btn sys-btn--${name} map-login`;
	loginBtn.title = admin ? 'Выйти' : 'Войти';
	loginBtn.querySelector('img').src = `images/ui/sys/${name}.svg`;
	if (!admin) closeEditor();
	map.closePopup();
}
loginBtn.addEventListener('click', () => {
	if (state.isAdmin) supabaseClient.auth.signOut(); // дальше — onAuthStateChange
	else setLoginOpen(loginForm.hidden);
});
loginForm.addEventListener('submit', async e => {
	e.preventDefault();
	loginError.textContent = '';
	const { email, password } = loginForm.elements;
	const { error } = await supabaseClient.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
	if (error) { loginError.textContent = 'Неверная почта или пароль'; return; }
	loginForm.reset();
	setLoginOpen(false);
});
document.addEventListener('pointerdown', e => {
	if (!loginForm.hidden && !loginForm.contains(e.target) && !loginBtn.contains(e.target)) setLoginOpen(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !loginForm.hidden) setLoginOpen(false); });
// Первое событие приходит сразу с текущей сессией — по нему и первая загрузка.
// Внутри обработчика к базе не обращаемся (Supabase советует не делать этого) —
// загрузка отложена на тик.
let authKnown = false;
supabaseClient.auth.onAuthStateChange((_event, session) => {
	const admin = !!session;
	if (authKnown && admin === state.isAdmin) return;
	authKnown = true;
	applyAdmin(admin);
	setTimeout(load, 0);
});

// ─── Загрузка данных ──────────────────────────────────────────────────────
function indexData() {
	[markerById, branchById, questsByBranch, questsByLocation].forEach(m => m.clear());
	markers.forEach(r => markerById.set(r.id, r));
	branches.forEach(r => branchById.set(r.id, r));
	quests.forEach(r => {
		if (r.branch_id) pushTo(questsByBranch, r.branch_id, r);
		if (r.anchor_kind === 'location' && r.anchor_location_id) pushTo(questsByLocation, r.anchor_location_id, r);
	});
}
async function load() {
	const [m, q, b, f] = await Promise.all([
		supabaseClient.from('markers').select('*').order('runame'),
		supabaseClient.from('quests').select('*').order('runame'),
		supabaseClient.from('quest_branches').select('*').order('runame'),
		supabaseClient.from('factions').select('*'),
	]);
	for (const r of [m, q, b, f]) if (r.error) console.error(r.error);
	markers = m.data || [];
	quests = q.data || [];
	quests.forEach(x => { if (x.status === 'active') x.status = 'known'; }); // «Активно» упразднён
	branches = b.data || [];
	factions = f.data || [];
	refreshAll();
}
renderAll();
// Если сессия так и не пришла (сбой сети при старте) — всё равно загрузить.
setTimeout(() => { if (!authKnown) { authKnown = true; load(); } }, 3000);
