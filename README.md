# Jogaê Sports

Sistema SaaS de gestão para donos de quadras esportivas (agenda, reservas, CRM, portal público do jogador). Monorepo do projeto da disciplina de Programação Web.

**Sistema em produção:** https://jogae-sports-frontend.vercel.app/ (frontend) · https://jogae-sports-backend.onrender.com (API)

Documentação completa (arquitetura, modelo de dados, funcionalidades): [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md). Checklists de entrega da disciplina: [ENTREGA-01.md](ENTREGA-01.md), [ENTREGA-02.md](ENTREGA-02.md).

## Estrutura

```
jogae-sports/
├── apps/
│   ├── backend/    → NestJS + Prisma (PostgreSQL)
│   └── frontend/   → React + Vite
├── docs/           → documentação do projeto
└── render.yaml      → config de deploy do backend
```

## Rodando localmente

Requer Node.js 20+ e uma instância PostgreSQL (local ou Supabase).

Na raiz do projeto:

```bash
npm install
```

Backend:
```bash
cp apps/backend/.env.example apps/backend/.env
# edite o .env com DATABASE_URL / DIRECT_URL (PostgreSQL) e JWT_SECRET
cd apps/backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed   # opcional: popula estabelecimentos/quadras/reservas de demonstração
cd ../..
npm run dev:backend  # sobe em http://localhost:3000
```

Frontend:
```bash
npm run dev:frontend  # sobe em http://localhost:5173
```

Se o backend não estiver em `http://localhost:3000`, configure `VITE_API_URL` em `apps/frontend/.env.local`.

**Variáveis de ambiente do backend** (`apps/backend/.env`, ver `.env.example`):

| Variável | Obrigatória | Uso |
|---|---|---|
| `DATABASE_URL` | sim | conexão de runtime com o Postgres (pooler transaction) |
| `DIRECT_URL` | sim | conexão direta usada pelo Prisma Migrate |
| `JWT_SECRET` | sim | assinatura dos tokens JWT (login de dono/funcionário). A API não sobe sem ela; com menos de 32 caracteres só registra um aviso (gere com `openssl rand -hex 32`) |
| `CORS_ORIGINS` | não | origens permitidas, separadas por vírgula (ex.: `https://jogae.razielhub.cloud,http://localhost:5173`). Sem a variável mantém o comportamento antigo (localhost + `*.vercel.app`); `*` é ignorado |
| `OTP_EXPOSE_DEV_CODE` | não (default desligada) | `true` devolve o código OTP na resposta de `/player-auth/request-otp` (`devCode`). Existe porque ainda não há provedor de SMS/WhatsApp; use **só em ambiente de demonstração com dados fictícios**. **Deve estar desligada antes de qualquer cliente real**, senão qualquer pessoa entra como qualquer jogador sabendo o telefone |
| `TRUST_PROXY` | não (default 1) | nº de proxies reversos confiáveis na frente da API (Caddy/Render = 1); necessário para o limite de requisições enxergar o IP real. Use `0` sem proxy |
| `CHAT_DAILY_LIMIT_PER_IP` / `CHAT_DAILY_LIMIT_GLOBAL` | não (30 / 500) | teto diário de mensagens do chat com IA por IP e no total (a API da Anthropic é paga por uso) |
| `PORT` | não (default 3000) | porta da API |
| `ANTHROPIC_API_KEY` | não | habilita o chatbot com IA generativa do Portal do Cliente; sem ela, o chat responde com uma mensagem padrão |

**Variáveis de ambiente do frontend** (Vercel ou `apps/frontend/.env.local`):

| Variável | Obrigatória | Uso |
|---|---|---|
| `VITE_API_URL` | não (default: backend do Render) | URL da API; também lida pelo Edge Middleware (`apps/frontend/middleware.ts`) pra montar meta tags e tema da lojinha |
| `VITE_CONTACT_EMAIL` | não | e-mail de contato no rodapé da landing e nas páginas de termos/privacidade; sem ele o contato não aparece |
| `VITE_WHATSAPP` | não | número com DDI+DDD só com dígitos (ex.: `5511999998888`); habilita o selo "Suporte no WhatsApp" e o botão de dúvida de preço |
| `VITE_CNPJ` | não | CNPJ exibido no rodapé; sem ele a linha não aparece |
| `VITE_SHOW_STATS` | não | `true` mostra na landing os números reais (estabelecimentos, quadras, reservas); deixe desligado enquanto houver dado de demonstração no banco de produção |

