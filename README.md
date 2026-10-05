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
| `JWT_SECRET` | sim | assinatura dos tokens JWT (login de dono/funcionário) |
| `PORT` | não (default 3000) | porta da API |
| `ANTHROPIC_API_KEY` | não | habilita o chatbot com IA generativa do Portal do Cliente; sem ela, o chat responde com uma mensagem padrão |

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
