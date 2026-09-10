# D0 — Code reading

**Individually · 15 minutes · written · no AI, no looking things up**

Name: ______________________________

---

## Context

**Radhaus Berlin** is a bicycle shop with two branches and an online portal where
customers book workshop appointments. The file below is the endpoint that creates
a new appointment. You will find it in this repository at
`app/api/termine/route.ts`.

It runs — but it does not do what it should.

## Your task

Note down in keywords what you notice: **what is the problem, and what would be
correct instead?** Sort your points by severity, worst first.

```ts
// app/api/termine/route.ts - list and create workshop appointments
import { createClient } from '@/lib/db'

export async function GET() {
  const db = createClient()
  const termine = await db.query('select * from termine order by datum desc')
  return Response.json({ termine })
}

export async function POST(request: Request) {
  const body = await request.json()
  const db = createClient()

  const kundeId = body.kundeId

  const offene = await db.query(
    `select * from termine where kunde_id = '${kundeId}' and status = 'offen'`
  )

  if (offene.length >= 3) {
    return Response.json({ fehler: 'Maximal 3 offene Termine' }, { status: 400 })
  }

  db.insert('termine', {
    kunde_id: kundeId,
    filiale_id: body.filialeId,
    datum: body.datum,
    beschreibung: body.beschreibung,
    status: 'offen',
  })

  return Response.json({ ok: true })
}
```

Two notes so you do not waste time on the wrong things:

- `createClient()` returns a small async wrapper around the database. `query`,
  `run` and `insert` all return promises.
- A customer may have at most **3 open appointments**. That is the business rule
  this endpoint is meant to enforce.

## Notes

<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>

---

*Your results remain your property. We use them solely to form an impression and
not for our own product.*
