import { useEffect, useId, useRef, useState } from 'react'
import { formatCurrency } from '../../lib/money'
import './Savings.css'

// Semanas por mês (52/12). Os demais valores são só pontos de partida: a pessoa move os controles pro número dela.
const WEEKS_PER_MONTH = 4.33

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Anima de um número até o próximo (ease-out). O loop para sozinho quando chega. */
function useAnimatedNumber(target: number, durationMs = 600) {
  const reduced = prefersReducedMotion()
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (reduced) return
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const next = from + (target - from) * (1 - Math.pow(1 - t, 3))
      fromRef.current = next
      setValue(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, reduced])

  return reduced ? target : value
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format: (value: number) => string
  /** Frase completa pro leitor de tela (ex.: "6 minutos por reserva"). */
  spoken: (value: number) => string
  onChange: (value: number) => void
}

function Slider({ label, value, min, max, step = 1, format, spoken, onChange }: SliderProps) {
  const id = useId()
  return (
    <div className="savings__slider">
      <div className="savings__slider-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} aria-hidden="true">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={spoken(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

export default function Savings() {
  const [bookingsPerWeek, setBookingsPerWeek] = useState(40)
  const [minutesPerBooking, setMinutesPerBooking] = useState(6)
  const [noShowPercent, setNoShowPercent] = useState(8)
  const [averagePrice, setAveragePrice] = useState(100)

  // Os números só começam a contar quando a seção entra na tela.
  const sectionRef = useRef<HTMLElement | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const bookings = bookingsPerWeek * WEEKS_PER_MONTH
  const hoursOnChat = (bookings * minutesPerBooking) / 60
  const lostRevenue = bookings * (noShowPercent / 100) * averagePrice

  const shownHours = useAnimatedNumber(seen ? hoursOnChat : 0)
  const shownRevenue = useAnimatedNumber(seen ? lostRevenue : 0)

  return (
    <section className="savings" aria-labelledby="savings-title" ref={sectionRef}>
      <div className="savings__inner">
        <div className="savings__intro">
          <h2 id="savings-title">Faça a conta com os seus números</h2>
          <p>
            É uma estimativa pra você enxergar o tamanho do problema hoje, com o que você mesmo informar. Não é promessa
            de resultado.
          </p>
        </div>

        <div className="savings__grid">
          <form className="savings__inputs" onSubmit={(event) => event.preventDefault()}>
            <Slider
              label="Reservas por semana"
              value={bookingsPerWeek}
              min={5}
              max={300}
              onChange={setBookingsPerWeek}
              format={(v) => String(v)}
              spoken={(v) => `${v} reservas por semana`}
            />
            <Slider
              label="Minutos no WhatsApp por reserva"
              value={minutesPerBooking}
              min={1}
              max={20}
              onChange={setMinutesPerBooking}
              format={(v) => `${v} min`}
              spoken={(v) => `${v} minutos por reserva`}
            />
            <Slider
              label="Faltas sem aviso"
              value={noShowPercent}
              min={0}
              max={30}
              onChange={setNoShowPercent}
              format={(v) => `${v}%`}
              spoken={(v) => `${v} por cento de faltas sem aviso`}
            />
            <Slider
              label="Valor médio da reserva"
              value={averagePrice}
              min={30}
              max={300}
              step={5}
              onChange={setAveragePrice}
              format={(v) => formatCurrency(v)}
              spoken={(v) => `${formatCurrency(v)} por reserva`}
            />
          </form>

          <div className="savings__result">
            {/* A contagem animada fica fora do leitor de tela; ele recebe só o valor final, sem passos intermediários. */}
            <p className="sr-only" aria-live="polite">
              {`${hoursOnChat.toFixed(1).replace('.', ',')} horas por mês só confirmando horário por mensagem e ${formatCurrency(lostRevenue)} por mês em horários vazios por falta sem aviso.`}
            </p>
            <p aria-hidden="true">
              <strong>{shownHours.toFixed(1).replace('.', ',')} h</strong>
              <span>por mês só confirmando horário por mensagem</span>
            </p>
            <p aria-hidden="true">
              <strong>{formatCurrency(shownRevenue)}</strong>
              <span>por mês em horários que ficam vazios por falta sem aviso</span>
            </p>
            <small>
              Com reserva online, o cliente agenda sozinho a qualquer hora e você enxerga a grade em tempo real.
            </small>
          </div>
        </div>
      </div>
    </section>
  )
}
