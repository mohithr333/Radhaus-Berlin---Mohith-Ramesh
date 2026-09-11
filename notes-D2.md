# D2 — Live implementation notes

Rules file for the agent: `CLAUDE.md` (created before any code was written).

## What was changed and why

Identity model is the core decision: the `kunde_id` cookie stays as the hard-wired,
switchable login (allowed by the task), but **role and branch are looked up server-side
from the database** against that id — never read from a cookie or request body. That one
change is what makes requirements 3–5 hold against a manipulated request.

- `lib/session.ts` — `getSession()` derives `{ kundeId, rolle, filialeId }` from the DB.
- `app/api/termine/route.ts` — `GET` is role-scoped (customer→own, staff→own branch,
  admin→both); `POST` takes the id from the session, validates input, uses parameterized
  SQL, and enforces ≤3 open inside an atomic transaction.
- `app/api/termine/[id]/route.ts` — `PATCH`/`DELETE` authorize by ownership/branch/role.
- `data/seed.mjs` — added `kunden.filiale_id` (Tom→Neukölln, Rita→Wedding) and a
  `BEFORE INSERT` trigger `max_offene_termine` as the DB-level backstop for the limit.
- `lib/db.ts` — added an atomic `transaction()` helper.
- Removed `app/api/termine/alle` and the `SERVICE_KEY` import from the client; the
  workshop view now reads the session-scoped `GET /api/termine`.
- `app/werkstatt/page.tsx` — server-side gate to staff/admin only.
- `app/api/profil/route.ts` — dropped `rolle` from writable fields (no self-promotion);
  stopped returning `passwort_hash`.

## Verified — the attempts that must fail (all against the running app)

| Requirement | The failing attempt | Result |
|---|---|---|
| 2 — ≤3 open | 4th open booking by Mira | `400` |
| 2 — manipulation | body `kundeId` forged / SQL-injection string in `kundeId` | ignored, still `400` |
| 3 — cross-customer | Mira PATCH/DELETE Jonas' appointment | `403` |
| 3 — anonymous | anon GET/PATCH/DELETE on any appointment | `401` |
| 3 — escalation | Mira PATCH profile `rolle=verwaltung`; spoof `rolle` cookie | role stays `kunde`, list stays scoped |
| 4 — branch | Tom (Neukölln) PATCH a Wedding appointment | `403` |
| — leak | service key present in `/werkstatt` browser JS | 0 occurrences |

Happy paths also pass: Mira sees ids [1,2] only, Tom sees his branch [1,2,5], Rita [3,4],
admin Katrin all [1,2,3,4,5]; a customer can book up to 3.

## What the agent got wrong, and how it was noticed

1. **Type error slipped through the first write.** `FILIALEN` is declared `as const`, so
   `new Set(FILIALEN.map(f => f.id))` became `Set<1 | 2>` and `.has(number)` did not
   type-check. *Noticed:* `npx tsc --noEmit` before running anything. *Fix:* typed the
   set as `Set<number>`.
2. **Stale build artifact after deleting a route.** Removing `app/api/termine/alle`
   left generated types in `.next/types` that still referenced it, producing phantom
   `tsc` errors. *Noticed:* the errors pointed at `.next/...` paths, not source. *Fix:*
   cleared `.next/types`; it regenerates on build. (Lesson: read *where* an error is.)
3. **Nearly relied on the app-level count alone for the limit.** The original race
   (count, then insert, with an await in between) would have persisted. *Corrected*
   during design by moving to an atomic transaction **and** a DB trigger, then proving
   the 4th booking fails.

## Deliberately left out (given the hour)

Real authentication of the identity itself — the account switcher stays, so anyone who
can set the `kunde_id` cookie still chooses who to log in *as*; making that unforgeable
(signed sessions / real login) is the next step but was explicitly out of scope. Also
left: photo access hardening in `public/uploads/`, password-reset user-enumeration, the
nightly accounting-export endpoint, and DB foreign-key constraints.
