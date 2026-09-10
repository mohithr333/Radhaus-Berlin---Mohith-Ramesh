import Terminuebersicht from './Terminuebersicht'

export const dynamic = 'force-dynamic'

export default function Werkstatt() {
  return (
    <>
      <h1>Werkstatt</h1>
      <p className="lead">
        Alle Termine beider Filialen. Status aendern, sobald ein Rad angenommen, in Arbeit oder
        fertig ist.
      </p>
      <Terminuebersicht />
    </>
  )
}
