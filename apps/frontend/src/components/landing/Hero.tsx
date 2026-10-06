import { Link } from 'react-router-dom'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy, Whistle } from '../../pages/SportIcons'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SITE } from '../../lib/site'
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
          Agenda, reservas online e financeiro em um só painel — sem horário duplicado, sem
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
          {SITE.whatsapp && <li>Suporte direto no WhatsApp</li>}
        </ul>
      </div>

      <div className="hero__mockup-wrap reveal" ref={mockupRef}>
        <figure className="hero__shots">
          <div className="hero__browser">
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
          <div className="hero__phone">
            <img
              src="/landing/quadra.jpg"
              width={390}
              height={844}
              alt="Página de reserva de uma quadra, vista no celular"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption>Telas reais do produto, com dados de demonstração.</figcaption>
        </figure>

        <div className="hero__badge hero__badge--booking">
          <span className="hero__badge-icon hero__badge-icon--positive" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <strong>Reserva feita pelo link</strong>
            <small>sem mensagem no WhatsApp</small>
          </span>
        </div>
      </div>
    </section>
  )
}
