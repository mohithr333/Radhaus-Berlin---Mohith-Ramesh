// app/api/termine/[id]/route.ts - change the status of a single appointment,
// and cancel one. Every action is authorized against the session first: a
// customer may only touch their own appointment, staff only their own branch.
import { createClient } from '@/lib/db'
import { getSession } from '@/lib/session'
import type { Termin } from '@/lib/db'

// 'geloescht' is reached via DELETE (cancel), not via a status change.
const ERLAUBTE_STATUS = ['offen', 'angenommen', 'in Arbeit', 'fertig']

async function ladeTermin(id: number): Promise<Termin | undefined> {
  const db = createClient()
  return db.first<Termin>('select * from termine where id = ?', [id])
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return Response.json({ fehler: 'Nicht angemeldet' }, { status: 401 })
  }

  const { id } = await params
  const terminId = Number(id)
  if (!Number.isInteger(terminId) || terminId <= 0) {
    return Response.json({ fehler: 'Ungueltige Id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ fehler: 'Ungueltige Anfrage' }, { status: 400 })
  }
  const status = (body as Record<string, unknown>).status
  if (typeof status !== 'string' || !ERLAUBTE_STATUS.includes(status)) {
    return Response.json({ fehler: 'Unbekannter Status' }, { status: 400 })
  }

  const termin = await ladeTermin(terminId)
  if (!termin || termin.status === 'geloescht') {
    return Response.json({ fehler: 'Nicht gefunden' }, { status: 404 })
  }

  // Only workshop staff (own branch) and administration change the status.
  if (session.rolle === 'werkstatt') {
    if (termin.filiale_id !== session.filialeId) {
      return Response.json({ fehler: 'Kein Zugriff' }, { status: 403 })
    }
  } else if (session.rolle !== 'verwaltung') {
    return Response.json({ fehler: 'Kein Zugriff' }, { status: 403 })
  }

  const db = createClient()
  await db.run('update termine set status = ? where id = ?', [status, terminId])
  return Response.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return Response.json({ fehler: 'Nicht angemeldet' }, { status: 401 })
  }

  const { id } = await params
  const terminId = Number(id)
  if (!Number.isInteger(terminId) || terminId <= 0) {
    return Response.json({ fehler: 'Ungueltige Id' }, { status: 400 })
  }

  const termin = await ladeTermin(terminId)
  if (!termin || termin.status === 'geloescht') {
    return Response.json({ fehler: 'Nicht gefunden' }, { status: 404 })
  }

  // A customer may cancel only their own appointment; staff only within their
  // branch; administration anywhere.
  const darf =
    (session.rolle === 'kunde' && termin.kunde_id === session.kundeId) ||
    (session.rolle === 'werkstatt' && termin.filiale_id === session.filialeId) ||
    session.rolle === 'verwaltung'

  if (!darf) {
    return Response.json({ fehler: 'Kein Zugriff' }, { status: 403 })
  }

  // We keep the row for the accounting export and just mark it as deleted.
  const db = createClient()
  await db.run('update termine set status = ? where id = ?', ['geloescht', terminId])
  return Response.json({ ok: true })
}
