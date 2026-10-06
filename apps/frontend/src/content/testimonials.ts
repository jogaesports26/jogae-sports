export interface Testimonial {
  quote: string
  name: string
  role: string
  establishment: string
  photoUrl?: string
}

/**
 * Depoimentos de donos de quadra. Só entram aqui falas REAIS, com autorização de quem falou.
 * Enquanto a lista estiver vazia, a seção de depoimentos não aparece na landing
 * (nada de depoimento inventado).
 */
export const TESTIMONIALS: Testimonial[] = []
