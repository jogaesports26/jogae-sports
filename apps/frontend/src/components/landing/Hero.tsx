import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../lib/site'
import './Hero.css'

const BOOKINGS = ['Quadra 1 · hoje, 19h', 'Quadra 2 · hoje, 20h', 'Quadra 3 · amanhã, 18h']

export default function Hero() {
  // O selo troca de reserva a cada poucos segundos (parado em prefers-reduced-motion).
  const [booking, setBooking] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setBooking((n) => (n + 1) % BOOKINGS.length), 3400)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="hero">
      <div className="hero__panel" aria-hidden="true">
        {/* Marcação de quadra: linha do meio e círculo central, só como textura. */}
        <svg className="hero__court" viewBox="0 0 600 600" fill="none">
          <line x1="300" y1="-40" x2="300" y2="640" />
          <circle cx="300" cy="300" r="150" />
          <path d="M300 90 a210 210 0 0 1 0 420" />
        </svg>
      </div>

      <div className="hero__content">
        <h1>Sua quadra parou de depender do WhatsApp.</h1>
        <p className="hero__subtitle">
          Agenda, reservas online e financeiro em um só painel — sem horário duplicado, sem
          mensagem fora de hora, sem planilha pra fechar o mês.
        </p>
        <div className="hero__actions">
          <Link to="/cadastro" className="landing__button landing__button--primary">
            Criar conta grátis
          </Link>
          <a href="#como-funciona" className="landing__button landing__button--ghost">
            Ver como funciona
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10m0 0l4-4m-4 4L4 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        <ul className="hero__proof">
          <li>Sem taxa por reserva</li>
          <li>Sem fidelidade</li>
          {SITE.whatsapp && <li>Suporte direto no WhatsApp</li>}
        </ul>

        {/* Seta desenhada à mão do título até o botão; traça sozinha ao carregar. */}
        <svg className="hero__arrow" viewBox="0 0 170 240" fill="none" aria-hidden="true">
          <path
            className="hero__arrow-line"
            pathLength="1"
            d="M10 10 C 150 0, 192 64, 168 132 C 148 192, 90 224, 26 214"
          />
          <path
            className="hero__arrow-head"
            pathLength="1"
            d="M48 196 L26 214 L52 228"
          />
        </svg>
      </div>

      <figure className="hero__stage">
        <div className="hero__browser" data-drift="slow">
          <div className="hero__browser-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <img
            src="/landing/painel.jpg"
            width={1360}
            height={860}
            alt="Painel do Jogaê Sports com faturamento do mês, ocupação e as reservas de hoje"
            fetchPriority="high"
          />
        </div>

        <div className="hero__phone" data-drift="fast">
          <img
            src="/landing/quadra.jpg"
            width={390}
            height={844}
            alt="Página de reserva de uma quadra, vista no celular"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="hero__badge hero__badge--booking" data-drift="mid">
          <span key={booking} className="hero__badge-icon hero__badge-icon--positive hero__badge-icon--pop" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <strong>Reserva feita pelo link</strong>
            <small key={booking} className="hero__badge-slot">{BOOKINGS[booking]}</small>
          </span>
        </div>

        <figcaption>Telas reais do produto, com dados de demonstração.</figcaption>
      </figure>
    </section>
  )
}
