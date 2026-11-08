# Triply

Next.js App Router, TypeScript, Tailwind, Prisma + PostgreSQL, Auth.js (Google).

Structure (no `src/`, alias `@/*` points at the repo root):
- `app/` pages, layouts, route handlers under `app/api/v1`
- `components/element` small reusable UI, `components/fragment` composed UI
- `controller/` business logic, database access, external API calls
- `lib/` prisma client, auth, api guard, permissions, validations, hooks
- `data/` static config: site, navigation, constants
- `context/` React context providers
- `utils/` pure helpers
- `@type/` shared TypeScript types
- `prisma/` schema, migrations, seed

Read AGENTS.md before writing Next.js code.
