---
name: api-zod barrel export collisions
description: Why lib/api-zod/src/index.ts needs explicit re-exports, and what to do when adding new OpenAPI request/response bodies.
---

# api-zod barrel star-export ambiguity (TS2308)

`lib/api-zod/src/index.ts` re-exports both `./generated/api` (orval zod
schemas — runtime `const`s) and `./generated/types` (orval TS interfaces).
Any name that exists in BOTH (every request body, and some response bodies)
collides under two `export *` statements and produces `TS2308: Module ...
has already exported a member named 'X'`. This fails `pnpm run typecheck:libs`,
which short-circuits the whole `pnpm run typecheck` (so artifact typecheck
errors stay hidden until libs are green).

**Fix in place:** the barrel adds an explicit `export { ... } from
"./generated/api"` block listing the colliding names. An explicit named
re-export overrides both star exports and resolves the ambiguity (this is
exactly what the TS2308 message suggests). Consumers want the zod *schema*
(value) for these names, so re-exporting from `./generated/api` is correct.

**How to apply:** Whenever you add a new request/response body to the OpenAPI
spec and re-run `pnpm --filter @workspace/api-spec run codegen`, check whether
the new name appears in both generated modules. Quick check:
`comm -12 <(grep -oE '^export const [A-Za-z0-9_]+' lib/api-zod/src/generated/api.ts | awk '{print $3}' | sort) <(ls lib/api-zod/src/generated/types | sed 's/\.ts$//;s/^./\U&/' | sort)`.
If a new collision appears, add it to the explicit re-export list in the barrel.

**Why:** without it the canonical typecheck is red and no artifact gets checked.
