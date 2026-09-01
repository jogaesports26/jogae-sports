import { Link } from 'react-router-dom'
import DeviceMockup from './DeviceMockup'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy, Whistle } from './SportIcons'
import './LandingPage.css'

const ACCENT = '#1E88E5'

function IconAgenda() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="30" height="26" rx="4" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M3 14h30M11 3v6M25 3v6" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="13" y="19" width="6" height="6" rx="1.5" fill={ACCENT} />
    </svg>
  )
}

function IconReservas() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="15" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M18 10v8l6 4" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPagamentos() {
  return (
    <svg viewBox="0 0 36 28" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="32" height="20" rx="4" stroke={ACCENT} strokeWidth="2.2" />
      <path d="M2 12h32" stroke={ACCENT} strokeWidth="2.2" />
      <rect x="7" y="17" width="10" height="3" rx="1.5" fill={ACCENT} />
    </svg>
  )
}

function IconEsportes() {
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

function IconChatbot() {
  return (
    <svg viewBox="0 0 36 34" fill="none" aria-hidden="true">
      <path
        d="M3 6a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H14l-7 7v-7H7a4 4 0 0 1-4-4V6Z"
        stroke={ACCENT}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="1.8" fill={ACCENT} />
      <circle cx="18" cy="13" r="1.8" fill={ACCENT} />
      <circle cx="24" cy="13" r="1.8" fill={ACCENT} />
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
  {
    Icon: IconChatbot,
    title: 'Chatbot inteligente',
    description: 'Assistente pra ajudar o jogador a encontrar e reservar quadras. (em breve)',
  },
]

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

      <section className="landing__hero">
        <div className="landing__hero-icons">
          <SoccerBall className="landing__hero-icon landing__hero-icon--1" />
          <Basketball className="landing__hero-icon landing__hero-icon--2" />
          <Volleyball className="landing__hero-icon landing__hero-icon--3" />
          <TennisBall className="landing__hero-icon landing__hero-icon--4" />
          <Trophy className="landing__hero-icon landing__hero-icon--5" />
          <Whistle className="landing__hero-icon landing__hero-icon--6" />
        </div>

        <div className="landing__hero-content">
          <h1>Gestão completa para sua quadra esportiva</h1>
          <p>
            Agenda online, reservas, pagamentos e muito mais. Tudo em um só lugar, feito pra donos
            de quadra que querem simplicidade e controle.
          </p>
          <div className="landing__hero-actions">
            <Link to="/cadastro" className="landing__button landing__button--primary">
              Criar conta grátis
            </Link>
            <Link to="/login" className="landing__button landing__button--ghost">
              Já tenho conta
            </Link>
          </div>
        </div>

        <DeviceMockup className="landing__hero-mockup" />
      </section>

      <section className="landing__features" id="funcionalidades">
        <h2>Tudo que você precisa pra administrar sua quadra</h2>
        <p className="landing__features-subtitle">
          O Jogaê Sports reúne as ferramentas essenciais pra você parar de perder tempo com
          planilha e WhatsApp.
        </p>

        <div className="landing__features-grid">
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
      </section>

      <section className="landing__cta">
        <h2>Comece a gerenciar sua quadra hoje</h2>
        <p>Cadastro rápido, sem cartão de crédito.</p>
        <Link to="/cadastro" className="landing__button landing__button--white">
          Criar conta grátis
        </Link>
      </section>

      <footer className="landing__footer">
        <span>Jogaê Sports - Gestão</span>
        <span>© 2026 Jogaê Sports. Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}
