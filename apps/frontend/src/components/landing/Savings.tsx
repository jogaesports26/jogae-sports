import { useState } from 'react'
import { formatCurrency } from '../../lib/money'
import './Savings.css'

// Semanas por mês (52/12). Os demais valores são só pontos de partida: a pessoa troca pelos números dela.
const WEEKS_PER_MONTH = 4.33

function toNumber(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export default function Savings() {
  const [bookingsPerWeek, setBookingsPerWeek] = useState('40')
  const [minutesPerBooking, setMinutesPerBooking] = useState('6')
  const [noShowPercent, setNoShowPercent] = useState('8')
  const [averagePrice, setAveragePrice] = useState('100')

  const bookings = toNumber(bookingsPerWeek) * WEEKS_PER_MONTH
  const hoursOnChat = (bookings * toNumber(minutesPerBooking)) / 60
  const lostRevenue = bookings * (Math.min(toNumber(noShowPercent), 100) / 100) * toNumber(averagePrice)

  return (
    <section className="savings" aria-labelledby="savings-title">
      <h3 id="savings-title">Faça a conta com os seus números</h3>
      <p className="savings__intro">
        É uma estimativa pra você enxergar o tamanho do problema hoje, com o que você mesmo informar. Não é promessa de
        resultado.
      </p>

      <div className="savings__grid">
        <form className="savings__inputs" onSubmit={(event) => event.preventDefault()}>
          <label className="field field--sm">
            <span>Reservas por semana</span>
            <input className="input" inputMode="numeric" value={bookingsPerWeek} onChange={(event) => setBookingsPerWeek(event.target.value)} />
          </label>
          <label className="field field--sm">
            <span>Minutos no WhatsApp por reserva</span>
            <input className="input" inputMode="numeric" value={minutesPerBooking} onChange={(event) => setMinutesPerBooking(event.target.value)} />
          </label>
          <label className="field field--sm">
            <span>Faltas sem aviso (%)</span>
            <input className="input" inputMode="numeric" value={noShowPercent} onChange={(event) => setNoShowPercent(event.target.value)} />
          </label>
          <label className="field field--sm">
            <span>Valor médio da reserva (R$)</span>
            <input className="input" inputMode="decimal" value={averagePrice} onChange={(event) => setAveragePrice(event.target.value)} />
          </label>
        </form>

        <div className="savings__result" aria-live="polite">
          <p>
            <strong>{hoursOnChat.toFixed(1).replace('.', ',')} h por mês</strong>
            <span>só confirmando horário por mensagem</span>
          </p>
          <p>
            <strong>{formatCurrency(lostRevenue)} por mês</strong>
            <span>em horários que ficam vazios por falta sem aviso</span>
          </p>
          <small>Com reserva online, o cliente agenda sozinho a qualquer hora e você enxerga a grade em tempo real.</small>
        </div>
      </div>
    </section>
  )
}
