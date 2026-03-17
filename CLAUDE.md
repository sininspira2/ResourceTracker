# CLAUDE.md

ResourceTracker is a Next.js 15 + TypeScript web app for gaming guild resource management. It uses Discord OAuth (NextAuth.js), Drizzle ORM with Turso (SQLite), and Tailwind CSS 4. Deployed on Vercel.

See `AGENTS.md` for full project conventions and `docs/` for architecture and API reference.

## Quick Reference

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build (also generates migration hashes)
npm test             # Run Jest test suite
npm run lint         # ESLint check
npm run db:generate  # Generate new migration from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:check     # Verify migration hashes are in sync
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth config, JWT/session callbacks, `getUserIdentifier()` |
| `lib/db.ts` | Drizzle schema (6 tables), lazy DB connection proxy |
| `lib/discord-roles.ts` | RBAC: `hasResourceAccess()`, `hasResourceAdminAccess()`, `hasTargetEditAccess()` |
| `lib/constants.ts` | Categories, tiers, status values, filter enums |
| `lib/leaderboard.ts` | Points calculation (`calculatePoints`, `awardPoints`), ranking queries |
| `lib/resource-utils.ts` | Shared `calculateResourceStatus()` utility |
| `middleware.ts` | NextAuth route protection for `/dashboard`, `/resources`, `/users` |
| `app/api/resources/route.ts` | Resource list (GET→internal), create (POST), bulk update (PUT) |
| `app/api/resources/[id]/route.ts` | Single resource update (PUT) and delete (DELETE) |
| `app/api/resources/[id]/transfer/route.ts` | Transfer between Hagga/Deep Desert locations (PUT) |

## Testing

Tests live in `tests/`. Use `@jest-environment node` docblock for API route tests. Mock `next/cache` to avoid `Invariant: incrementalCache missing` errors. Mocks are in `tests/__mocks__/`.

## Database Workflow

Schema changes: edit `lib/db.ts` → `npm run db:generate` → `npm run db:migrate` → `npm run db:check`

Migration hashes are auto-generated on `build` and `db:generate`. If the build fails with a hash mismatch, run `npm run db:generate-hashes` to regenerate them.

## Code Conventions

- Run `npm run lint` before committing — Prettier + ESLint are enforced in CI
- Add a `lib/changelog.json` entry for any significant change (`feature`, `improvement`, `bugfix`, `breaking`)
- Auth: use `getServerSession(authOptions)` in API routes; pages are protected by `middleware.ts`
- All API error responses use `{ error: "..." }` format (not `{ message: "..." }`)
- Catch blocks should use `error instanceof Error ? error.message : String(error)` — avoid `catch (error: any)`
- **Do not change `dbInstance: any` in `lib/leaderboard.ts`** — it intentionally accepts both `LibSQLDatabase` and Drizzle transaction objects (`SQLiteTransaction`), which are structurally incompatible types. Using `typeof db` breaks the build.

## Known Tech Debt

- **N+1 query in bulk PUT** (`app/api/resources/route.ts` bulk update): each resource is fetched individually inside a loop, then all resources are re-fetched at the end — consider batching with `inArray`
- **`any` in component tests**: some component/page tests use loose typing; the lib layer is well-typed
