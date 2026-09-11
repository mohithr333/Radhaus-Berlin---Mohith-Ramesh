# D1 — Permission concept (Radhaus Berlin)

All findings in Part B were reproduced against the running app (`npm run dev`) with
`curl`; the state changed during testing was restored afterwards.

---

## Part A — The matrix

**Objects:** profile (`kunden`), appointment (`termine`), photo (`fotos` + files in
`public/uploads/`), price list (`preisliste`).

Rule of thumb for the "enforced where?" column: the **Server/API** is the only place a
rule is actually enforced; the **Database** holds the hard invariants that must never be
violated even by a buggy handler (ownership FKs, the 3-open limit); the **Browser** is
never a security boundary — it only decides what to *show*, and is trivially bypassed
with `curl`.

| Object | Role | read | create | update | delete | enforced where? | why there? |
|---|---|---|---|---|---|---|---|
| **Profile** | Visitor | – | – | – | – | Server/API | No session → 401; nothing to show. |
| | Customer | own | – | own (not `rolle`) | – | Server/API | Identity comes from the session, never from the body; role must not be self-editable. |
| | Workshop staff | – | – | – | – | Server/API | Staff work on appointments, not on customer master data. |
| | Administration | all | – | all | – | Server/API | Admin manages accounts; still a checked role, not a public route. |
| | Nightly job | name+email only | – | – | – | Server/API | Needs contact data to send reminders; runs as a service identity, read-only. |
| **Appointment** | Visitor | free-slot **count** only | – | – | – | Server/API | Availability is public; individual bookings (who/what) are not. |
| | Customer | own | own (≤3 open) | own (e.g. cancel) | own (cancel) | Server/API **+ DB** | Must never see/touch another customer's row; the ≤3 limit is a DB invariant, not UI. |
| | Workshop staff | own branch | – | status only, own branch, allowed transitions | – | Server/API **+ DB** | Scoped to the employee's branch; only the defined status values. |
| | Administration | all branches | – | all | all | Server/API | Cross-branch reporting and correction is an admin power. |
| | Nightly job | finished ones | – | mark exported | – | Server/API | Hands finished jobs to accounting; no human, so a service credential. |
| **Photo** | Visitor | – | – | – | – | Server/API | Customer photos are private; must not be a public static file. |
| | Customer | own | own appt. | – | own | Server/API | Bound to an appointment the caller owns; filenames must be unguessable. |
| | Workshop staff | own branch | – | – | – | Server/API | Needs the photo to prep the repair, within their branch. |
| | Administration | all | – | – | all | Server/API | Full oversight. |
| | Nightly job | – | – | – | – | Server/API | Accounting export doesn't need images. |
| **Price list** | Visitor | yes (public) | – | – | – | Server/API | Prices are marketing; read is open, **writes are not**. |
| | Customer | yes | – | – | – | Server/API | Same public read. |
| | Workshop staff | yes | – | – | – | Server/API | Same. |
| | Administration | yes | yes | yes | yes | Server/API | Only admin maintains the catalogue. |
| | Nightly job | yes | – | – | – | Server/API | Needs prices for the accounting export. |

---

## Part B — The attack (findings)

Ranked worst first. Verdict: **[GO-LIVE]** = must be gone before go-live · **[LATER]** =
can be cleaned up later.

### 1. Service key is shipped to the browser and used as the only gate — [GO-LIVE]
`SERVICE_KEY` from `lib/config.ts` is imported into a **client** component,
`app/werkstatt/Terminuebersicht.tsx`, so it is baked into the JS bundle
(found in `.next/static/chunks/app/termine/page.js`). `app/api/termine/alle/route.ts`
trusts that single static header. Anyone can read the key from devtools and call the
endpoint anonymously; it returns **every appointment of both branches with customer
names and e-mail addresses**.
*Why it matters:* full PII dump to any anonymous visitor. *Verified:* `curl -H
'x-service-key: …' /api/termine/alle` → all rows. This is the most severe finding.

### 2. No trustworthy identity — unsigned, client-set session — [GO-LIVE]
`Benutzerwechsel.tsx` sets `kunde_id` and `rolle` with `document.cookie`, and
`lib/session.ts` reads them back verbatim. Nothing is signed (`SESSION_SECRET` exists
in `.env` but is **never used**). Any request can claim `kunde_id=1; rolle=verwaltung`.
*Why it matters:* every "who are you" decision downstream is spoofable — this is the
root cause under most of the findings below.

