/**
 * Primeiros segmentos de URL que pertencem ao próprio app (rotas do frontend e do edge middleware).
 * Um estabelecimento não pode usar esses nomes como link da lojinha, senão ficaria inacessível.
 * Manter em sync com App.tsx e frontend/middleware.ts.
 */
export const RESERVED_SLUGS = new Set([
  'login',
  'cadastro',
  'esqueci-senha',
  'redefinir-senha',
  'painel',
  'minhas-reservas',
  'termos',
  'privacidade',
  'api',
  'assets',
  'admin',
  'health',
  'healthz',
]);
