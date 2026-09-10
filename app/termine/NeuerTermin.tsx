'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FILIALEN } from '@/lib/config'

export default function NeuerTermin({ kundeId }: { kundeId: number }) {
  const router = useRouter()
  const [datum, setDatum] = useState('2026-09-18')
  const [filialeId, setFilialeId] = useState(1)
  const [beschreibung, setBeschreibung] = useState('')
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaeuft(true)
    setMeldung(null)

    const antwort = await fetch('/api/termine', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kundeId, filialeId, datum, beschreibung }),
    })
    const daten = await antwort.json()

    setLaeuft(false)
    if (antwort.ok) {
      setMeldung({ art: 'ok', text: 'Termin angelegt.' })
      setBeschreibung('')
      router.refresh()
    } else {
      setMeldung({ art: 'fehler', text: daten.fehler ?? 'Das hat nicht geklappt.' })
    }
  }

  return (
    <form className="karte" onSubmit={absenden}>
      {meldung && <div className={`meldung ${meldung.art}`}>{meldung.text}</div>}

      <label htmlFor="datum">Wunschdatum</label>
      <input
        id="datum"
        type="date"
        value={datum}
        onChange={(e) => setDatum(e.target.value)}
        required
      />

      <label htmlFor="filiale">Filiale</label>
      <select
        id="filiale"
        value={filialeId}
        onChange={(e) => setFilialeId(Number(e.target.value))}
      >
        {FILIALEN.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <label htmlFor="beschreibung">Was ist am Rad zu tun?</label>
      <textarea
        id="beschreibung"
        rows={3}
        value={beschreibung}
        onChange={(e) => setBeschreibung(e.target.value)}
        required
      />

      <button type="submit" disabled={laeuft}>
        {laeuft ? 'Wird gesendet...' : 'Termin buchen'}
      </button>
    </form>
  )
}
