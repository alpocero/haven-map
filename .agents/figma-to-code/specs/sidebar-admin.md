# Sidebar — Карта Хейвена (admin) — Haven Map

## Origem
- Figma URL: https://www.figma.com/design/zWQx9Uuc8iXuFywJ4d6TDG/haven-map-WIP?node-id=254-1525&m=dev
- Fonte: Figma MCP (servidor oficial remoto `671e6534-…`)
- Tools: `get_metadata` + `get_screenshot` + `get_variable_defs` + `get_design_context`
- File key: `zWQx9Uuc8iXuFywJ4d6TDG`
- Node ID: `254-1525` (API: `254:1525`)
- Página: `haven-map WIP`
- Frame: `Sidebar — Карта Хейвена (admin)` (`254:1525`, 320 × 945)
- Data da análise: 2026-09-08

> **Escopo:** o sidebar admin (`#normal-view`). Já estava ~90 % implementado no working tree
> (bloco «РЕСКИН — Figma node 254:1525» em `style.css` + markup/JS + assets `images/ui/`).
> Esta passada fecha 2 lacunas residuais no **Журнал заданий**. Fora de escopo: as views
> `#edit-marker-view` / `#edit-quest-view`, os popups de localização/província, a carta Leaflet.

## Resumo

O frame é a variante admin do sidebar do mapa de Haven (fantasia dark, dourado/pergaminho).
Seções, de cima para baixo: cabeçalho (título + toggle), divisória, **Локации** (linha de
ícones-filtro), **Слои карты** (checkboxes), busca, **Журнал заданий** (chips de status +
lista de quests com scrollbar), **Провинции** (painel de filtros + árvore com scrollbar).

Layout, ritmo de espaçamento, escala tipográfica (El Messiri / Beaufort for LOL), cores
(tokens `--ink/--parch/--brass`), divisória, árvore de províncias, painel de filtros e
scrollbars **já batem com o macket**. As duas lacunas fechadas agora são de material/asset
no journal, não de layout.

## Descrição das telas / estados

### Журнал заданий — linha de quest (`journal-row`)
Grid `[ромб] [título 14/500] [grip]` / `[локация 12, pl 16]`, row-gap 4, entre linhas 16.

- **Ромб de status** (`quest__status`, node 10 px): losango com **gradiente por status +
  inner-glow + grão**, um SVG por status:
  - `rumor`  — `#282726 → #3E3C3A`
  - `known`  — `#3E3C3A → #6A655D`
  - `active` — `#96763E → #C9A24D` (brass, mais claro)
  - `done`   — `#4D3C1A → #7A5F2A`
- **Grip de arraste** (`quest-drag`, só admin): 6 plaquinhas 2 × 3, gradiente
  `#3E3C3A → #6A655D` + inner-glow + grão. Asset 8.5 × 12.
- **Título**: Beaufort 14, `known` regular / `active` medium / `done` line-through, cor
  = `s.ink` do status.
- **Sub-linha локация**: Beaufort 12, `--ink-500`, `padding-left: 16`.

### Чипы статусов (`#quest-status-chips`)
Pílulas de texto `.icon-toggle--text` com o efeito `element-effect__16--hover` (grad + grão
+ linha dourada) crescendo do cursor. Selecionado → texto `--brass-300`, efeito em `scaleX(1)`.
`Слух` só aparece para admin. **Já implementado** (helper `iconToggleTextHTML`).

## Tokens

| Figma (variável) | Valor | No projeto |
| --- | --- | --- |
| `ink-600` | `#3e3c3a` | `--ink-600` (`style.css` :root РЕСКИН) |
| `ink-500` | `#6a655d` | `--ink-500` |
| `ink-700` | `#282726` | inline `#282726` (rail, track) |
| `parch-200` | `#cfc7b8` | `--parch-200` |
| `parch-400` | `#9a9285` | `--parch-400` |
| `brass-300` | `#e6cf95` | `--brass-300` |
| `brass-{500,600,700,800}` | `#c9a24d / #96763e / #7a5f2a / #4d3c1a` | inline nos gradientes dos SVG `quest-status-*` / `quest-drag` |
| `sidebar-fill` | `#030303` | fundo do `#sidebar` (já aplicado) |

Nenhum token novo. Nenhum componente novo.

## Componentes / assets

| Elemento | Situação |
| --- | --- |
| Ромб de status no journal | **Trocado** de `<span>` plano inline para `images/ui/quest-status-{rumor,known,active,done}.svg` via classe `quest-sq--<status>` (assets já existiam, não estavam ligados) |
| Grip `quest-drag` | **Trocado** de glifo inline `QUEST_GRIP_SVG` (6 círculos, currentColor) para `<img src="images/ui/quest-drag.svg">` (asset já existia) |
| Chips de status / `Кровь Иши` glow | Já OK — `icon-toggle__fx` (grad/noise/line). Sem mudança. |
| Ромб nos popups de localização/província | **Intocado** — regras novas escopadas em `#quest-journal-list`; popups seguem com o quadradinho `rotate(45deg)` inline. |

## Plano de implementação (executado)

Arquivos alterados (todos já no escopo do rescin):

1. `script.js`
   - `QUEST_GRIP_SVG` → `<img src="images/ui/quest-drag.svg" width="8.5" height="12">`
   - `questJournalRowHTML()` → `<span class="quest-sq quest-sq--${statusKey}">` sem `style` inline
2. `style.css` (bloco РЕСКИН)
   - `#quest-journal-list .quest-sq` → 10 × 10, `transform: none`, `background: center/100% 100%`;
     4 modificadores `.quest-sq--<status>` com o SVG correspondente
   - `.quest-drag img { display:block }` + `.quest-drag:hover img { filter: brightness(1.35) }`
3. `index.html` — cache-bust `?dev=36` → `?dev=37` em `style.css` e `script.js`

Estados cobertos: `rumor` / `known` / `active` / `done`; journal admin (com grip) e não-admin
(sem grip). Verificação: `py -m http.server 8791`, sem erros no console; screenshot do journal
comparado ao render do Figma.

Riscos: `quest-drag.svg` tem gradiente fixo (não `currentColor`) — o hover de cor virou
`filter: brightness`. Estado admin real (login Supabase) não pôde ser exercido pelo agente;
o caminho do grip foi validado forçando `isAdmin=true` no console.
