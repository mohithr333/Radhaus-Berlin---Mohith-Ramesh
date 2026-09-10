'use client'

import { useState } from 'react'

export default function PasswortVergessen() {
  const [email, setEmail] = useState('')
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    const antwort = await fetch('/api/passwort-vergessen', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const daten = await antwort.json()
    setMeldung(
      antwort.ok
        ? { art: 'ok', text: daten.meldung }
        : { art: 'fehler', text: daten.fehler }
    )
  }

  return (
    <>
      <h1>Passwort zuruecksetzen</h1>
      <p className="lead">Wir schicken dir einen Link an deine hinterlegte Adresse.</p>

      <form className="karte" onSubmit={absenden}>
        {meldung && <div className={`meldung ${meldung.art}`}>{meldung.text}</div>}

        <label htmlFor="email">E-Mail-Adresse</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Link anfordern</button>
      </form>
    </>
  )
}
