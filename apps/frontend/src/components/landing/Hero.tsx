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
        <h1>Zero conflito de horários, zero perda de tempo.</h1>
        <p className="hero__headline-highlight">
          Automatize a gestão da sua quadra esportiva.
        </p>
        <p className="hero__subtitle">
          Diga adeus à confusão de mensagens no WhatsApp e cadernos de anotações. Centralize
          grade de horários, reservas online e pagamentos em um painel simples e em tempo real.
        </p>
        <div className="hero__actions">
          <Link to="/cadastro" className="landing__button landing__button--primary">
            Criar conta grátis
          </Link>
          <a href="#como-funciona" className="landing__button landing__button--ghost">
            Ver como funciona
          </a>
        </div>
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
            📅
          </span>
          <span>
            <strong>Grade 100% ocupada</strong>
            <small>hoje</small>
          </span>
        </div>
      </div>
    </section>
  )
}
