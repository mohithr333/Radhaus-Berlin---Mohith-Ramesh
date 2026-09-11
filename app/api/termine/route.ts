// app/api/termine/route.ts - list and create workshop appointments.
//
// Identity comes from the session (see lib/session.ts), never from the request
// body. Reads are scoped to what the caller is allowed to see; creation is a
// customer action, limited to 3 open appointments enforced atomically.
import type { DatabaseSync } from 'node:sqlite'
import { createClient } from '@/lib/db'
import { getSession } from '@/lib/session'
import { FILIALEN } from '@/lib/config'

const MAX_OFFENE = 3
const MAX_BESCHREIBUNG = 500
const FILIALE_IDS = new Set<number>(FILIALEN.map((f) => f.id))

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ fehler: 'Nicht angemeldet' }, { status: 401 })
  }

  const db = createClient()

  // Customer: only their own appointments.
  if (session.rolle === 'kunde') {
    const termine = await db.query(
      `select t.id, t.datum, t.beschreibung, t.status, f.name as filiale
         from termine t
         join filialen f on f.id = t.filiale_id
        where t.kunde_id = ? and t.status <> 'geloescht'
        order by t.datum desc`,
      [session.kundeId]
    )
    return Response.json({ termine })
  }

  // Workshop staff: only the appointments of their own branch.
  if (session.rolle === 'werkstatt') {
    if (session.filialeId == null) {
      return Response.json({ fehler: 'Keiner Filiale zugeordnet' }, { status: 403 })
    }
    const termine = await db.query(
      `select t.id, t.datum, t.beschreibung, t.status, t.kunde_id,
              f.name as filiale, k.name as kunde, k.email as kunde_email
         from termine t
         join filialen f on f.id = t.filiale_id
         join kunden   k on k.id = t.kunde_id
        where t.filiale_id = ? and t.status <> 'geloescht'
        order by t.datum desc`,
      [session.filialeId]
    )
    return Response.json({ termine })
  }

  // Administration: both branches.
  if (session.rolle === 'verwaltung') {
    const termine = await db.query(
      `select t.id, t.datum, t.beschreibung, t.status, t.kunde_id,
              f.name as filiale, k.name as kunde, k.email as kunde_email
         from termine t
         join filialen f on f.id = t.filiale_id
         join kunden   k on k.id = t.kunde_id
        where t.status <> 'geloescht'
        order by t.datum desc`
    )
    return Response.json({ termine })
  }

  return Response.json({ fehler: 'Kein Zugriff' }, { status: 403 })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ fehler: 'Nicht angemeldet' }, { status: 401 })
  }
  // Booking is a customer action.
  if (session.rolle !== 'kunde') {
    return Response.json({ fehler: 'Nur Kundinnen und Kunden buchen Termine' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ fehler: 'Ungueltige Anfrage' }, { status: 400 })
  }
  const daten = body as Record<string, unknown>

  // Validate input. The customer id is taken from the session, never the body.
  const filialeId = Number(daten.filialeId)
  if (!FILIALE_IDS.has(filialeId)) {
    return Response.json({ fehler: 'Unbekannte Filiale' }, { status: 400 })
  }

  const datum = typeof daten.datum === 'string' ? daten.datum : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || Number.isNaN(Date.parse(datum))) {
    return Response.json({ fehler: 'Ungueltiges Datum' }, { status: 400 })
  }

  const beschreibung = typeof daten.beschreibung === 'string' ? daten.beschreibung.trim() : ''
  if (beschreibung.length === 0 || beschreibung.length > MAX_BESCHREIBUNG) {
    return Response.json({ fehler: 'Beschreibung fehlt oder ist zu lang' }, { status: 400 })
  }

  const db = createClient()

  // Count open appointments and insert in one atomic transaction, so two
  // concurrent requests cannot both slip past the limit. The DB trigger
  // `max_offene_termine` is the final backstop underneath this.
  try {
    const ergebnis = db.transaction((raw: DatabaseSync) => {
      const row = raw
        .prepare(
          `select count(*) as n from termine where kunde_id = ? and status = 'offen'`
        )
        .get(session.kundeId) as { n: number }

      if (row.n >= MAX_OFFENE) {
        return { limitErreicht: true as const }
      }

      raw
        .prepare(
          `insert into termine (kunde_id, filiale_id, datum, beschreibung, status)
           values (?, ?, ?, ?, 'offen')`
        )
        .run(session.kundeId, filialeId, datum, beschreibung)

      return { limitErreicht: false as const }
    })

    if (ergebnis.limitErreicht) {
      return Response.json({ fehler: 'Maximal 3 offene Termine' }, { status: 400 })
    }
  } catch (error) {
    // The trigger raises 'Maximal 3 offene Termine' if the limit is somehow hit.
    const meldung = error instanceof Error ? error.message : ''
    if (meldung.includes('Maximal 3 offene Termine')) {
      return Response.json({ fehler: 'Maximal 3 offene Termine' }, { status: 400 })
    }
    return Response.json({ fehler: 'Termin konnte nicht angelegt werden' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
