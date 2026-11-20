# Development Guide — NetDrill

## 1. Prerequisites
- Node.js >= 20.x (Current LTS: v24.x)
- npm >= 10.x
- Make (GNU Make)
- Git

## 2. Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start local development server
npm run dev

# 4. Run the full quality gate (lint, tests, SAST, gitleaks, portability)
make check
```

## 3. Makefile Targets
- `make dev`: Starts the Next.js local development server (`npm run dev`).
- `make lint`: Runs ESLint and Next.js static analysis (`npm run lint`).
- `make test`: Runs automated test suite via Vitest (`npm test`). React components are tested by rendering them to static markup with `react-dom/server` in the node environment (see `tests/mobile-*.test.tsx`); keep interaction logic in pure exported helpers so it can be unit-tested without a DOM.
- `make check`: Inviolable quality gate enforcing lint, SAST Semgrep, Gitleaks, Vitest tests, and zero hardcoded host paths.
