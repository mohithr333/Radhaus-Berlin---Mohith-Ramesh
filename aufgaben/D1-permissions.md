# D1 — Permission concept

**Group work · 35 minutes · AI allowed**

Afterwards you present your result. Each of you explains one row of your matrix.

---

## Scenario

**Radhaus Berlin** runs two branches (Neukoelln, Wedding) and a public website.
Customers book workshop appointments there and upload photos of their bicycle.

The following access the database:

- **Visitors without an account** — see opening hours, prices, free appointment slots.
- **Customers with an account** — own profile, own appointments, own photos.
- **Workshop staff** — appointments of their own branch, may change the status
  (`angenommen`, `in Arbeit`, `fertig`).
- **Administration** — everything, plus reports across both branches.
- **A nightly background job** — sends reminder mails and hands finished
  appointments over to the accounting software. Runs with no human signed in.

---

## Part A — The matrix (approx. 15 minutes)

Build a table with exactly these columns:

| Object | Role | read | create | update | delete | enforced where? | why there? |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

- **"enforced where?"** has exactly three permitted values: **Browser**,
  **Server/API**, **Database**.
- **"why there?"** is one sentence.
- Objects at minimum: **profile, appointment, photo, price list**.

---

## Part B — The attack (approx. 15 minutes)

Another team has already delivered a concept for Radhaus. **It is in production —
and you are looking at it.** This repository is that system.

**Find the holes.** For each finding decide: *"must be gone before go-live"* or
*"we can clean this up later"*?

Start the app (`npm run seed`, `npm run dev`) and switch accounts with the
selector in the top right. The relevant code is in these places:

| File | What happens there |
|---|---|
| `lib/session.ts` | who the portal thinks you are |
| `lib/config.ts` | central configuration values |
| `app/api/termine/[id]/route.ts` | status change and deletion of an appointment |
| `app/api/termine/alle/route.ts` | full list across both branches |
| `app/api/profil/route.ts` | customers maintain their own contact details |
| `app/api/passwort-vergessen/route.ts` | password reset |
| `app/werkstatt/Terminuebersicht.tsx` | the workshop view in the browser |
| `public/uploads/` | the customer photos |

You do not have to fix anything. Write down **what** is wrong, **why** it
matters, and **how badly**.

---

## Part C — The design (approx. 5 minutes, notes only)

For **one** object of your choice, write down how you would enforce the rule
technically — SQL, pseudocode or prose, it does not matter.

And in one sentence: **how would you know that it works?**

---

*Your results remain your property. We use them solely to form an impression and
not for our own product.*
