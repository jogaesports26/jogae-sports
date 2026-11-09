# NP2 · Sprint 1: PWA + análise de segurança (Semgrep)

Projeto: Jogaê (reserva de quadras). Front React 19 + Vite; back NestJS 11 + Prisma 6 + PostgreSQL.
Data: 2026-11-09.

## 1. PWA

| Requisito | Implementação |
|---|---|
| Manifest | `apps/frontend/public/manifest.webmanifest` (nome, `display: standalone`, tema, ícones 192/512/maskable). Cada lojinha (`/:slug`) recebe manifest e ícone próprios, gerados em `server/server.ts`. |
| Service worker | `apps/frontend/public/sw.js`: navegação rede-primeiro com fallback `/offline.html`; `/assets/*` e `/icons/*` cache-primeiro; **`/api` e outras origens nunca são cacheados** (sem vazar sessão nem dado velho). Registrado em `src/main.tsx` só em produção. |
| Instalável | HTTPS (Caddy), manifest válido, SW ativo, ícones PNG, `apple-touch-icon`. |
| Responsivo | Interface já responsiva (mobile-first, testada no celular e no desktop). |
| Offline | Página `/offline.html` com botão "Tentar novamente". |
| Atualização | `sw.js` é servido com `Cache-Control: no-cache`; versão do cache em `VERSION`. |

Validação (Chromium headless contra o servidor de produção do front): SW `activated` com escopo `/`;
manifest carregado (`name`, `standalone`, 3 ícones); com a rede cortada, `/painel` mostra a página offline
(`evidencias/pwa-offline.png`). Testes automatizados: 62/62 passando; build e lint ok.

## 2. Semgrep

Versão 1.184.0, métricas desligadas. Script reprodutível: `docs/seguranca/rodar-semgrep.sh <antes|depois>`.
Conjuntos de regras: `p/owasp-top-ten`, `p/javascript`, `p/typescript`, `p/nodejs`, `p/react`,
`p/security-audit`, `p/secrets`, `p/sql-injection`, `p/command-injection`, `p/xss`.
Alvo: todo o repositório rastreado (front, back, workflows), exceto `node_modules`, `dist`, `data`.
169 regras sobre 423 arquivos.

### Antes: 11 achados
| # | Regra | Local | Categoria OWASP | Risco |
|---|---|---|---|---|
| 1-10 | `github-actions-mutable-action-tag` | `.github/workflows/ci.yml` (5), `docker.yml` (5) | A08 Integridade de software e dados / cadeia de suprimentos | Ação referenciada por tag móvel (`@v4`): se a tag for sequestrada, código malicioso roda no CI com acesso ao token e ao GHCR. |
| 11 | `unknown-value-with-script-tag` | `apps/frontend/edge/head.ts` (JSON do tema em `<script>`) | A03 Injeção (XSS) | Dado do banco (nome/cores da lojinha) entra em `<script>`. Já escapava `<`, mas não `>` e `&`. |

Sem achados de SQL Injection, Command Injection, criptografia insegura, credenciais vazadas ou desserialização
insegura. Consultas usam Prisma (parametrizado) e não há `exec`/`eval` com entrada do usuário.

### Correções
1-10. Todas as ações fixadas por **SHA de commit** (com o nome da tag em comentário).
11. Serialização do JSON agora escapa `<`, `>`, `&` e U+2028/2029 (`<`, `>`, `&`); o CSP já
libera o script inline só por hash SHA-256. O Semgrep não enxerga o escape (regra por padrão), então a linha
tem `nosemgrep` com justificativa.

### Depois: 0 achados
Evidências em `docs/seguranca/evidencias/`: `semgrep-antes.{txt,json}`, `semgrep-depois.{txt,json}`,
`semgrep-*-versao.txt`, `pwa-offline.png`.

## 3. Defesas já existentes (contexto)
CSP por página com hash, `X-Content-Type-Options`, bloqueio de path traversal no servidor estático,
Prisma parametrizado, HTTPS automático (Caddy) e fail2ban no SSH.

## 4. Limitações honestas
SAST encontra só padrões conhecidos; não substitui teste de invasão. Pendências do produto já registradas
antes de abrir ao público: OTP com `devCode`/`Math.random`, rate limit no chat.
