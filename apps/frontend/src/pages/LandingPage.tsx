import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import Comparison from '../components/landing/Comparison'
import FAQ from '../components/landing/FAQ'
import Pricing from '../components/landing/Pricing'
import SocialProof from '../components/landing/SocialProof'
import Marquee from '../components/landing/Marquee'
import Savings from '../components/landing/Savings'
import { Basketball, CalendarIcon, SoccerBall, Stopwatch, TennisBall, Trophy, Volleyball, Whistle } from './SportIcons'
import { SITE, whatsappLink } from '../lib/site'
import { useScrollReveal } from '../hooks/useScrollReveal'
import './LandingPage.css'

const AGENDA_ROWS = [
  { hour: '18h', slots: [true, false, true] },
  { hour: '19h', slots: [true, true, false] },
  { hour: '20h', slots: [false, true, true] },
  { hour: '21h', slots: [true, false, false] },
  { hour: '22h', slots: [false, true, false] },
  { hour: '23h', slots: [true, false, true] },
]

const REVENUE_BARS = [38, 52, 44, 68, 60, 82, 74]

/** Mini agenda decorativa: horários ocupados (lima) e livres (tracejado) por quadra. */
function AgendaVisual() {
  let busyIndex = 0
  return (
    <div className="agenda-mini" aria-hidden="true">
      <div className="agenda-mini__row agenda-mini__row--head">
        <span />
        <b>Quadra 1</b>
        <b>Quadra 2</b>
        <b>Quadra 3</b>
      </div>
      {AGENDA_ROWS.map(({ hour, slots }) => (
        <div className="agenda-mini__row" key={hour}>
          <span className="agenda-mini__hour">{hour}</span>
          {slots.map((busy, i) => (
            <span
              key={i}
              className={busy ? 'agenda-mini__slot agenda-mini__slot--busy' : 'agenda-mini__slot'}
              style={busy ? ({ '--i': busyIndex++ } as CSSProperties) : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Barras decorativas do faturamento (sem valores: só a ideia de gráfico). */
function RevenueVisual() {
  return (
    <div className="bars" aria-hidden="true">
      {REVENUE_BARS.map((height, i) => (
        <span key={i} style={{ '--h': `${height}%`, '--i': i } as CSSProperties} />
      ))}
    </div>
  )
}

/** Selo "reservado agora" que pulsa, com um horário livre ao lado. */
function LiveVisual() {
  return (
    <div className="live-mini" aria-hidden="true">
      <div className="live-mini__row">
        <span className="live-mini__dot" />
        <b>Reservado agora</b>
        <small>Quadra 2 · 20h</small>
      </div>
      <div className="live-mini__row live-mini__row--idle">
        <span className="live-mini__dot live-mini__dot--idle" />
        <b>Horário livre</b>
        <small>Quadra 1 · 21h</small>
      </div>
    </div>
  )
}

/** Modalidades como círculos navy (o traço dos ícones é lima). */
function SportsVisual() {
  return (
    <div className="sports-mini" aria-hidden="true">
      {[SoccerBall, Volleyball, TennisBall, Basketball].map((Icon, i) => (
        <span key={i}>
          <Icon />
        </span>
      ))}
    </div>
  )
}

/** Barras de ocupação e meta do mês, só a ideia do painel (sem valores). */
function PanelVisual() {
  return (
    <div className="panel-mini" aria-hidden="true">
      <div>
        <span>Ocupação do mês</span>
        <i style={{ '--w': '72%' } as CSSProperties} />
      </div>
      <div>
        <span>Meta do mês</span>
        <i style={{ '--w': '54%' } as CSSProperties} />
      </div>
    </div>
  )
}

function Features() {
  const gridRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="landing__features" id="funcionalidades">
      <h2>Tudo que você precisa pra administrar sua quadra</h2>
      <p className="landing__features-subtitle">
        O Jogaê reúne as ferramentas essenciais pra você parar de perder tempo com
        planilha e WhatsApp.
      </p>

      <div className="bento reveal-stagger" ref={gridRef}>
        <article className="bento__card bento__card--agenda">
          <div className="landing__feature-icon">
            <CalendarIcon />
          </div>
          <h3>Agenda online</h3>
          <p>Organize horários e disponibilidade da sua quadra em um calendário simples de usar.</p>
          <AgendaVisual />
        </article>

        <article className="bento__card bento__card--revenue">
          <div className="landing__feature-icon">
            <Trophy />
          </div>
          <h3>Financeiro e relatórios</h3>
          <p>Faturamento, ocupação e meta do mês calculados sozinhos — sem planilha pra fechar no fim do mês.</p>
          <RevenueVisual />
        </article>

        <article className="bento__card bento__card--live">
          <div className="landing__feature-icon">
            <Stopwatch />
          </div>
          <h3>Reservas em tempo real</h3>
          <p>Jogadores reservam direto pelo sistema, sem trocar mensagem pra confirmar horário.</p>
          <LiveVisual />
        </article>

        <article className="bento__card bento__card--sports">
          <div className="landing__feature-icon">
            <SoccerBall />
          </div>
          <h3>Múltiplos esportes</h3>
          <p>Futebol, vôlei, tênis, beach tennis e mais — cadastre quantas quadras precisar.</p>
          <SportsVisual />
        </article>

        <article className="bento__card bento__card--panel">
          <div className="landing__feature-icon">
            <Whistle />
          </div>
          <h3>Painel de gestão simples</h3>
          <p>Veja reservas, ocupação e relatórios sem complicação, direto do painel do dono.</p>
          <PanelVisual />
        </article>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="landing">
      <a href="#conteudo" className="landing__skip">
        Pular para o conteúdo
      </a>
      <header className="landing__nav">
        <span className="landing__logo">Jogaê</span>
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

      <main id="conteudo" tabIndex={-1}>
      <Hero />
      <Marquee />
      <HowItWorks />
      <Features />
      <Comparison />
      <Savings />
      <SocialProof />
      <Pricing />
      <FAQ />

      <section className="landing__cta">
        <svg className="landing__cta-court" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <line pathLength="1" x1="300" y1="-40" x2="300" y2="640" />
          <circle pathLength="1" cx="300" cy="300" r="170" />
          <path pathLength="1" d="M300 70 a230 230 0 0 1 0 460" />
        </svg>
        <h2>Comece a gerenciar sua quadra hoje</h2>
        <p>Cadastro rápido, sem cartão de crédito.</p>
        <Link to="/cadastro" className="landing__button landing__button--primary">
          Criar conta grátis
        </Link>
      </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__footer-columns">
          <div className="landing__footer-brand">
            <strong>Jogaê</strong>
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
          © 2026 Jogaê. Todos os direitos reservados.
          {SITE.cnpj && ` · CNPJ ${SITE.cnpj}`}
        </p>
      </footer>
    </div>
  )
}
