import { Link, useParams } from 'react-router-dom'
import { PRIVACY, TERMS } from '../content/legal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { SITE } from '../lib/site'
import './LegalPage.css'

export default function LegalPage({ kind }: { kind: 'termos' | 'privacidade' }) {
  const doc = kind === 'termos' ? TERMS : PRIVACY
  // Dentro da lojinha de uma arena (/:slug/termos) o cabeçalho, as cores e o logo são os dela; fora, é o Jogaê.
  const { slug } = useParams<{ slug?: string }>()
  const embedded = Boolean(slug)
  const base = slug ? `/${slug}` : ''
  useDocumentTitle(embedded ? doc.title : `${doc.title} · Jogaê`)

  return (
    <div className={`legal${embedded ? ' legal--embedded' : ''}`}>
      {embedded ? (
        <nav className="legal__tabs" aria-label="Documentos">
          <Link to={`${base}/termos`} aria-current={kind === 'termos' ? 'page' : undefined}>
            Termos de uso
          </Link>
          <Link to={`${base}/privacidade`} aria-current={kind === 'privacidade' ? 'page' : undefined}>
            Privacidade
          </Link>
        </nav>
      ) : (
      <header className="legal__nav">
        <Link to="/" className="legal__logo">
          Jogaê
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
      )}

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

        <section className="legal__operator" aria-label="Responsável pela plataforma">
          <h2>Quem opera a plataforma</h2>
          <p>
            As reservas deste site são feitas pela plataforma <strong>{SITE.name}</strong>.
            {SITE.contactEmail && (
              <>
                {' '}
                Contato: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
              </>
            )}
            {SITE.cnpj && <> CNPJ {SITE.cnpj}.</>}
          </p>
        </section>
      </main>
    </div>
  )
}
