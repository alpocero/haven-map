# Попапы информации о заданиях (локация / задание / ветка) — Haven Map

## Origem
- Figma URLs:
  - https://www.figma.com/design/zWQx9Uuc8iXuFywJ4d6TDG/haven-map-WIP?node-id=282-540&m=dev (попап локации)
  - https://www.figma.com/design/zWQx9Uuc8iXuFywJ4d6TDG/haven-map-WIP?node-id=401-456&m=dev (карточка задания)
  - https://www.figma.com/design/zWQx9Uuc8iXuFywJ4d6TDG/haven-map-WIP?node-id=404-593&m=dev (карточка ветки заданий)
- Источник: Figma MCP (официальный удалённый сервер `671e6534-…`), skill `figma-design-to-code`
- Tools: `get_design_context` на все три ноды (полный React/Tailwind reference + hints)
- File key: `zWQx9Uuc8iXuFywJ4d6TDG`
- Node IDs: `282:540` (`data-name="popup"`), `401:456` (`data-name="popup/quest"`), `404:593` (`data-name="popup/quest-branch"`)
- Страница: `haven-map WIP`
- Дата анализа: 2026-09-12

> **Примечание по проверке:** Figma MCP-коннектор на момент реализации требовал повторной
> авторизации (недоступна в неинтерактивной сессии), поэтому финальная сверка шла по уже
> прочитанному в этой же сессии `get_design_context`-выводу (React/Tailwind referen-код всех
> трёх нод, разобранный до начала реализации), а не повторным свежим fetch'ем. Скриншоты
> макета отдельно не сохранялись — сверка велась по структуре/классам reference-кода.

> **Скоуп:** три плавающих/встроенных попапа с информацией о заданиях — блок «Задания» внутри
> попапа локации/провинции (`buildPopupHTML`/`buildRegionPopupHTML` → `questBlockInnerHTML`),
> плавающая карточка задания (`#quest-card` / `openQuestCard`) и плавающая карточка ветки
> заданий (`#branch-card` / `openBranchCard`). Вне скоупа: сама карта, сайдбар (`#normal-view`,
> уже покрыт `sidebar-admin.md`), формы редактирования маркера/задания/фракции.

## Resumo

Три экрана объединены общим паттерном из макета: **info-grid** — сетка «метка капсом сверху /
значение снизу» в 2 колонки — заменяет прежние построчные текстовые подписи (`Фракция: X`,
`Привязка: в локации Y`). Второй общий паттерн — строка задания в списке (шапка со статусом +
название, под ней цель и ссылка на ветку) теперь **всегда развёрнута** и её яркость зависит от
группы статуса (слух/завершено — тусклая, известно/активно — светлая), а не от того, активно ли
конкретно это задание.

Разрешение — то же, что у остального проекта (десктоп, сайдбар фиксированной ширины, попапы —
плавающие абсолютно спозиционированные блоки поверх карты Leaflet).

## Descrição das Telas

### Попап локации/провинции — блок «Задания» (node `282:540`)
- Info-grid `Фракция` / `Провинция` теперь стоит сразу после заголовка (до этого — в подвале,
  после всех секций, построчным текстом с двоеточием).
- Каждая строка задания в блоке «Задания» разворачивается целиком (шапка + `short_description`
  + `В ветке заданий: <ссылка>`), а не только строка со статусом `active` — макет показывает оба
  примера («Известно»/светлая и «Слух»/«Завершено»/тусклая) полностью развёрнутыми.
- Яркость строки — по группе статуса, как у `.journal-row-title--dim/--bright` в сайдбаре:
  `слух`/`завершено`(+`провалено`) → тусклая пара (rest `ink-500`, hover `parch-400`);
  `известно`/`активно` → светлая пара (rest `parch-400`, hover `parch-200`).

### Карточка задания — `#quest-card` (node `401:456`, `popup/quest`)
- Заголовок: название + маленькая иконка статуса (12×12, тот же SVG-набор `quest-status-*.svg`,
  что и ромб в журнале/попапах) вплотную к названию — вместо прежней текстовой строки статуса в
  подвале карточки.
- Info-grid `Локация` (или `Провинция`, в зависимости от `anchor_kind`) / `Ветка заданий` —
  вместо прежнего единственного блока «Привязка» с текстом вида «в локации: X».
- «Редактировать» (только админ) — отдельной строкой в подвале, без соседнего текста статуса
  (он теперь в заголовке).

### Карточка ветки заданий — `#branch-card` (node `404:593`, `popup/quest-branch`)
- Заголовок: название ветки слева + счётчик `выполнено/всего` справа (`justify-between`) — тот
  же счётчик, что уже был у строки ветки в сайдбар-журнале, здесь отсутствовал вовсе.
- Список участников — **не** компактная журнальная строка (диамант + название + якорь), а те же
  «попаповые» строки, что в блоке «Задания» попапа локации (шапка/цель/ветка, always-expanded,
  dim/bright) — в макете список веток использует ровно ту же структуру `quest-header` /
  `quest-description` / `quest-line`, что и попап локации.
