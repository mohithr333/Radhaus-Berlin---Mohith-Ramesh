import { cookies } from 'next/headers'
import { createClient } from './db'

/**
 * The identity of the current request.
 *
 * The `kunde_id` cookie is the hard-wired, switchable login for this exercise and
 * is trusted *as the identity*. Everything the caller is allowed to do — their
 * role and, for staff, their branch — is looked up from the database against that
 * id. It is NEVER read from a client-supplied cookie or request body, so a
 * manipulated `rolle` cookie or request cannot grant more access.
 */
export interface Session {
  kundeId: number
  rolle: string
  filialeId: number | null
}

export async function getKundeId(): Promise<number | null> {
  const store = await cookies()
  const raw = store.get('kunde_id')?.value
  if (!raw) return null
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Resolve the full session for the current request, or null if nobody is signed
 * in / the id does not exist. Role and branch come from the database, not the
 * client.
 */
export async function getSession(): Promise<Session | null> {
  const kundeId = await getKundeId()
  if (!kundeId) return null

  const db = createClient()
  const konto = await db.first<{ rolle: string; filiale_id: number | null }>(
    'select rolle, filiale_id from kunden where id = ?',
    [kundeId]
  )
  if (!konto) return null

  return { kundeId, rolle: konto.rolle, filialeId: konto.filiale_id ?? null }
}
