---
name: DB schema sync
description: How to reconcile the live Postgres DB when it lags the Drizzle schema in this repo.
---

# DB schema drift / sync

The live database can be missing columns/tables that exist in the Drizzle schema
(`lib/db/src/schema/*`). Symptom: API routes 500 with `Failed query: select ... from "<table>"`
because the SELECT references a column/table that doesn't exist yet.

**Why:** schema files get added/changed without the corresponding push reaching this
environment's DB (e.g. after a reset or merge). Seen with `users.email_verified` and the
whole `otp_codes` table (plus its `otp_purpose` enum) missing.

**How to apply:** `drizzle-kit push` (the `@workspace/db` `push` script) hangs waiting for
interactive prompts in this environment. Instead apply the missing pieces idempotently with
raw SQL via the `executeSql` callback in code execution:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
- `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='...') THEN CREATE TYPE ... END IF; END $$`
- `CREATE TABLE IF NOT EXISTS ...`
Then verify against `information_schema.columns` / `information_schema.tables`.
Mirror the exact column names/types from the schema file (e.g. otp `code` column maps to
`codeHash` in TS, timestamps are `timestamptz`).
