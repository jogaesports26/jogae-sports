import { Link } from 'react-router-dom'
import { SITE, whatsappLink } from '../../lib/site'
import './Pricing.css'

const POINTS = [
  'Criar a conta e usar o painel é grátis, sem cartão de crédito.',
  'Sem taxa por reserva e sem taxa por transação.',
  'Sem fidelidade: você sai quando quiser.',
  'Quando os planos pagos chegarem, o modelo é mensalidade fixa — e você é avisado antes de qualquer cobrança.',
]

export default function Pricing() {
  const whatsapp = whatsappLink('Oi! Quero tirar uma dúvida sobre preço do Jogaê Sports.')
  const contactHref = whatsapp ?? (SITE.contactEmail ? `mailto:${SITE.contactEmail}` : null)

  return (
    <section className="pricing" id="preco" aria-labelledby="pricing-title">
      <h2 id="pricing-title">Quanto custa?</h2>
      <p className="pricing__subtitle">Sem pegadinha: aqui está o que vale hoje.</p>

      <div className="pricing__card">
        <p className="pricing__tag">Comece grátis</p>
        <ul>
          {POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <div className="pricing__actions">
          <Link to="/cadastro" className="landing__button landing__button--primary">
            Criar conta grátis
          </Link>
          {contactHref && (
            <a href={contactHref} className="landing__button landing__button--outline" target="_blank" rel="noreferrer">
              Tirar dúvida de preço
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
