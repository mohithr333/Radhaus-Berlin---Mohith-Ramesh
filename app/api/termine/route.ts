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
