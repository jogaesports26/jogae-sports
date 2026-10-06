import { Link } from 'react-router-dom'
import { PRIVACY, TERMS } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { SITE } from '../lib/site'
import './LegalPage.css'

export default function LegalPage({ kind }: { kind: 'termos' | 'privacidade' }) {
  const doc = kind === 'termos' ? TERMS : PRIVACY
  useDocumentTitle(`${doc.title} · Jogaê Sports`)

  return (
    <div className="legal">
      <header className="legal__nav">
        <Link to="/" className="legal__logo">
          Jogaê Sports
        </Link>
        <nav aria-label="Documentos">
          <Link to="/termos" aria-current={kind === 'termos' ? 'page' : undefined}>
            Termos de uso
          </Link>
          <Link to="/privacidade" aria-current={kind === 'privacidade' ? 'page' : undefined}>
            Privacidade
          </Link>
        </nav>
      </header>

      <main className="legal__content">
        <h1>{doc.title}</h1>
        <p className="legal__updated">Atualizado em {SITE.legalUpdatedAt}</p>
        <p>{doc.intro}</p>

        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}
