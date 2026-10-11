import { Basketball, SoccerBall, TennisBall, Volleyball } from '../../pages/SportIcons'
import './Marquee.css'

// Só modalidades que o sistema já cadastra hoje (as quadras de demonstração do seed).
const SPORTS = [
  { name: 'Futebol Society', Icon: SoccerBall },
  { name: 'Vôlei', Icon: Volleyball },
  { name: 'Tênis', Icon: TennisBall },
  { name: 'Futsal', Icon: SoccerBall },
  { name: 'Vôlei de Praia', Icon: Volleyball },
  { name: 'Basquete', Icon: Basketball },
  { name: 'Futebol Fut7', Icon: SoccerBall },
]

export default function Marquee() {
  return (
    <section className="marquee" aria-label="Modalidades que você pode cadastrar">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          // A segunda cópia só completa o loop: some pra leitores de tela.
          <ul className="marquee__group" key={copy} aria-hidden={copy === 1}>
            {SPORTS.map(({ name, Icon }) => (
              <li key={name}>
                <span className="marquee__icon" aria-hidden="true">
                  <Icon />
                </span>
                {name}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
