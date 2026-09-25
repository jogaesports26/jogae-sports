import { Link } from 'react-router-dom'
import DeviceMockup from '../../pages/DeviceMockup'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy, Whistle } from '../../pages/SportIcons'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import './Hero.css'

export default function Hero() {
  const contentRef = useScrollReveal<HTMLDivElement>()
  const mockupRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="hero">
      <div className="hero__icons" aria-hidden="true">
        <SoccerBall className="hero__icon hero__icon--1" />
        <Basketball className="hero__icon hero__icon--2" />
        <Volleyball className="hero__icon hero__icon--3" />
        <TennisBall className="hero__icon hero__icon--4" />
        <Trophy className="hero__icon hero__icon--5" />
        <Whistle className="hero__icon hero__icon--6" />
      </div>

      <div className="hero__content reveal" ref={contentRef}>
        <h1>Sua quadra parou de depender do WhatsApp.</h1>
        <p className="hero__subtitle">
          Agenda, reservas online e pagamentos em um só painel — sem horário duplicado, sem
          mensagem fora de hora, sem planilha pra fechar o mês.
        </p>
        <div className="hero__actions">
          <Link to="/cadastro" className="landing__button landing__button--primary">
            Criar conta grátis
          </Link>
          <a href="#como-funciona" className="landing__button landing__button--ghost">
            Ver como funciona
          </a>
        </div>
        <ul className="hero__proof">
          <li>Sem taxa por reserva</li>
          <li>Sem fidelidade</li>
          <li>Suporte direto no WhatsApp</li>
        </ul>
      </div>

      <div className="hero__mockup-wrap reveal" ref={mockupRef}>
        <DeviceMockup className="hero__mockup" />

        <div className="hero__badge hero__badge--payment">
          <span className="hero__badge-dot" aria-hidden="true" />
          <span>
            <strong>+ R$ 140,00</strong>
            <small>Pix recebido (Quadra 2)</small>
          </span>
        </div>

        <div className="hero__badge hero__badge--occupancy">
          <span className="hero__badge-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <strong>Grade 100% ocupada</strong>
            <small>hoje</small>
          </span>
        </div>

        <div className="hero__badge hero__badge--booking">
          <span className="hero__badge-icon hero__badge-icon--positive" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <strong>Nova reserva pelo link</strong>
            <small>Sáb · 19h · sem mensagem no WhatsApp</small>
          </span>
        </div>
      </div>
    </section>
  )
}
