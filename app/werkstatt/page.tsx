import Terminuebersicht from './Terminuebersicht'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function Werkstatt() {
  const session = await getSession()

  // Only workshop staff and administration reach the workshop view.
  if (!session || (session.rolle !== 'werkstatt' && session.rolle !== 'verwaltung')) {
    return (
      <>
        <h1>Werkstatt</h1>
        <p className="lead">
          Dieser Bereich ist der Werkstatt und der Verwaltung vorbehalten. Bitte oben
          rechts ein passendes Konto auswaehlen.
        </p>
      </>
    )
  }

  const einleitung =
    session.rolle === 'verwaltung'
      ? 'Alle Termine beider Filialen. Status aendern, sobald ein Rad angenommen, in Arbeit oder fertig ist.'
      : 'Die Termine deiner Filiale. Status aendern, sobald ein Rad angenommen, in Arbeit oder fertig ist.'

  return (
    <>
      <h1>Werkstatt</h1>
      <p className="lead">{einleitung}</p>
      <Terminuebersicht />
    </>
  )
}
