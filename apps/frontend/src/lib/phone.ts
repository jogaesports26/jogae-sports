/** Remove qualquer caractere que não seja dígito ou pontuação usual de telefone (espaço, parênteses, hífen, +). */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d\s()+-]/g, '')
}

/** Só os dígitos (DDD + número), no formato em que o telefone do jogador é salvo e o identifica. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

/** "11987654321" -> "(11) 98765-4321"; aceita entrada parcial pra máscara enquanto digita. */
export function formatPhone(value: string): string {
  const digits = phoneDigits(value)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Comprimento mínimo do valor formatado pra um telefone com DDD (10 dígitos). */
export const FORMATTED_PHONE_MIN_LENGTH = formatPhone('0000000000').length
