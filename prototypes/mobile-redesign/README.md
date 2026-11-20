# Prototype: Mobile Redesign (Topic Selector, Study Session, Annotated Output)

- **Screen Slug:** `mobile-redesign`
- **Target Routes:** `/` (topic selector) and `/?topics=…` (study session: Treino, Casos de uso, Saída anotada)
- **Status:** APPROVED
- **Approved By:** Doretto
- **Approval Date:** 2026-11-20
- **Design Canvas:** Claude Design artifact "NetDrill Mobile" (private to the owner); artboard sources versioned in [`canvas/`](canvas/)
- **Implementation Captures:** [`index.html`](index.html) (screenshots in [`screens/`](screens/))

## Approval Audit Log
| Date | Feedback | Outcome |
|------|----------|---------|
| 2026-11-20 | "a versão mobile deste app está péssima" | Four-screen mobile canvas proposed |
| 2026-11-20 | Command often does not fit the input; iPhone zooms on focus | Single-line input replaced by auto-growing, word-wrapping textarea; zoom root cause identified |
| 2026-11-20 | Excess spacing on screen 4 | Paused banner removed, inspector moved inline under the output, spacing tightened |
| 2026-11-20 | Word wrap must be optional | "Quebrar linhas" toggle added (off by default, persisted) |
| 2026-11-20 | Too much vertical space between lines | Token padding/borders no longer inflate line height |
| 2026-11-20 | Code area must grow when wrapping | Output box made non-shrinking (`shrink-0`) |
| 2026-11-20 | "implemente" | Approved for implementation |

## User Stories
1. As a learner on a phone, I want long commands to wrap inside the command field so I can see everything I typed.
2. As an iPhone user, I want focusing the command field to never zoom the page, in portrait or landscape.
3. As a learner, I want the terminal symbols and the primary actions (blind test, validate) docked above the virtual keyboard.
4. As a learner studying annotated output, I want to choose between terminal columns (horizontal scroll) and wrapped lines, with the box growing to fit.
5. As a keyboard user on desktop, I want every existing shortcut and the two-column layout preserved.

## Responsive Breakdown
- **Mobile (< 768px):** compact header (back, topic, "N de total", tappable timer, logout) with full-width progress; three-way segmented study modes; shortcut hints hidden; symbol dock with 44px keys; sticky start action on the lobby.
- **Tablet (768px – 1023px):** same as mobile (the dock and segmented modes stay until `lg`), topic grid in two columns.
- **Desktop (>= 1024px):** previous layout and keyboard shortcut hints unchanged.

## State Matrix
| State | Behaviour |
|-------|-----------|
| Default | Topics all selected, 15 min; Treino tab with empty command field |
| Hover / Focus | Desktop hover colours unchanged; focus rings kept on all buttons and links |
| Loading | Session start navigates via full page load (unchanged) |
| Empty | No topic selected: summary reads "Selecione ao menos um tópico", start button disabled |
| Error | Validation feedback banner (`role="status"`) wraps long messages |
| Blind test | Dock switches to "Ver gabarito" + "Validar bloco"; reference hidden |

## Accessibility
- Topic cards are real `<button aria-pressed>`; durations are a `radiogroup`; icon-only buttons have pt-BR `aria-label`s.
- Touch targets >= 44px on mobile; start button text `#052e16` on `#22c55e` (≈ 8:1).
- Pinch-zoom re-enabled (WCAG 1.4.4); iOS focus zoom prevented by 16px form fields on non-fine pointers.

## Theme Note
The application ships a dark theme only; light theme support remains an open item for the whole app (not introduced by this change).
