import { Link } from 'react-router-dom'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import Comparison from '../components/landing/Comparison'
import FAQ from '../components/landing/FAQ'
import Pricing from '../components/landing/Pricing'
import SocialProof from '../components/landing/SocialProof'
import { CalendarIcon, SoccerBall, Stopwatch, Trophy, Whistle } from './SportIcons'
import { SITE, whatsappLink } from '../lib/site'
import { useScrollReveal } from '../hooks/useScrollReveal'
import './LandingPage.css'

const FEATURES = [
  {
    Icon: CalendarIcon,
    title: 'Agenda online',
    description: 'Organize horários e disponibilidade da sua quadra em um calendário simples de usar.',
  },
  {
    Icon: Stopwatch,
    title: 'Reservas em tempo real',
    description: 'Jogadores reservam direto pelo sistema, sem trocar mensagem pra confirmar horário.',
  },
  {
    Icon: Trophy,
    title: 'Financeiro e relatórios',
    description: 'Faturamento, ocupação e meta do mês calculados sozinhos — sem planilha pra fechar no fim do mês.',
  },
  {
    Icon: SoccerBall,
    title: 'Múltiplos esportes',
    description: 'Futebol, vôlei, tênis, beach tennis e mais — cadastre quantas quadras precisar.',
  },
  {
    Icon: Whistle,
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
        Pagamento online com Pix na hora da reserva e assistente inteligente pra ajudar o jogador a reservar sozinho.
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
      <SocialProof />
      <Pricing />
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
            <a href="#preco">Preço</a>
            <a href="#perguntas-frequentes">Perguntas frequentes</a>
          </nav>
          <nav className="landing__footer-col" aria-label="Acesso">
            <span>Acesso</span>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Criar conta grátis</Link>
            <Link to="/minhas-reservas">Sou jogador: minhas reservas</Link>
          </nav>
          <nav className="landing__footer-col" aria-label="Legal">
            <span>Legal</span>
            <Link to="/termos">Termos de uso</Link>
            <Link to="/privacidade">Política de privacidade</Link>
          </nav>
          {(SITE.contactEmail || SITE.whatsapp) && (
            <div className="landing__footer-col">
              <span>Contato</span>
              {SITE.contactEmail && <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>}
              {SITE.whatsapp && (
                <a href={whatsappLink() ?? '#'} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
        <p className="landing__footer-bottom">
          © 2026 Jogaê Sports. Todos os direitos reservados.
          {SITE.cnpj && ` · CNPJ ${SITE.cnpj}`}
        </p>
      </footer>
    </div>
  )
}
