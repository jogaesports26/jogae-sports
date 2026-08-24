# Jogaê Sports

Monorepo do projeto (disciplina de Programação Web).

## Estrutura

```
jogae-sports/
├── apps/
│   ├── backend/    → NestJS + Prisma (PostgreSQL)
│   └── frontend/   → React + Vite
```

## Rodando localmente

Na raiz do projeto:

```bash
npm install
```

Backend:
```bash
cp apps/backend/.env.example apps/backend/.env
# edite o .env com a sua DATABASE_URL do PostgreSQL
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
cd ../..
npm run dev:backend
```

Frontend:
```bash
npm run dev:frontend
```

## Stack

- Back-end: Node.js + NestJS
- Banco de dados: PostgreSQL + Prisma
- Front-end: React (Vite + TypeScript)

## Hospedagem (Sprint 1)

- Frontend: Vercel (free tier)
- Backend: Render ou Railway (free tier)
- Banco: Supabase, Neon ou Railway Postgres (free tier)

Quando o projeto evoluir, migrar tudo para uma VPS própria.
