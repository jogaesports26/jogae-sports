import { Link } from 'react-router-dom'

export interface SetupStep {
  label: string
  done: boolean
  to: string
}

interface SetupProgressProps {
  steps: SetupStep[]
}

/** "Configure sua arena: 3 de 4". Some sozinho quando tudo estiver feito. */
export default function SetupProgress({ steps }: SetupProgressProps) {
  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) return null

  return (
    <section className="panel-card setup-progress" aria-labelledby="setup-progress-title">
      <div className="setup-progress__head">
        <h2 id="setup-progress-title">Configure sua arena</h2>
        <span className="setup-progress__count">
          {doneCount} de {steps.length} passos
        </span>
      </div>
      <div
        className="setup-progress__meter"
        role="meter"
        aria-label="Passos concluídos"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
        aria-valuetext={`${doneCount} de ${steps.length} passos concluídos`}
      >
        {steps.map((step) => (
          <span key={step.label} data-done={step.done}>
            <i />
          </span>
        ))}
      </div>
      <ul className="setup-progress__steps">
        {steps.map((step) => (
          <li key={step.label} data-done={step.done}>
            <Link to={step.to}>
              <span className="setup-progress__dot" aria-hidden="true">
                {step.done ? '✓' : ''}
              </span>
              <span>
                {step.label}
                <span className="sr-only">{step.done ? ' (feito)' : ' (a fazer)'}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
