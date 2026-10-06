import { useEffect, useState } from 'react'
import { TESTIMONIALS } from '../../content/testimonials'
import { fetchPublicStats } from '../../lib/stats'
import type { PublicStats } from '../../lib/stats'
import { SITE } from '../../lib/site'
import './SocialProof.css'

const number = new Intl.NumberFormat('pt-BR')

/**
 * Prova social só com o que é real:
 *  - números vindos do banco (VITE_SHOW_STATS=true liga; fica desligado enquanto houver dado de demonstração em produção);
 *  - depoimentos autorizados (content/testimonials.ts).
 * Sem nenhum dos dois, a seção não renderiza.
 */
export default function SocialProof() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    if (!SITE.showStats) return
    fetchPublicStats().then(setStats)
  }, [])

  const hasStats = Boolean(stats && stats.establishments > 0)
  if (!hasStats && TESTIMONIALS.length === 0) return null

  return (
    <section className="social-proof" aria-labelledby="social-proof-title">
      <h2 id="social-proof-title">Quem já usa</h2>

      {hasStats && stats && (
        <dl className="social-proof__stats">
          <div>
            <dd>{number.format(stats.establishments)}</dd>
            <dt>{stats.establishments === 1 ? 'estabelecimento' : 'estabelecimentos'}</dt>
          </div>
          <div>
            <dd>{number.format(stats.courts)}</dd>
            <dt>{stats.courts === 1 ? 'quadra cadastrada' : 'quadras cadastradas'}</dt>
          </div>
          <div>
            <dd>{number.format(stats.reservations)}</dd>
            <dt>{stats.reservations === 1 ? 'reserva feita' : 'reservas feitas'}</dt>
          </div>
        </dl>
      )}

      {TESTIMONIALS.length > 0 && (
        <div className="social-proof__quotes">
          {TESTIMONIALS.map((item) => (
            <figure key={`${item.name}-${item.establishment}`} className="social-proof__quote">
              <blockquote>{item.quote}</blockquote>
              <figcaption>
                {item.photoUrl && <img src={item.photoUrl} alt="" width={40} height={40} loading="lazy" />}
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.role} · {item.establishment}
                  </small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}
