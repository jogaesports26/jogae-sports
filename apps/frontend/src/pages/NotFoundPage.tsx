import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './NotFoundPage.css'

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada · Jogaê Sports')

  return (
    <main className="not-found">
      <h1>Página não encontrada</h1>
      <p>O link pode estar errado ou a página mudou de lugar.</p>
      <div className="not-found__actions">
        <Link to="/" className="btn btn--primary">
          Voltar pro início
        </Link>
        <Link to="/minhas-reservas" className="btn btn--outline">
          Minhas reservas
        </Link>
      </div>
    </main>
  )
}
