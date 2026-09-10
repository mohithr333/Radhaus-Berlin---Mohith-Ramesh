'use client'

import { useRouter } from 'next/navigation'

// Login is hard-wired for this exercise environment: pick an account and the
// portal treats you as that person.
const KONTEN = [
  { id: 0, label: 'Nicht angemeldet', rolle: 'besucher' },
  { id: 1, label: 'Mira Sandberg (Kundin)', rolle: 'kunde' },
  { id: 2, label: 'Jonas Kreft (Kunde)', rolle: 'kunde' },
  { id: 3, label: 'Ayse Demirel (Kundin)', rolle: 'kunde' },
  { id: 4, label: 'Tom Baumgart (Werkstatt)', rolle: 'werkstatt' },
  { id: 5, label: 'Rita Ohlsen (Werkstatt)', rolle: 'werkstatt' },
  { id: 6, label: 'Katrin Lubitz (Verwaltung)', rolle: 'verwaltung' },
]

export default function Benutzerwechsel({ aktiv }: { aktiv: number }) {
  const router = useRouter()

  function wechseln(id: number) {
    const konto = KONTEN.find((k) => k.id === id)
    if (!konto || konto.id === 0) {
      document.cookie = 'kunde_id=; path=/; max-age=0'
      document.cookie = 'rolle=; path=/; max-age=0'
    } else {
      document.cookie = `kunde_id=${konto.id}; path=/; max-age=86400`
      document.cookie = `rolle=${konto.rolle}; path=/; max-age=86400`
    }
    router.refresh()
  }

  return (
    <select
      aria-label="Angemeldet als"
      value={aktiv}
      onChange={(e) => wechseln(Number(e.target.value))}
      style={{ width: 'auto', marginBottom: 0, fontSize: 13 }}
    >
      {KONTEN.map((k) => (
        <option key={k.id} value={k.id}>
          {k.label}
        </option>
      ))}
    </select>
  )
}
