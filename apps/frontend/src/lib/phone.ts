/** Remove qualquer caractere que não seja dígito ou pontuação usual de telefone (espaço, parênteses, hífen, +). */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d\s()+-]/g, '')
}
