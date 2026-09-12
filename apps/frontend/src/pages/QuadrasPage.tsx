import { usePainelContext } from '../components/panel/PainelLayout'
import CourtList from '../components/panel/CourtList'
import './QuadrasPage.css'

export default function QuadrasPage() {
  const { onSessionExpired } = usePainelContext()

  return (
    <div className="quadras-page">
      <h1>Suas quadras</h1>
      <p className="quadras-page__subtitle">Cadastre suas quadras e configure os preços por horário.</p>

      <CourtList onSessionExpired={onSessionExpired} />
    </div>
  )
}
