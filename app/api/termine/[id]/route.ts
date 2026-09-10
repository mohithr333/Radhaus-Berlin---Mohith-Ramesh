// app/api/termine/[id]/route.ts - change the status of a single appointment,
// and remove one from the customer view.
import { createClient } from '@/lib/db'

const ERLAUBTE_STATUS = ['offen', 'angenommen', 'in Arbeit', 'fertig']

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const db = createClient()

  if (!ERLAUBTE_STATUS.includes(body.status)) {
    return Response.json({ fehler: 'Unbekannter Status' }, { status: 400 })
  }

  await db.run('update termine set status = ? where id = ?', [body.status, Number(id)])

  return Response.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createClient()

  // We keep the row for the accounting export and just mark it as deleted.
  // The appointment list filters this status out.
  await db.run('update termine set status = ? where id = ?', ['geloescht', Number(id)])

  return Response.json({ ok: true })
}
