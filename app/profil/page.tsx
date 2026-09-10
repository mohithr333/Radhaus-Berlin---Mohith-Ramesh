import ProfilFormular from './ProfilFormular'

export const dynamic = 'force-dynamic'

export default function Profil() {
  return (
    <>
      <h1>Mein Profil</h1>
      <p className="lead">Adresse und Telefonnummer pflegst du hier selbst.</p>
      <ProfilFormular />
    </>
  )
}
