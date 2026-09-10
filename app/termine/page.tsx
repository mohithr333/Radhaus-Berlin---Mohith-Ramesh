import Link from 'next/link'
import { createClient } from '@/lib/db'
import { getKundeId } from '@/lib/session'
import NeuerTermin from './NeuerTermin'

interface TerminZeile {
  id: number
  datum: string
  beschreibung: string
  status: string
  filiale: string
  foto: string | null
}

export const dynamic = 'force-dynamic'

export default async function MeineTermine() {
  const kundeId = await getKundeId()

  if (!kundeId) {
    return (
      <>
        <h1>Meine Termine</h1>
        <p className="lead">
          Bitte oben rechts ein Konto auswaehlen - die Anmeldung ist in dieser
          Uebungsumgebung fest verdrahtet.
        </p>
      </>
    )
  }

  const db = createClient()
  const kunde = await db.first<{ name: string }>('select name from kunden where id = ?', [kundeId])
  const termine = await db.query<TerminZeile>(
    `select t.id, t.datum, t.beschreibung, t.status,
            f.name as filiale,
            (select dateiname from fotos where termin_id = t.id limit 1) as foto
       from termine t
       join filialen f on f.id = t.filiale_id
      where t.kunde_id = ?
        and t.status <> 'geloescht'
      order by t.datum desc`,
    [kundeId]
  )

  const offene = termine.filter((t) => t.status === 'offen').length

  return (
    <>
      <h1>Meine Termine</h1>
      <p className="lead">
        Angemeldet als {kunde?.name ?? 'unbekannt'} - {offene} von 3 offenen Terminen belegt.
      </p>

      {termine.length === 0 ? (
        <div className="karte">Noch keine Termine gebucht.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Filiale</th>
              <th>Anliegen</th>
              <th>Foto</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {termine.map((t) => (
              <tr key={t.id}>
                <td>{t.datum}</td>
                <td>{t.filiale}</td>
                <td>{t.beschreibung}</td>
                <td>
                  {t.foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="foto" src={`/uploads/${t.foto}`} alt="Foto des Rades" />
                  ) : (
                    <span className="hinweis">-</span>
                  )}
                </td>
                <td>
                  <span className="status" data-s={t.status}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Neuen Termin buchen</h2>
      <NeuerTermin kundeId={kundeId} />

      <p className="hinweis">
        Fragen zu einem Termin? <Link href="/">Filiale anrufen</Link>.
      </p>
    </>
  )
}
