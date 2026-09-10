import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import Benutzerwechsel from './Benutzerwechsel'
import { getKundeId } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Radhaus Berlin - Werkstatt-Termine',
  description: 'Terminbuchung der Fahrradwerkstatt Radhaus Berlin (Uebungsumgebung).',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const kundeId = await getKundeId()

  return (
    <html lang="de">
      <body>
        <header className="top">
          <div className="inner">
            <Link href="/" className="marke">
              Radhaus Berlin
            </Link>
            <nav>
              <Link href="/">Start</Link>
              <Link href="/termine">Meine Termine</Link>
              <Link href="/werkstatt">Werkstatt</Link>
              <Link href="/profil">Profil</Link>
            </nav>
            <span className="spacer" />
            <Benutzerwechsel aktiv={kundeId ?? 0} />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
