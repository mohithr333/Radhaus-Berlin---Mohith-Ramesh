'use client'

import { useEffect, useState } from 'react'

interface Profil {
  id: number
  name: string
  email: string
  telefon: string
  adresse: string
  rolle: string
}

export default function ProfilFormular() {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [meldung, setMeldung] = useState<{ art: 'ok' | 'fehler'; text: string } | null>(null)
  const [laedt, setLaedt] = useState(true)

  useEffect(() => {
    fetch('/api/profil', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProfil(d.profil))
      .catch(() => setMeldung({ art: 'fehler', text: 'Bitte oben rechts ein Konto waehlen.' }))
      .finally(() => setLaedt(false))
  }, [])

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    if (!profil) return
    const antwort = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: profil.name,
        email: profil.email,
        telefon: profil.telefon,
        adresse: profil.adresse,
      }),
    })
    setMeldung(
      antwort.ok
        ? { art: 'ok', text: 'Gespeichert.' }
        : { art: 'fehler', text: 'Speichern fehlgeschlagen.' }
    )
  }

  if (laedt) return <div className="karte">Wird geladen...</div>
  if (!profil) return <div className="meldung fehler">{meldung?.text ?? 'Kein Profil.'}</div>

  return (
    <form className="karte" onSubmit={speichern}>
      {meldung && <div className={`meldung ${meldung.art}`}>{meldung.text}</div>}

      <label htmlFor="name">Name</label>
      <input
        id="name"
        value={profil.name}
        onChange={(e) => setProfil({ ...profil, name: e.target.value })}
      />

      <label htmlFor="email">E-Mail</label>
      <input
        id="email"
        type="email"
        value={profil.email}
        onChange={(e) => setProfil({ ...profil, email: e.target.value })}
      />

      <label htmlFor="telefon">Telefon</label>
      <input
        id="telefon"
        value={profil.telefon}
        onChange={(e) => setProfil({ ...profil, telefon: e.target.value })}
      />

      <label htmlFor="adresse">Adresse</label>
      <input
        id="adresse"
        value={profil.adresse}
        onChange={(e) => setProfil({ ...profil, adresse: e.target.value })}
      />

      <p className="hinweis">Rolle: {profil.rolle}</p>

      <button type="submit">Speichern</button>
    </form>
  )
}
