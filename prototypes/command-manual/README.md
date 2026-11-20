# Prototype: Command Manual (`/man`, `/man/[id]`, man modal)

- **Screen Slug:** `command-manual`
- **Routes:** `/man` (catalog), `/man/[id]` (command or procedure page); man modal inside the study session
- **Status:** PENDING_APPROVAL (post-hoc review: the owner instructed on 2026-11-20 to finish, merge and deploy without stopping for approval)
- **Design Canvas:** Claude Design artifact "NetDrill Content", artboards 2–4 (private to the owner); sources in [`canvas/`](canvas/)
- **Spec:** `docs/superpowers/specs/2026-11-20-command-centric-content-design.md` §8

## User Stories
1. As a learner, I search commands and procedures by name.
2. As a learner, I read a command's synopsis, flags, examples with output, use cases and the procedures that use it.
3. As a learner, I read a procedure's context, goal and numbered steps, and jump to the commands it uses.
4. As a learner, I start practicing from a manual page.

## Responsive Breakdown
- **Mobile (< 768px):** single column, flags as a two-column table, outputs scroll horizontally.
- **Tablet / Desktop:** same content centred (max-width ~880px).

## State Matrix
| State | Behaviour |
|-------|-----------|
| Default | Catalog lists commands and procedures |
| Empty | "No manual entries yet. Upload content in Import." |
| Search, no match | "No entries match your search." |
| Not found | "No manual entry found for this command." with link back |
| Modal, several matches | Short chooser listing each match with its topic |
