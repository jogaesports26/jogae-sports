# Jogaê Sports

Sistema SaaS de gestão para donos de quadras esportivas (agenda, reservas, CRM, portal público do jogador). Monorepo do projeto da disciplina de Programação Web.

**Sistema no ar:** https://jogae.razielhub.cloud (front em `/`, API em `/api`), hospedado numa VPS própria.

Documentação completa (arquitetura, modelo de dados, funcionalidades): [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md). Checklists de entrega da disciplina: [ENTREGA-01.md](ENTREGA-01.md), [ENTREGA-02.md](ENTREGA-02.md).

## Estrutura

```
jogae-sports/
├── apps/
│   ├── backend/    → NestJS + Prisma (PostgreSQL)
│   └── frontend/   → React + Vite
├── docs/                    → documentação do projeto
└── docker-compose.dev.yml   → Postgres para desenvolvimento local
```

## Rodando localmente

Requer Node.js 20+ (o CI e as imagens usam 24) e Docker (só para o Postgres local; não precisa de conta em nenhum serviço de nuvem).

Na raiz do projeto:

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
# edite apps/backend/.env: troque a senha (a MESMA em POSTGRES_PASSWORD, DATABASE_URL e DIRECT_URL) e o JWT_SECRET
docker compose -f docker-compose.dev.yml --env-file apps/backend/.env up -d   # Postgres 16 em 127.0.0.1:5432
```

Backend:
```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev
npm run seed         # opcional: estabelecimentos/quadras/reservas FICTÍCIOS (ver "Seed" abaixo)
cd ../..
npm run dev:backend  # sobe em http://localhost:3000
```

Frontend:
```bash
npm run dev:frontend  # sobe em http://localhost:5173 e fala com http://localhost:3000
```

Em desenvolvimento o front usa `http://localhost:3000`; para outra API, configure `VITE_API_URL` em `apps/frontend/.env.local`. Para parar o banco: `docker compose -f docker-compose.dev.yml down` (os dados ficam no volume `jogae-dev-data`; `down -v` apaga tudo).

**Seed (dados de demonstração).** `npm run seed` (em `apps/backend`) cria 4 estabelecimentos fictícios com donos, funcionários, quadras, reservas e avaliações. Não há senha conhecida no repositório: o seed gera senhas aleatórias e as mostra UMA vez no terminal ao final (anote). Para escolher as senhas, defina `SEED_OWNER_PASSWORD` e `SEED_STAFF_PASSWORD` antes de rodar. Ele recusa rodar com `NODE_ENV=production` e apaga/recria os dados das contas fictícias; nunca rode contra um banco real.

Fluxo de jogador em desenvolvimento: sem provedor de SMS/WhatsApp, deixe `OTP_EXPOSE_DEV_CODE="true"` no `.env` local e o código aparece na tela de login.

**Variáveis de ambiente do backend** (`apps/backend/.env`, ver `.env.example`):

| Variável | Obrigatória | Uso |
|---|---|---|
| `POSTGRES_PASSWORD` | só no dev local | senha do Postgres do `docker-compose.dev.yml` (use a mesma em `DATABASE_URL`/`DIRECT_URL`) |
| `DATABASE_URL` | sim | conexão da API com o Postgres |
| `DIRECT_URL` | sim | conexão usada pelo Prisma Migrate (a mesma URL, quando não há pooler) |
| `JWT_SECRET` | sim | assinatura dos tokens JWT (login de dono/funcionário). A API não sobe sem ela; com menos de 32 caracteres só registra um aviso (gere com `openssl rand -hex 32`) |
| `CORS_ORIGINS` | não | origens permitidas, separadas por vírgula (ex.: `https://jogae.razielhub.cloud,http://localhost:5173`). Sem a variável só o `localhost:5173` de desenvolvimento é aceito (em produção o front usa o mesmo domínio, via `/api`); `*` é ignorado |
| `OTP_EXPOSE_DEV_CODE` | não (default desligada) | `true` devolve o código OTP na resposta de `/player-auth/request-otp` (`devCode`). Existe porque ainda não há provedor de SMS/WhatsApp; use **só em ambiente de demonstração com dados fictícios**. **Deve estar desligada antes de qualquer cliente real**, senão qualquer pessoa entra como qualquer jogador sabendo o telefone |
| `TRUST_PROXY` | não (default 1) | nº de proxies reversos confiáveis na frente da API (Caddy = 1); necessário para o limite de requisições enxergar o IP real. Use `0` sem proxy |
| `CHAT_DAILY_LIMIT_PER_IP` / `CHAT_DAILY_LIMIT_GLOBAL` | não (30 / 500) | teto diário de mensagens do chat com IA por IP e no total (a API da Anthropic é paga por uso) |
| `PORT` | não (default 3000) | porta da API |
| `SEED_OWNER_PASSWORD` / `SEED_STAFF_PASSWORD` | não | senhas das contas do seed; sem elas o seed gera senhas aleatórias |
| `ANTHROPIC_API_KEY` | não | habilita o chatbot com IA generativa do Portal do Cliente; sem ela, o chat responde com uma mensagem padrão |

