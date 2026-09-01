import { useScrollReveal } from '../../hooks/useScrollReveal'
import './HowItWorks.css'

const STEPS = [
  {
    number: '01',
    title: 'Cadastre sua estrutura',
    description:
      'Configure suas quadras, modalidades e valores por horário em menos de 2 minutos.',
  },
  {
    number: '02',
    title: 'Compartilhe seu link',
    description:
      'Envie o link da sua página de reservas no WhatsApp e Instagram do seu espaço.',
  },
  {
    number: '03',
    title: 'Receba no piloto automático',
    description:
      'Seus clientes agendam e pagam sozinhos, sem risco de horário duplicado ou calote.',
  },
]

export default function HowItWorks() {
  const gridRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="how-it-works" id="como-funciona">
      <h2>Como funciona</h2>
      <p className="how-it-works__subtitle">
        Do cadastro à primeira reserva, em três passos simples.
      </p>

      <div className="how-it-works__grid reveal-stagger" ref={gridRef}>
        {STEPS.map((step) => (
          <div className="how-it-works__card" key={step.number}>
            <span className="how-it-works__number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
