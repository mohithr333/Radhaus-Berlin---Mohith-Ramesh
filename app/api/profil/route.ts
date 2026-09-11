// app/api/profil/route.ts - customers maintain their own contact details here.
import { createClient } from '@/lib/db'
import { getKundeId } from '@/lib/session'

// A customer may edit only their contact details. 'rolle' is deliberately NOT
// here: role is an authorization fact, never self-editable from the client.
const FELDER = ['name', 'email', 'telefon', 'adresse']

export async function GET() {
  const kundeId = await getKundeId()
  if (!kundeId) {
    return Response.json({ fehler: 'Nicht angemeldet' }, { status: 401 })
  }

  const db = createClient()
  // Explicit column list - never return passwort_hash to the client.
  const profil = await db.first(
    'select id, name, email, telefon, adresse, rolle from kunden where id = ?',
    [kundeId]
  )
  return Response.json({ profil })
}

export async function PATCH(request: Request) {
  const kundeId = await getKundeId()
  if (!kundeId) {
    return Response.json({ fehler: 'Nicht angemeldet' }, { status: 401 })
  }

  const body = await request.json()
  const db = createClient()

  for (const feld of FELDER) {
    if (body[feld] !== undefined) {
      await db.run(`update kunden set ${feld} = ? where id = ?`, [String(body[feld]), kundeId])
    }
  }

  return Response.json({ ok: true })
}
