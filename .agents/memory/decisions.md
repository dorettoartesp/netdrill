# Decisions Log (.agents/memory/decisions.md)

Chronological record of technical, architectural, and governance decisions agreed with the operator for `NetDrill`.

## 2026-11-20
- **Project Identity and Purpose:** NetDrill bootstrapped from `agentic-tmpl` as a responsive technical command and configuration muscle-memory drill platform with spaced repetition (SM-2), starting with Linux, Networks, and FortiGate, expandable to any CLI/config domain (Kubernetes, PostgreSQL).
- **Core Technology Stack:** Next.js 14+ (App Router, TypeScript, Tailwind CSS), Turso DB (libSQL Serverless with `@libsql/client`), local SQLite fallback for dev/testing, deployed to Vercel Hobby Free Tier.
- **UI Architecture & Components:** Adopting shadcn/ui component primitives (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`) with a dark terminal color theme (`#0c0e14` background, `#22c55e` terminal green, `#f59e0b` amber timer).
- **Minimalist Authentication (Ponytail & YAGNI):** Implemented via a single personal master PIN/password stored in environment variables (`APP_PIN`), issuing a 30-day secure HttpOnly session cookie. Zero external auth services, zero cost, instant setup across mobile and desktop.
- **Zero-Touch CLI Automation:** Full automation via Turso CLI (`turso db create/tokens`), Vercel CLI (`vercel --prod`), and GitHub CLI (`gh repo create`), eliminating manual configuration in web dashboards.
- **Phased MVP Delivery:** Phase 1 focuses strictly on core muscle typing drill (`:done` loop + blind recall test), daily session timer, bulk JSON import, mobile keyboard accessory bar, and automated deployment. Export to Anki/Obsidian and secondary game modes deferred to Phase 2.
- **Mandatory Visual Screen Approval Protocol:** All UI pages (Study Terminal, Login, and Bulk Import) must be previewed and visually approved by the user via interactive artifacts before production view code is written.
- **Language Governance:** Codebase, tests, docstrings, and commits strictly in English. UI microcopy and user feedback strictly in formal, technical Brazilian Portuguese (pt-BR).
- **Mobile Redesign (approved prototype `prototypes/mobile-redesign/`):** Mobile (< 1024px) gets a dedicated layout: compact study header, segmented study modes, symbol dock above the virtual keyboard, auto-growing word-wrapping command field, optional persisted line wrap on annotated output. Desktop layout and shortcuts are unchanged.
- **iOS Focus Zoom Policy:** Form fields stay at 16px unless the device has a fine hover pointer (`@media (hover: hover) and (pointer: fine)`), never gated by viewport width (landscape iPhones exceed 768px). Pinch-zoom is no longer disabled in the viewport (WCAG 1.4.4).
- **Component Testing Without a DOM:** UI components are tested with `react-dom/server` `renderToStaticMarkup` in Vitest's node environment (no jsdom/testing-library dependency); interaction logic is extracted into pure, exported helpers.
- **Command-Centric Content (ADR-0006):** All content is uploaded as JSON packs (`netdrill.pack/v1`) through `/import`, authored offline with any LLM using the copyable prompt in the UI. Commands (flags, examples, use cases) and multi-step procedures are stored as validated documents; drills derive from examples and procedures. No repository content folder, no seed-at-deploy.
- **AI Removed:** No runtime AI/LLM calls. The OpenRouter/Nemotron manual generator and the `man_pages` cache are removed; the manual reads uploaded command documents.
- **Schema v2 Reset:** Upgrading to schema v2 drops every legacy table (content, progress, favorites, review flags), approved by the owner on 2026-11-20.
- **Drill Sizing:** Drills train what is typed from memory (lines under ~80 characters); long commands become short progressive drills plus `"drill": false` reference examples. Multiple-choice questions are deferred to output interpretation only.
