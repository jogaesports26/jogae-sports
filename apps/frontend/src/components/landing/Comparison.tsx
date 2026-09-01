import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Comparison.css'

const MANUAL_ITEMS = [
  'Horários duplicados por distração no chat.',
  'Cobranças manuais com risco de calote ou esquecimento.',
  'Mensagens fora de horário para saber se há vaga.',
  'Horas perdidas consolidando fechamento do mês.',
]

const JOGAE_ITEMS = [
  'Grade atualizada em tempo real para você e seus clientes.',
  'Pagamento integrado no ato da reserva.',
  'Link de autoatendimento 24h por dia.',
  'Relatório financeiro e taxa de ocupação instantâneos.',
]

export default function Comparison() {
  const gridRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="comparison">
      <h2>Planilha e WhatsApp vs. Jogaê Sports</h2>
      <p className="comparison__subtitle">
        Veja o que muda no seu dia a dia quando você para de gerenciar tudo manualmente.
      </p>

      <div className="comparison__grid reveal-stagger" ref={gridRef}>
        <div className="comparison__column comparison__column--manual">
          <h3>Controle manual / WhatsApp</h3>
          <ul>
            {MANUAL_ITEMS.map((item) => (
              <li key={item}>
                <span className="comparison__icon comparison__icon--no" aria-hidden="true">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="comparison__column comparison__column--jogae">
          <h3>Com Jogaê Sports</h3>
          <ul>
            {JOGAE_ITEMS.map((item) => (
              <li key={item}>
                <span className="comparison__icon comparison__icon--yes" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
