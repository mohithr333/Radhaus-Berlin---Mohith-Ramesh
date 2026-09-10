// app/api/passwort-vergessen/route.ts - request a password reset mail.
import { createClient } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const db = createClient()

  const konto = await db.first('select id, email from kunden where email = ?', [
    String(body.email ?? ''),
  ])

  if (!konto) {
    // Tell people right away instead of letting them wait for a mail that
    // will never arrive.
    return Response.json(
      { fehler: 'Diese E-Mail-Adresse ist uns nicht bekannt.' },
      { status: 404 }
    )
  }

  // In this exercise environment no mail is actually sent.
  return Response.json({ ok: true, meldung: 'Wir haben dir eine E-Mail geschickt.' })
}
