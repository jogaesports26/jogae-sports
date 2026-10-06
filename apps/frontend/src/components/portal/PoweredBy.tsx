import { Link } from 'react-router-dom'
import './PoweredBy.css'

/** Assinatura discreta da plataforma (rodapé, confirmação e comprovante). Obrigatória por enquanto: remover em plano pago é decisão de negócio, ligada ao card de Assinatura. */
export default function PoweredBy({ className = '' }: { className?: string }) {
  return (
    <p className={`powered-by ${className}`.trim()}>
      Feito com <Link to="/">Jogaê Sports</Link>
    </p>
  )
}
