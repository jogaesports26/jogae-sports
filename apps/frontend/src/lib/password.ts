/** Regras de senha nova. Espelham `backend/src/common/strong-password.ts` (o servidor é quem decide; aqui é só aviso rápido). */
export const PASSWORD_MIN_LENGTH = 8

const COMMON = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', 'qwertyui', 'qwerty123',
  'qwertyuiop', 'asdfghjk', 'abcd1234', 'abc12345', 'senha123', 'senha1234', 'senha@123', 'senhasenha',
  'mudar123', 'mudar@123', 'password', 'password1', 'password123', 'admin123', 'admin1234', 'jogae123',
  'jogae1234', 'jogaesports', 'iloveyou', 'brasil123', 'futebol1', 'futebol123', 'corinthians',
  'flamengo123', 'quadra123',
])

export function weakPasswordReason(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`
  if (new TextEncoder().encode(password).length > 72) return 'A senha deve ter no máximo 72 caracteres'
  if (COMMON.has(password.toLowerCase())) return 'Essa senha é muito comum. Escolha outra'
  if (new Set(password).size <= 2) return 'A senha não pode repetir só um ou dois caracteres'
  if (/^\d+$/.test(password)) return 'A senha não pode ter só números'
  return null
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

/** 0 = vazia ou recusada; 1 a 4 = aceita, de básica a forte (comprimento e variedade de tipos). */
export function passwordStrength(password: string): PasswordStrength {
  if (!password || weakPasswordReason(password)) return 0
  const kinds = [/[a-zà-ú]/, /[A-ZÀ-Ú]/, /\d/, /[^A-Za-zÀ-ú\d]/].filter((re) => re.test(password)).length
  let score = 1
  if (password.length >= 10) score += 1
  if (kinds >= 3) score += 1
  if (password.length >= 14 && kinds >= 2) score += 1
  return Math.min(4, score) as PasswordStrength
}

export const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  0: 'Digite uma senha',
  1: 'Básica',
  2: 'Razoável',
  3: 'Boa',
  4: 'Forte',
}
