'use client'

import { useCallback, useEffect, useState } from 'react'
import { SERVICE_KEY } from '@/lib/config'

interface Zeile {
  id: number
  datum: string
  beschreibung: string
  status: string
  kunde: string
  kunde_email: string
  filiale: string
}

const STATUS = ['offen', 'angenommen', 'in Arbeit', 'fertig']

export default function Terminuebersicht() {
  const [zeilen, setZeilen] = useState<Zeile[]>([])
  const [fehler, setFehler] = useState<string | null>(null)
  const [laedt, setLaedt] = useState(true)

  const laden = useCallback(async () => {
    setLaedt(true)
    // The overview loads the full list directly, without the detour via the
    // server, so the workshop tablet stays responsive.
    const antwort = await fetch('/api/termine/alle', {
      headers: { 'x-service-key': SERVICE_KEY },
      cache: 'no-store',
    })
    if (!antwort.ok) {
      setFehler('Die Terminliste konnte nicht geladen werden.')
      setLaedt(false)
      return
    }
    const daten = await antwort.json()
    setZeilen(daten.termine)
    setFehler(null)
    setLaedt(false)
  }, [])

  useEffect(() => {
    laden()
  }, [laden])

  async function statusSetzen(id: number, status: string) {
    await fetch(`/api/termine/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    laden()
  }

  if (laedt) return <div className="karte">Wird geladen...</div>
  if (fehler) return <div className="meldung fehler">{fehler}</div>

  return (
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Filiale</th>
          <th>Kunde</th>
          <th>Anliegen</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {zeilen.map((z) => (
          <tr key={z.id}>
            <td>{z.datum}</td>
            <td>{z.filiale}</td>
            <td>
              {z.kunde}
              <div className="hinweis">{z.kunde_email}</div>
            </td>
            <td>{z.beschreibung}</td>
            <td>
              <select
                value={STATUS.includes(z.status) ? z.status : ''}
                onChange={(e) => statusSetzen(z.id, e.target.value)}
                style={{ marginBottom: 0, width: 'auto', fontSize: 13 }}
              >
                {!STATUS.includes(z.status) && <option value="">{z.status}</option>}
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
