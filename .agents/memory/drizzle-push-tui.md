---
name: drizzle-kit push blocks on interactive TUI
description: How to run drizzle-kit push non-interactively when it prompts about ambiguous schema changes.
---

# drizzle-kit push interactive prompt workaround

`pnpm --filter @workspace/db run push` (drizzle-kit push) can block on an
interactive TUI prompt when it cannot decide a change automatically (e.g. an
existing unique constraint like `google_id` it wants to confirm rename vs
create). In the agent shell there is no TTY, so it hangs.

**Workaround:** drive it through a pseudo-tty and feed Enter keystrokes:
`cd lib/db && script -qec "printf '\r\r\r' | pnpm exec drizzle-kit push --config ./drizzle.config.ts" /dev/null`

**How to apply:** only when a normal `push` hangs. Review the intended diff
first — blindly pressing Enter accepts drizzle's default choice for each prompt.