**Variáveis de ambiente do frontend** (`apps/frontend/.env.local` em desenvolvimento). Na imagem de produção só `VITE_API_URL` é repassada hoje (`--build-arg`); para as demais (`VITE_CONTACT_EMAIL`, `VITE_WHATSAPP`, `VITE_CNPJ`, `VITE_SHOW_STATS`) é preciso acrescentar o `ARG`/`ENV` correspondente em `apps/frontend/Dockerfile`:

| Variável | Obrigatória | Uso |
|---|---|---|
| `VITE_API_URL` | não (default: `http://localhost:3000` em dev, `/api` no build) | URL da API usada pelo navegador. O servidor do front (`server/server.ts`) usa `API_INTERNAL_URL` (default `http://jogae-api:3000`) para montar meta tags e tema da lojinha |
| `VITE_CONTACT_EMAIL` | não | e-mail de contato no rodapé da landing e nas páginas de termos/privacidade; sem ele o contato não aparece |
| `VITE_WHATSAPP` | não | número com DDI+DDD só com dígitos (ex.: `5511999998888`); habilita o selo "Suporte no WhatsApp" e o botão de dúvida de preço |
| `VITE_CNPJ` | não | CNPJ exibido no rodapé; sem ele a linha não aparece |
| `VITE_SHOW_STATS` | não | `true` mostra na landing os números reais (estabelecimentos, quadras, reservas); deixe desligado enquanto houver dado de demonstração no banco de produção |

**Tema por lojinha:** o dono personaliza cores, logo e capa em *Configurações > Aparência*; o backend deriva a escala (OKLCH, contraste AA) e a lojinha aplica em `/:slug/**`. Depoimentos reais da landing entram em `apps/frontend/src/content/testimonials.ts` (vazio = seção oculta). Testes: `npm test` e `npm run test:e2e` em `apps/frontend` (o e2e é visual, com a API mockada); `node scripts/gen-theme-fixtures.mjs` regenera as cores de referência dos presets, e `CAPTURE=1 npx playwright test e2e/capture-landing.spec.ts` regenera as imagens da landing.

## Stack

- Back-end: Node.js + NestJS 11 + Prisma ORM
- Banco de dados: PostgreSQL 16
- Front-end: React 19 (Vite + TypeScript)
- Integrações: ViaCEP (busca de endereço), Claude API (chatbot de IA generativa)

## Hospedagem

O sistema roda numa VPS própria (Docker Compose atrás de um Caddy com HTTPS automático): https://jogae.razielhub.cloud. Nesta fase (sem clientes) o código e a produção ficam na mesma pasta do servidor (`/srv/apps/jogae`) e a publicação é local: `./publicar.sh` roda os testes, builda as imagens, faz backup do banco, sobe, valida e volta sozinho para a versão anterior se algo falhar. Segredos (`.env`), dados e backups ficam só no servidor e fora do git. Um ambiente de desenvolvimento separado fica para quando o sistema estiver completo e padronizado. Domínio próprio fica para antes da primeira venda.

_Histórico:_ nas primeiras sprints da disciplina o projeto rodou em serviços gratuitos de nuvem (frontend, API e banco gerenciado); foi migrado para a VPS por controle, custo previsível e ausência de "sono" da API. As URLs antigas não valem mais.

## Segurança e dívidas técnicas conhecidas

- Limite de requisições (`@nestjs/throttler`): 120/min por IP no geral; mais apertado em login, cadastro, recuperação de senha, OTP e chat. `GET /health` (sem banco) fica fora do limite.
- OTP: código gerado com `crypto.randomInt`, expira em 5 min, no máximo 3 pedidos e 5 tentativas erradas por telefone a cada 10 min. Esses contadores por telefone ficam **em memória** (instância única); com mais de uma réplica, mover para Redis ou tabela.
- Corpo JSON de até 10 MB (`main.ts`) existe porque as fotos de quadra chegam em base64. **Dívida técnica:** vetor de abuso e consumo de memória; a solução é enviar as fotos para um object storage com URL assinada.
- **Não crie registro DNS `AAAA` (IPv6) para o domínio na VPS.** Clientes IPv6 chegam ao Caddy como `172.18.0.1` (proxy do Docker), então todos dividiriam o mesmo limite de requisições por IP e o ban/limite atingiria todo mundo junto. Use só registro `A` (IPv4).
- Notificações ainda só gravam log (sem provedor de SMS/WhatsApp/e-mail).

## Imagens Docker

- `apps/backend/Dockerfile` (API) e `apps/frontend/Dockerfile` (web: `dist` do Vite + `server/server.ts`, que reescreve o `<head>` por lojinha fazendo o papel do antigo middleware de borda). Contexto de build: a raiz do repositório. Sem `.env` nem segredos dentro das imagens (`.dockerignore`); toda configuração entra em tempo de execução.
- A API roda `prisma migrate deploy` ao subir e responde `GET /health`. O web responde `GET /healthz`, chama a API em `API_INTERNAL_URL` (padrão `http://jogae-api:3000`) e é buildado com `VITE_API_URL=/api`.
- Publicação em produção: `./publicar.sh` (imagens locais `jogae-api:<data>-<commit>` e `jogae-web:...`). O workflow `.github/workflows/docker.yml` ainda publica imagens no GHCR em tags `vX.Y.Z`, mas a produção não as usa mais.
- Teste local das imagens: `docker build -f apps/backend/Dockerfile -t jogae-api:teste .` e `docker build -f apps/frontend/Dockerfile -t jogae-web:teste .`.
