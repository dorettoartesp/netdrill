# Prototype: Content Import (`/import`)

- **Screen Slug:** `content-import`
- **Route:** `/import`
- **Status:** PENDING_APPROVAL (post-hoc review: the owner instructed on 2026-11-20 to finish, merge and deploy without stopping for approval)
- **Design Canvas:** Claude Design artifact "NetDrill Content", artboard 1 (private to the owner); source in [`canvas/`](canvas/)
- **Spec:** `docs/superpowers/specs/2026-11-20-command-centric-content-design.md` §9

## User Stories
1. As the content author, I copy a ready-made prompt, paste it into any LLM and get a valid pack.
2. As the content author, I paste or pick a JSON file, validate it without writing, and see what would change.
3. As the content author, I import it and see created/updated/removed counts and warnings; errors point to the exact JSON path.

## Responsive Breakdown
- **Mobile (< 768px):** single column; Validate/Import pinned at the bottom.
- **Tablet / Desktop:** same column centred (max-width ~720px); buttons inline under the editor.

## State Matrix
| State | Behaviour |
|-------|-----------|
| Default | Empty editor, prompt card with Copy prompt |
| Busy | Validate/Import disabled while a request runs |
| Copied | Copy prompt shows "Copied" for 2 s |
| Success (dry run) | Green panel "Valid pack · nothing written yet" with counts and warnings |
| Success (import) | Green panel "Imported" with counts and warnings |
| Error | Red panel listing `path: message` items |
