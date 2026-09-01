import { useState } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './FAQ.css'

const FAQ_ITEMS = [
  {
    question: 'Preciso pagar taxa por reserva realizada?',
    answer:
      'Não. A mensalidade do Jogaê Sports é fixa, sem taxa por reserva ou por transação processada no sistema.',
  },
  {
    question: 'Consigo reservar horários fixos para alunos e mensalistas?',
    answer:
      'Sim. Você pode bloquear horários recorrentes pra mensalistas direto na agenda, sem risco de sobreposição com reservas avulsas.',
  },
  {
    question: 'O sistema funciona direto no celular sem precisar instalar aplicativo?',
    answer:
      'Sim, o Jogaê Sports funciona 100% pelo navegador, tanto pra você quanto pros seus clientes — sem app pra baixar.',
  },
  {
    question: 'Posso gerenciar mais de uma quadra ou esporte no mesmo painel?',
    answer:
      'Sim. Cadastre quantas quadras e modalidades esportivas quiser, tudo dentro do mesmo painel de gestão.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const listRef = useScrollReveal<HTMLDivElement>()

  function toggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index))
  }

  return (
    <section className="faq">
      <h2>Perguntas frequentes</h2>

      <div className="faq__list reveal-stagger" ref={listRef}>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div className="faq__item" key={item.question}>
              <h3>
                <button
                  id={buttonId}
                  className="faq__question"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                >
                  {item.question}
                  <span className="faq__chevron" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`faq__answer ${isOpen ? 'faq__answer--open' : ''}`}
              >
                <p>{item.answer}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