- «Или»-коннекторы между заданиями одного шага из разных `branch_or_group` — без изменений
  (реализовано в прошлой сессии, `branchGroupKey`/`branchMembersRowsHTML`).

## Tokens

Новых токенов не потребовалось — макет использует существующий набор `--ink-500`, `--parch-200`,
`--parch-400`, `--brass-600`, уже заведённый в блоке `:root` `style.css` (см. `sidebar-admin.md` /
запрос пользователя «Введи уже variables для цветов» из этой же сессии).

| Figma | Значение | В проекте |
| --- | --- | --- |
| `ink-500` | `#6a655d` | `--ink-500` |
| `parch-400` | `#9a9285` | `--parch-400` |
| `parch-200` | `#cfc7b8` | `--parch-200` |
| `brass-600` | `#96763e` | `--brass-600` (значение ссылки `a.desc-link`, не меняли) |

## Componentes

| Элемент | Ситуация |
| --- | --- |
| Info-grid (метка/значение, 2 колонки) | **Новый** переиспользуемый паттерн: `popupInfoGridHTML(items)` (`script.js`) + `.popup-info-grid/-item/-label/-val` (`style.css`). Используется в `buildPopupHTML` (Фракция/Провинция) и `openQuestCard` (Локация или Провинция / Ветка заданий) |
| Строка задания в попапе (шапка+цель+ветка) | **Расширен существующий**: `questPopupRowHTML(q)` — выделен из `questBlockInnerHTML` в отдельную функцию, чтобы переиспользовать в `openBranchCard` (список участников ветки) без дублирования разметки |
| Иконка статуса у заголовка карточки задания | Переиспользован существующий набор `images/ui/quest-status-*.svg` (уже был у `.popup-quest-title .quest-sq` / `#quest-journal-list .quest-sq`), просто новый CSS-контекст `.quest-card-title-row .quest-sq` (12×12) |
| Счётчик «выполнено/всего» у `#branch-card` | Переиспользована логика подсчёта из `questBranchGroupHTML` (сайдбар), новый элемент `.quest-card-branch-count` — стилистически идентичен `.journal-branch-count` |
| `branchMembersRowsHTML` | Расширен необязательным параметром `rowRenderer` (по умолчанию `questJournalRowHTML`, для сайдбара), чтобы `#branch-card` мог передать `questPopupRowHTML` — сайдбарный инлайн-список ветки (в журнале) визуально не тронут |
| `.popup-footer*` / `.quest-card-anchor*` / `.quest-card-status` | **Удалены** (мёртвый код после замены на info-grid) |

Новых компонентов дизайн-системы (в смысле конвенций проекта — класс + HTML-хелпер) не заводили
сверх info-grid и `questPopupRowHTML`, оба — обобщение уже существовавших паттернов, не новая
визуальная концепция.

## Plano de implementação (executado)

Файлы (оба уже были в скоупе, `index.html` не менялся — по её же правилу не трогать
кэш-бастинг/файл руками, см. память проекта):

1. `script.js`
   - `questAnchorLabel` → `questAnchorInfoItem` (возвращает `{label, valueHTML}` вместо строки)
   - Новый `popupInfoGridHTML(items)`
   - `buildPopupHTML`: `footerItem`/`footerHTML` → `infoItem`/`popupInfoGridHTML`, секция
     перенесена сразу после `title-row`
   - Выделен `questPopupRowHTML(q)` из `questBlockInnerHTML`; строки теперь always-expanded с
     `popup-quest-row--dim/--bright` вместо `popup-quest-title--active`
   - `branchMembersRowsHTML(members, rowRenderer = questJournalRowHTML)` — добавлен параметр
   - `openQuestCard` — иконка статуса в заголовке, info-grid вместо `.quest-card-anchor`
   - `openBranchCard` — счётчик в заголовке, `branchMembersRowsHTML(all, questPopupRowHTML)`
2. `style.css`
   - `.popup-footer*` → `.popup-info-grid/-item/-label/-val`
   - `.popup-quest-title--active` → `.popup-quest-row--dim/--bright` (title/name/goal/branch-label)
   - `.quest-card-anchor*`, `.quest-card-status` удалены; добавлены `.quest-card-title-row(--branch)`,
     `.quest-card-branch-count`, `.quest-card-title-row .quest-sq*`
   - Точечный фикс специфичности: `#branch-card .quest-sq` (id, журнальный ромб 254:1525) иначе
     перебивал бы вложенный `.popup-quest-title .quest-sq` внутри `#branch-card` — добавлено
     `#branch-card .popup-quest-title .quest-sq { margin:0 }`

