/**
 * Dados institucionais que aparecem na landing, no rodapé e nas páginas legais.
 * Vêm de variáveis de ambiente (VITE_*, definidas no build da imagem) pra não publicar contato/CNPJ inventado:
 * o que não estiver configurado simplesmente não aparece.
 *   VITE_CONTACT_EMAIL  e-mail de suporte/contato
 *   VITE_WHATSAPP       número com DDI+DDD, só dígitos (ex.: 5511999998888)
 *   VITE_CNPJ           CNPJ formatado (ex.: 12.345.678/0001-90)
 *   VITE_SHOW_STATS     "true" pra mostrar os números reais da plataforma na landing
 */
const env = import.meta.env

export const SITE = {
  name: 'Jogaê Sports',
  contactEmail: (env.VITE_CONTACT_EMAIL as string | undefined) || null,
  whatsapp: ((env.VITE_WHATSAPP as string | undefined) || '').replace(/\D/g, '') || null,
  cnpj: (env.VITE_CNPJ as string | undefined) || null,
  showStats: env.VITE_SHOW_STATS === 'true',
  legalUpdatedAt: '05/10/2026',
}

export const whatsappLink = (message = 'Oi! Quero conhecer o Jogaê Sports.') =>
  SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}` : null
