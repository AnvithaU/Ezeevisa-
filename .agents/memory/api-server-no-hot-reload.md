---
name: API server has no hot reload
description: Why backend edits don't take effect until the workflow is restarted
---
The `artifacts/api-server` dev script does `pnpm run build && pnpm run start` and
runs the bundled output with `node` — there is no file watcher. Editing backend
source does NOT live-reload.

**Why:** Tests/curl against `localhost:80/api/...` will hit the previously-built
bundle, producing confusing "the code says X but the server does Y" results.

**How to apply:** After any change under `artifacts/api-server/src`, restart the
`artifacts/api-server: API Server` workflow before smoke-testing the endpoints.
