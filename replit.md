# VisaPath — Smart e-Visa Portal

## Overview

pnpm workspace monorepo using TypeScript. VisaPath is a production-grade e-Visa application portal for Indian nationals traveling abroad.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS v4 + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks)
- **Auth**: JWT (stored in localStorage as `visapath_token`)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **artifacts/visapath** — Main React app (previewPath: `/`)
- **artifacts/api-server** — Express backend (port 8080 via `PORT` env)
- **artifacts/mockup-sandbox** — Design preview server

## Project Structure

```
lib/
  api-spec/           — OpenAPI YAML spec
  api-client-react/   — Orval-generated React Query hooks + Zod schemas
  api-zod/            — Standalone Zod schemas
  db/                 — Drizzle ORM schema + migrations

artifacts/
  visapath/           — React + Vite frontend
    src/
      App.tsx         — Root router with all routes
      contexts/       — AuthContext (JWT auth)
      components/     — Layout, ProtectedRoute, StatusBadge
      pages/          — Landing, Login, Register, Dashboard, Apply*, Applications*, Track, NotFound
      lib/            — utils, auth, customFetch
  api-server/
    src/
      app.ts          — Express app setup
      routes/         — auth, visas, applications, documents, dashboard, health
      lib/            — visaData (hardcoded visa countries), logger, db
      db/             — Drizzle schema
```

## Supported Destinations

UAE, Vietnam, Singapore, Malaysia, Thailand, Sri Lanka, Turkey, Indonesia (Bali), Cambodia, Kenya, Oman, Egypt

## Key Features

- Landing page with featured destinations from live API
- JWT authentication (register/login/logout)
- Multi-step visa application form (Travel → Personal → Accommodation → Documents → Review)
- Document upload with base64 encoding
- Application tracking dashboard with stats
- Status badge system (draft/submitted/under_review/approved/rejected)
- Track page for reference number lookup

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Design Tokens

- Primary: `#01696f` (teal) — HSL `183 98% 22%`
- Background: `#f7f6f2` (warm off-white) — HSL `45 30% 96%`
- Auth header: `Authorization: Bearer <token>`
