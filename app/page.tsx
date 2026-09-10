import Link from 'next/link'
import { createClient } from '@/lib/db'

interface FilialeRow {
  id: number
  name: string
  adresse: string
  oeffnungszeiten: string
}

interface PreisRow {
  id: number
  leistung: string
  preis_eur: string
}

export const dynamic = 'force-dynamic'

export default async function Startseite() {
  const db = createClient()
  const filialen = await db.query<FilialeRow>('select * from filialen order by id')
  const preise = await db.query<PreisRow>('select * from preisliste order by id')
  const belegt = await db.query<{ datum: string; n: number }>(
    `select datum, count(*) as n from termine where status <> 'geloescht' group by datum`
  )

  const belegtNach = new Map(belegt.map((b) => [b.datum, b.n]))
  const slots: { datum: string; frei: number }[] = []
  const heute = new Date('2026-09-14T00:00:00Z')
  for (let i = 0; i < 6; i++) {
    const d = new Date(heute.getTime() + i * 86400000)
    const datum = d.toISOString().slice(0, 10)
    slots.push({ datum, frei: Math.max(0, 6 - (belegtNach.get(datum) ?? 0)) })
  }

  return (
    <>
      <h1>Werkstatt-Termine online buchen</h1>
      <p className="lead">
        Zwei Filialen, eine Werkstatt-Crew. Termin buchen, Rad vorbeibringen, fertig.
      </p>

      <h2>Filialen</h2>
      <div className="raster">
        {filialen.map((f) => (
          <div className="karte" key={f.id}>
            <strong>{f.name}</strong>
            <div className="hinweis">{f.adresse}</div>
            <div className="hinweis">{f.oeffnungszeiten}</div>
          </div>
        ))}
      </div>

      <h2>Freie Termin-Slots</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>freie Plaetze</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.datum}>
              <td>{s.datum}</td>
              <td>{s.frei}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Preise</h2>
      <table>
        <thead>
          <tr>
            <th>Leistung</th>
            <th>Preis</th>
          </tr>
        </thead>
        <tbody>
          {preise.map((p) => (
            <tr key={p.id}>
              <td>{p.leistung}</td>
              <td>{p.preis_eur} EUR</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Schon Kunde?</h2>
      <p className="hinweis">
        <Link href="/termine">Meine Termine ansehen</Link> oder{' '}
        <Link href="/passwort-vergessen">Passwort zuruecksetzen</Link>.
      </p>
    </>
  )
}
