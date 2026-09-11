# CLAUDE.md — Agent rules for the Radhaus Berlin portal

This is the rules file for D2. **All production code in this repo is written by the
agent.** The human steers, reviews and corrects. Follow these rules on every change.

## Project

- Next.js (App Router) + `node:sqlite`. DB wrapper is `lib/config.ts` / `lib/db.ts`;
  the example DB is built by `data/seed.mjs` (`npm run seed`).
- Identifiers and UI copy are in German — match the surrounding style. Don't rename
  existing things or reformat files you aren't changing.
- Use the existing `createClient()` wrapper and its `query`/`first`/`run`/`insert`
  methods. `await` every DB call.

## Security is the point of this exercise — non-negotiable rules

1. **Never trust the client for identity.** The `kunde_id` cookie is the hard-wired,
   switchable login and may be trusted *as the identity*. Everything else about that
   user — **role and branch — is looked up server-side from the database**, never read
   from a cookie or request body. Ignore `body.kundeId`, `body.rolle`, and any client
   `rolle` cookie.
2. **Authorize every read and every mutation** by ownership / branch / role on the
   server, before touching data:
   - customer → only their own appointments;
   - workshop staff → only appointments of *their* branch, status changes only;
   - administration → both branches.
   Put ownership in the SQL `WHERE` clause; a wrong id must return 0 rows → 404/403,
   not someone else's data.
3. **Parameterized SQL only.** Never build SQL by string interpolation of input.
4. **Enforce invariants in the database, not just the handler.** The "≤ 3 open
   appointments" rule must hold even against a hand-crafted request: enforce it in an
   atomic transaction *and* with a DB trigger as backstop.
5. **No secrets in the client bundle.** Never import a secret from `lib/config` into a
   `'use client'` component. Keep secrets server-only.
6. **Validate and bound all input** (types, allowed values, lengths, real branch ids,
   well-formed dates). Reject with 400; never 500 on bad input.
7. **Don't leak more than asked** — no `select *` that returns password hashes or other
   fields the client doesn't need. Select explicit columns.

## Definition of done (the D2 acceptance criteria)

1. A customer sees only **their own** appointments and can create one (date, branch,
   description).
2. ≤ 3 open appointments per customer, enforced **server-side**; a manipulated request
   must not get around it.
3. **No customer may ever see or change another customer's appointment.**
4. Workshop staff see appointments of **their branch** and may change status.
5. Administration sees **both** branches.

## How we prove it

For every guarantee, show the **attempt that must fail**, not the happy path:
- create a 4th open appointment via a crafted `curl` body → rejected, DB unchanged;
- read/patch/delete another customer's appointment by id → 403/404;
- a customer trying to act on another branch or escalate role → rejected.

## Out of scope (leave hard-wired / don't gold-plate)

- Real authentication of the identity itself — the account switcher stays.
- Photo storage hardening, password-reset enumeration, the nightly accounting export,
  and DB foreign-key constraints — note them, don't build them in the 60 minutes.
