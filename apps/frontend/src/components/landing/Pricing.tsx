import { Link } from 'react-router-dom'
import { SITE, whatsappLink } from '../../lib/site'
import './Pricing.css'

type Plan = {
  id: string
  name: string
  pitch: string
  /** Valor da mensalidade, ex.: "R$ 99". Sem valor definido, o cartão mostra "Grátis no piloto". */
  price?: string
  includes?: string
  features: string[]
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 'R$ 49',
    pitch: 'Para largar o caderno e o WhatsApp e organizar as reservas.',
    features: [
      'Quadras ilimitadas',
      'Agenda do dia e da semana',
      'Página pública para o jogador reservar',
      'Comprovante e lembrete da reserva',
      'Lista de clientes',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: 'R$ 99',
    pitch: 'Para encher a agenda e saber quanto a arena rende.',
    includes: 'Tudo do Essencial, mais:',
    features: [
      'Relatórios e meta mensal',
      'Cupons de desconto',
      'Lista de espera',
      'Instrutores e aluguel de equipamentos',
      'Marca própria: logo, cores e capa',
    ],
    featured: true,
  },
  {
    id: 'completo',
    name: 'Completo',
    price: 'R$ 149',
    pitch: 'Para arenas com equipe e com o site da própria marca.',
    includes: 'Tudo do Profissional, mais:',
    features: [
      'Assistente com IA no portal do jogador',
      'Equipe com vários acessos',
      'Widget de reserva para o site da arena',
    ],
  },
]

const GUARANTEES = [
  'Sem taxa por reserva e sem taxa por transação.',
  'Sem fidelidade: você sai quando quiser.',
  'Você é avisado antes de qualquer cobrança.',
]

export default function Pricing() {
  const whatsapp = whatsappLink('Oi! Quero tirar uma dúvida sobre os planos do Jogaê.')
  const contactHref = whatsapp ?? (SITE.contactEmail ? `mailto:${SITE.contactEmail}` : null)

  return (
    <section className="pricing" id="preco" aria-labelledby="pricing-title">
      <h2 id="pricing-title">Escolha o plano da sua arena</h2>
      <p className="pricing__subtitle">
        Mensalidade fixa, por funcionalidade. Quadras e reservas nunca têm limite.
      </p>

      <div className="pricing__cards">
        {PLANS.map((plan) => (
          <article key={plan.id} className={`pricing__card${plan.featured ? ' pricing__card--featured' : ''}`}>
            {plan.featured && <p className="pricing__badge">Recomendado</p>}
            <h3>{plan.name}</h3>
            <p className="pricing__pitch">{plan.pitch}</p>
            <p className="pricing__price">
              {plan.price ? (
                <>
                  {plan.price}
                  <span> por mês</span>
                </>
              ) : (
                'Grátis no piloto'
              )}
            </p>
            {plan.includes && <p className="pricing__includes">{plan.includes}</p>}
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link
              to="/cadastro"
              className={`landing__button ${plan.featured ? 'landing__button--primary' : 'landing__button--outline'}`}
            >
              Criar conta grátis
            </Link>
          </article>
        ))}
      </div>

      <div className="pricing__footer">
        <ul className="pricing__guarantees">
          {GUARANTEES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="pricing__note">
          Valores de lançamento. Durante o piloto, todas as funcionalidades estão liberadas e não há cobrança. Em breve: pagamento online com Pix
          na hora da reserva.
        </p>
        {contactHref && (
          <a href={contactHref} className="pricing__contact" target="_blank" rel="noreferrer">
            Tirar dúvida sobre os planos
          </a>
        )}
      </div>
    </section>
  )
}
