import { passwordStrength, STRENGTH_LABELS, weakPasswordReason } from '../lib/password'
import './PasswordMeter.css'

/** Medidor de 4 barras abaixo do campo de senha. Sempre diz em texto (não só em cor) se a senha serve. */
export default function PasswordMeter({ password }: { password: string }) {
  const level = passwordStrength(password)
  const reason = password ? weakPasswordReason(password) : null
  return (
    <div className="pw-meter" data-level={level}>
      <div className="pw-meter__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`pw-meter__bar${level >= step ? ' pw-meter__bar--on' : ''}`} />
        ))}
      </div>
      <p className="pw-meter__text" aria-live="polite">
        {reason ?? (password ? `Senha ${STRENGTH_LABELS[level].toLowerCase()}` : 'Use 8 ou mais caracteres, sem ser uma senha comum.')}
      </p>
    </div>
  )
}