**Tema por lojinha:** o dono personaliza cores, logo e capa em *Configurações > Aparência*; o backend deriva a escala (OKLCH, contraste AA) e a lojinha aplica em `/:slug/**`. Depoimentos reais da landing entram em `apps/frontend/src/content/testimonials.ts` (vazio = seção oculta). Testes: `npm test` e `npm run test:e2e` em `apps/frontend` (o e2e é visual, com a API mockada); `node scripts/gen-theme-fixtures.mjs` regenera as cores de referência dos presets, e `CAPTURE=1 npx playwright test e2e/capture-landing.spec.ts` regenera as imagens da landing.

## Stack

- Back-end: Node.js + NestJS 11 + Prisma ORM
- Banco de dados: PostgreSQL (Supabase)
- Front-end: React 19 (Vite + TypeScript)
- Integrações: ViaCEP (busca de endereço), Claude API (chatbot de IA generativa)

## Hospedagem

- Frontend: [Vercel](https://jogae-sports-frontend.vercel.app/) (free tier)
- Backend: [Render](https://jogae-sports-backend.onrender.com) (free tier — a instância "dorme" após inatividade; a primeira requisição pode levar ~50s)
- Banco: PostgreSQL no Supabase (free tier)

Quando o projeto evoluir, migrar tudo para uma VPS própria.

## Segurança e dívidas técnicas conhecidas

- Limite de requisições (`@nestjs/throttler`): 120/min por IP no geral; mais apertado em login, cadastro, recuperação de senha, OTP e chat. `GET /health` (sem banco) fica fora do limite.
- OTP: código gerado com `crypto.randomInt`, expira em 5 min, no máximo 3 pedidos e 5 tentativas erradas por telefone a cada 10 min. Esses contadores por telefone ficam **em memória** (instância única); com mais de uma réplica, mover para Redis ou tabela.
- Corpo JSON de até 10 MB (`main.ts`) existe porque as fotos de quadra chegam em base64. **Dívida técnica:** vetor de abuso e consumo de memória; a solução é enviar as fotos para um object storage com URL assinada.
- **Não crie registro DNS `AAAA` (IPv6) para o domínio na VPS.** Clientes IPv6 chegam ao Caddy como `172.18.0.1` (proxy do Docker), então todos dividiriam o mesmo limite de requisições por IP e o ban/limite atingiria todo mundo junto. Use só registro `A` (IPv4).
- Notificações ainda só gravam log (sem provedor de SMS/WhatsApp/e-mail).

## Imagens Docker (GHCR)

- `apps/backend/Dockerfile` (API) e `apps/frontend/Dockerfile` (web: `dist` do Vite + `server/server.ts`, que reescreve o `<head>` por lojinha como o middleware da Vercel). Contexto de build: a raiz do repositório. Sem `.env` nem segredos dentro das imagens (`.dockerignore`); toda configuração entra em tempo de execução.
- A API roda `prisma migrate deploy` ao subir e responde `GET /health`. O web responde `GET /healthz`, chama a API em `API_INTERNAL_URL` (padrão `http://jogae-api:3000`) e é buildado com `VITE_API_URL=/api`.
- Publicação: criar a tag `vX.Y.Z` dispara `.github/workflows/docker.yml`, que envia `ghcr.io/jogaesports26/jogae-sports-api:X.Y.Z` e `...-web:X.Y.Z` (sem `latest`). Em Pull Request o workflow só valida o build. Na primeira publicação, deixe o pacote **público** em *Package settings > Change visibility* para o servidor puxar sem token.
- Teste local: `docker build -f apps/backend/Dockerfile -t jogae-api .` e `docker build -f apps/frontend/Dockerfile -t jogae-web .`.
