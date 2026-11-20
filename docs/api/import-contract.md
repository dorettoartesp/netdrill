# API Contract: Content Pack Import (`/api/import`)

Uploads one **content pack** (`netdrill.pack/v1`): a topic with any number of commands and procedures. See `docs/superpowers/specs/2026-11-20-command-centric-content-design.md` §5–§9 and ADR-0006.

## Endpoint
- **Method:** `POST`
- **Path:** `/api/import` (apply) or `/api/import?dryRun=true` (validate and report, no writes)
- **Auth:** session cookie (protected by `src/middleware.ts`)
- **Content-Type:** `application/json`
- **Body limit:** 2 MB

## Request Schema
The authoritative JSON Schema is generated from `src/lib/content/schema.ts` into [`pack.schema.json`](pack.schema.json) (`npm run content:schema`; a test fails if they drift). Cross-field rules not expressible in JSON Schema:

- Command and procedure `id` must start with `<topic.slug>.` and be unique across the pack.
- Example `id` must be unique within its command.
- An id cannot appear both as a command/procedure and in `remove`.
- The pack must contain at least one of `commands`, `procedures`, `remove`.
- An id already stored as another kind (command vs procedure) is rejected.
- `remove` only accepts ids of the pack's topic.

## Semantics
- Upsert by id; re-uploading the same pack changes nothing and keeps progress.
- A command's examples with `"drill": true` (default) and every procedure become drills. Drills of examples removed from a command are deleted with their progress.
- Documents absent from a pack are never touched; only `remove` deletes.
- Unresolved `uses`/`related` ids and drill lines longer than 100 characters produce **warnings**, not errors.
- All writes happen in one transaction.

## Responses

`200 OK`
```json
{
  "ok": true,
  "dryRun": false,
  "summary": { "documentsCreated": 2, "documentsUpdated": 0, "documentsRemoved": 0, "drillsCreated": 3, "drillsRemoved": 0 },
  "warnings": [{ "path": "procedures[0].uses[1]", "message": "Command \"linux.grep\" is not uploaded yet; the link activates once it is." }]
}
```

`400 Bad Request` (invalid JSON, invalid pack, or conflicting ids)
```json
{ "ok": false, "issues": [{ "path": "commands[0].examples[2].command", "message": "Invalid input: expected string, received undefined" }] }
```

`413 Payload Too Large`
```json
{ "ok": false, "issues": [{ "path": "", "message": "The file exceeds the 2 MB limit." }] }
```

Database failures return a generic message (`The import could not be completed. Please try again.`); details are logged server-side only.
