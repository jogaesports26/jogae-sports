import { Link } from 'react-router-dom'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import Comparison from '../components/landing/Comparison'
import FAQ from '../components/landing/FAQ'
import { useScrollReveal } from '../hooks/useScrollReveal'
import './LandingPage.css'

function IconAgenda() {
  const ACCENT = '#ACEC00'
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="30" height="26" rx="4" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M3 14h30M11 3v6M25 3v6" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="13" y="19" width="6" height="6" rx="1.5" fill={ACCENT} />
    </svg>
  )
}

function IconReservas() {
  const ACCENT = '#ACEC00'
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="15" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M18 10v8l6 4" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPagamentos() {
  const ACCENT = '#ACEC00'
  return (
    <svg viewBox="0 0 36 28" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="32" height="20" rx="4" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M2 12h32" stroke={ACCENT} strokeWidth="2.2" />
      <rect x="7" y="17" width="10" height="3" rx="1.5" fill={ACCENT} />
    </svg>
  )
}

function IconEsportes() {
  const ACCENT = '#ACEC00'
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="15" stroke={ACCENT} strokeWidth="2.2" />
      <path
        d="M18 3c8 5 8 27 0 32M4 12c8 4 20 4 28 3M4 24c8-4 20-4 28-3"
        stroke={ACCENT}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPainel() {
  const ACCENT = '#ACEC00'
  return (
    <svg viewBox="0 0 36 32" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="32" height="24" rx="4" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M2 10h32M11 10v16" stroke={ACCENT} strokeWidth="1.6" />
      <rect x="15" y="14" width="14" height="4" rx="1.5" fill={ACCENT} fillOpacity="0.3" />
      <rect x="15" y="20" width="9" height="4" rx="1.5" fill={ACCENT} fillOpacity="0.3" />
      <path d="M10 30h16" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

const FEATURES = [
  {
    Icon: IconAgenda,
    title: 'Agenda online',
    description: 'Organize horários e disponibilidade da sua quadra em um calendário simples de usar.',
  },
  {
    Icon: IconReservas,
    title: 'Reservas em tempo real',
    description: 'Jogadores reservam direto pelo sistema, sem trocar mensagem pra confirmar horário.',
  },
  {
    Icon: IconPagamentos,
    title: 'Pagamentos integrados',
    description: 'Receba online e acompanhe o financeiro do seu estabelecimento em um só lugar.',
  },
  {
    Icon: IconEsportes,
    title: 'Múltiplos esportes',
    description: 'Futebol, vôlei, tênis, beach tennis e mais — cadastre quantas quadras precisar.',
  },
  {
    Icon: IconPainel,
    title: 'Painel de gestão simples',
    description: 'Veja reservas, ocupação e relatórios sem complicação, direto do painel do dono.',
  },
]

function Features() {
  const gridRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="landing__features" id="funcionalidades">
      <h2>Tudo que você precisa pra administrar sua quadra</h2>
      <p className="landing__features-subtitle">
        O Jogaê Sports reúne as ferramentas essenciais pra você parar de perder tempo com
        planilha e WhatsApp.
      </p>

      <div className="landing__features-grid reveal-stagger" ref={gridRef}>
        {FEATURES.map(({ Icon, title, description }) => (
          <div className="landing__feature-card" key={title}>
            <div className="landing__feature-icon">
              <Icon />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>

      <p className="landing__features-soon">
        <span className="landing__features-soon-tag">Em breve</span>
        Assistente inteligente pra ajudar o jogador a encontrar horário e reservar sozinho.
      </p>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__nav">
        <span className="landing__logo">Jogaê Sports</span>
        <nav className="landing__nav-links">
          <a href="#funcionalidades">Funcionalidades</a>
          <Link to="/login" className="landing__nav-login">
            Entrar
          </Link>
          <Link to="/cadastro" className="landing__nav-cta">
            Criar conta
          </Link>
        </nav>
      </header>

      <Hero />
      <HowItWorks />
      <Features />
      <Comparison />
      <FAQ />

      <section className="landing__cta">
        <h2>Comece a gerenciar sua quadra hoje</h2>
        <p>Cadastro rápido, sem cartão de crédito.</p>
        <Link to="/cadastro" className="landing__button landing__button--primary">
          Criar conta grátis
        </Link>
      </section>

      <footer className="landing__footer">
        <div className="landing__footer-columns">
          <div className="landing__footer-brand">
            <strong>Jogaê Sports</strong>
            <p>Agenda, reservas online e financeiro da sua quadra num só painel.</p>
          </div>
          <nav className="landing__footer-col" aria-label="Produto">
            <span>Produto</span>
            <a href="#como-funciona">Como funciona</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#perguntas-frequentes">Perguntas frequentes</a>
          </nav>
          <nav className="landing__footer-col" aria-label="Acesso">
            <span>Acesso</span>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Criar conta grátis</Link>
            <Link to="/minhas-reservas">Sou jogador: minhas reservas</Link>
          </nav>
        </div>
        <p className="landing__footer-bottom">© 2026 Jogaê Sports. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