Проверено вживую (`py -m http.server`, свежий порт, реальные данные — ветка «Исцеление [Грива]»,
задание «Пройти Золотую Башню», done-пример «Дым над границей»): info-grid обеих карточек,
dim/bright классы и цвета (computed style), счётчик ветки, статус-иконка, admin-only
«Редактировать». Инлайн-список ветки в сайдбар-журнале — не тронут (по-прежнему `.journal-row`).

Риски / деградации: реальный вход админа через Supabase агенту недоступен — admin-only ветки
(кнопка «Редактировать», drag-хендлы, «+» добавления задания) проверены форсированием
`isAdmin = true` в консоли, как и в `sidebar-admin.md`.

## Доп. проход: размеры/шрифты/рамка (2026-09-12, по запросу пользователя)

После первой реализации пользователь указала на расхождения с макетом: размер обычного попапа не
совпадал с фреймом Figma, а `#quest-card`/`#branch-card` были у́же обычного попапа, с другими
шрифтами и плоской рамкой вместо оверлейной. Перечитала все три ноды через `get_metadata` +
`get_design_context` (коннектор к этому моменту снова авторизовался) — обнаружено:

- Фрейм `popup` (282:540) на самом деле **350px** шириной (19px padding × 2 + 312px контент), а не
  342px, как было закодировано раньше (похоже, устаревшее/ошибочное измерение из более старой
  версии макета). `popup/quest` (401:456) и `popup/quest-branch` (404:593) — **тот же фрейм 350px**
  и **тот же контейнер** (`px-[18px] py-[20px]`, фон `rgba(3,3,3,.83)`, `blur(15px)`,
  `shadow 0 0 6px 3px rgba(0,0,0,.5)`, `border-solid border-white`) — то есть по макету все три
  попапа УЖЕ должны быть идентичны по размеру/стеклу/рамке, это не два разных стиля.
- `.description`/`.name-eng` в `style.css` были заскоуплены как `.popup-content .description` —
  когда в прошлый проход в `#quest-card`/`#branch-card` навесили те же классы, они физически не
  подхватывали стили (селектор не совпадал), поэтому шрифты молча расходились с обычным попапом.
- Счётчик ветки (`progress` в 404:593) — на самом деле двухцветный: число выполненных 16px bold
  brass-500 (`#c9a24d`), «/всего» 12px regular parch-400 — не единый 12px brass-600, как было.

### Изменения
1. `style.css`
   - `.popup-content { width: 342px }` → `314px` (350 − 18×2)
   - `.popup-content .name-eng` / `.description` (+`p`/`:last-child`) — селекторы расширены на
     `#quest-card`, `#branch-card`
   - `#quest-card, #branch-card` — контейнер переписан 1:1 под `.leaflet-popup-content-wrapper`:
     `width: 350px`, `background: rgba(3,3,3,.83)`, `backdrop-filter: blur(15px)`,
     `box-shadow: 0 0 6px 3px rgba(0,0,0,.5)`, `padding: 20px 18px`; вместо плоского
     `border: 1px solid #EFE7D6` — тот же приём `::before` + `mix-blend-mode: overlay`, что у
     `.leaflet-popup-content-wrapper::before`
   - Скролл перенесён с самого бокса на `#quest-card-inner`/`#branch-card-inner` (`overflow-y:auto`,
     `min-height:0`, `gap:8px` как у `.popup-text`) — иначе рамка (`::before`) уезжала бы вместе с
     прокруткой контента
   - `.quest-card-head h3` — вес 500 (Medium) + `mix-blend-mode: screen`, как `.popup-content h1`
     (было 600 без blend)
   - `.quest-card-branch-count` — переписан на два тона (число `16px/700/#c9a24d` + вложенный
     `.quest-card-branch-total` `12px/400/parch-400`)
   - Удалены `.quest-card-eng`, `.quest-card-divider`, `.quest-card-desc`, `.branch-card-list` —
     разметка теперь переиспользует `.name-eng`, `.popup-divider`, `.description`,
     `.popup-quests-list` напрямую, дублирования стилей больше нет
2. `script.js`
   - `POPUP_DEFAULT_WIDTH` 342 → 314 (синхронно с `.popup-content{width}`)
   - `openQuestCard`/`openBranchCard` переписаны на тот же паттерн `sections.filter(Boolean).join(
     '<div class="popup-divider"></div>')`, что в `buildPopupHTML`, вместо ручных `<div
     class="quest-card-divider">` — дивайдеры больше не дублируют логику и не рискуют разъехаться

Проверено вживую: `getBoundingClientRect().width` попапа локации и обеих карточек — везде 350px;
`getComputedStyle` подтвердил фон/блюр/тень/цвет рамки (`rgba(239,231,214,.4)` + `overlay`) и
типографику (`14px/0.28px` описание, `16px/700/#c9a24d` + `12px/400/#9a9285` счётчик) 1:1 с
макетом. Отдельно проверено на карточке ветки со сжатым вьюпортом (800×350, вынужденный внутренний
скролл): рамка остаётся на месте бокса, крутится только содержимое `-inner`.