### 3. No authorization on GET /api/termine — [GO-LIVE]
`app/api/termine/route.ts` runs `select * from termine` with no session check and no
filter. *Verified:* anonymous `curl /api/termine` returns all customers' appointments.

### 4. No authorization on PATCH/DELETE /api/termine/[id] — [GO-LIVE]
`app/api/termine/[id]/route.ts` changes status / soft-deletes purely by id — no owner,
role, or branch check. *Verified:* anonymous `PATCH` and `DELETE` on another customer's
appointment both succeeded. Directly violates D2 requirements 3 and 4.

### 5. Privilege escalation via mass assignment on PATCH /api/profil — [GO-LIVE]
`rolle` is in the writable `FELDER` list. *Verified:* Mira (a customer) PATCHed
`{"rolle":"verwaltung"}` on her own profile and became admin. (The
`update kunden set ${feld} = ?` column interpolation is safe today only because the
list is fixed — a fragile pattern.)

### 6. Identity from the request body + SQL injection on POST /api/termine — [GO-LIVE]
`kundeId` is taken from the body (book as anyone) and string-interpolated into
`… where kunde_id = '${kundeId}'` (injectable; a crafted value also returns 0 rows and
**bypasses the 3-open-appointment limit**). Also the `insert` is not awaited, and the
count-then-insert is a race, so the limit can be beaten concurrently too. Fix: identity
from session, parameterised query, atomic/DB-enforced limit.

### 7. GET /api/profil leaks the password hash — [GO-LIVE]
`select * from kunden` returns `passwort_hash` to the client. *Verified.* Return an
explicit field list. (Hashes are placeholders here, but the leak pattern is real.)

### 8. Customer photos are public and enumerable — [GO-LIVE]
Files live in `public/uploads/` (served statically, no auth) with sequential names
`foto-1041.svg`, `-1042`, `-1043`. *Verified:* anonymous GET → 200. Serve through an
authorized route with unguessable identifiers.

### 9. Secrets committed to git — [GO-LIVE]
`.env` is tracked (`DATABASE_URL` with credentials, `SESSION_SECRET`, `SMTP_PASS`,
`SERVICE_KEY`). Fictional here, but a go-live blocker as a practice; `.env` belongs in
`.gitignore` and the values should be rotated.

### 10. User enumeration on password reset — [LATER]
`app/api/passwort-vergessen/route.ts` returns 404 for unknown e-mails and 200 for known
ones. *Verified.* Always answer with the same generic 200. Cheap; do it soon.

---

## Part C — The design (object: appointment)

**Rules to enforce:** (a) a customer only ever reads/updates/deletes their **own**
appointments; (b) at most **3 open** per customer; (c) staff are scoped to their branch
and to the allowed status values.

Identity always comes from a **signed session**, never from the body:

```
me     = session.kunde_id      // verified server-side
rolle  = session.rolle
```

**Ownership — put it in the WHERE clause, not in an `if`:**
```sql
-- read (customer)
select ... from termine where kunde_id = :me and status <> 'geloescht';
-- update/delete (customer): the clause makes a wrong id affect 0 rows
update termine set status = :s where id = :id and kunde_id = :me;
-- then: if changes() = 0  -> 404/403
```

**3-open limit — server check inside an atomic transaction, plus a DB backstop:**
```sql
BEGIN IMMEDIATE;
  select count(*) from termine where kunde_id = :me and status = 'offen';  -- must be < 3
  insert into termine (kunde_id, ...) values (:me, ...);  -- kunde_id forced to :me
COMMIT;
```
Last line of defence in the schema, so even a buggy handler can't exceed it:
```sql
CREATE TRIGGER max_offene BEFORE INSERT ON termine
WHEN NEW.status = 'offen'
 AND (select count(*) from termine where kunde_id = NEW.kunde_id and status = 'offen') >= 3
BEGIN SELECT RAISE(ABORT, 'Maximal 3 offene Termine'); END;
```

**How would I know it works?** An automated test that runs the attempts that **must
fail** — customer A `PATCH`/`GET`s customer B's appointment id (expect 403/404), and a
4th open booking via a hand-crafted body (expect 400) — and asserts the DB row count is
unchanged. Green means the boundary holds; the happy path proves nothing.
