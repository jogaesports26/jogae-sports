# Entrega 02 — Jogaê Sports (2ª Sprint)

**Disciplina:** Programação Web
**Data:** 28/09/2026
**Repositório:** https://github.com/jogaesports26/jogae-sports
**Sistema em produção:** https://jogae-sports-frontend.vercel.app/ (frontend) · https://jogae-sports-backend.onrender.com (API)

Este documento cobre, item a item, o checklist da 2ª entrega. Detalhes mais aprofundados estão em [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md); o checklist da entrega anterior está em [ENTREGA-01.md](ENTREGA-01.md).

---

## 1. Requisitos funcionais da Sprint 01 implementados

Mínimo de 3 pedido pelo professor — os 6 requisitos definidos na Sprint 01 já estão implementados:

1. **Cadastro de usuários** — dono do estabelecimento (`POST /auth/register`), com recuperação de senha por token.
2. **Login** — dono (`POST /auth/login`) e funcionário (`POST /staff-auth/login`) com JWT; jogador via telefone + código OTP (`/player-auth/*`), sem senha.
3. **Banco de dados** — PostgreSQL (Supabase) via Prisma, 16 tabelas relacionadas (detalhe na seção 3).
4. **Integração com API externa** — busca de endereço por CEP via [ViaCEP](https://viacep.com.br/) (`GET /cep/:cep`, [apps/backend/src/cep/cep.service.ts](apps/backend/src/cep/cep.service.ts)), usada no cadastro/edição dos dados do estabelecimento.
5. **Integração com IA Generativa** — chatbot do Portal do Cliente usa a API da Anthropic (Claude) para responder dúvidas do jogador sobre como reservar ([apps/backend/src/chat/chat.service.ts](apps/backend/src/chat/chat.service.ts)).
6. **Chatbot inteligente** — widget de chat no Portal do Cliente (`ChatWidget.tsx`), com histórico de conversa enviado à IA a cada mensagem; degrada de forma controlada (mensagem padrão, sem erro 500) se a chave da API não estiver configurada no ambiente.

## 2. Integração Front-end, Back-end e Banco de Dados

Fluxo ponta a ponta em produção: React (Vercel) → REST/JSON autenticado por JWT → NestJS (Render) → Prisma → PostgreSQL (Supabase). Sem mock de dados no front — toda tela do painel e do portal público lê e grava no banco real (ver seção 12 para evidência de persistência).

## 3. Banco de dados — tabelas relacionadas

Schema completo em [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma): **16 tabelas**, bem acima do mínimo de 5 pedido, todas relacionadas entre si (chaves estrangeiras + índices). Principais relações:

- `User` 1—N `Court`, `Coupon`, `Equipment`, `StaffMember`
- `Court` 1—N `PriceRule`, `Reservation`, `MaintenanceBlock`, `RecurringMaintenanceBlock`, `Review`, `Waitlist`
- `Player` 1—N `Reservation`, `Review`
- `Reservation` N—1 `Coupon`, `Instructor`; 1—1 `Review`; 1—N `ReservationEquipment`
- `Equipment` 1—N `ReservationEquipment`

Nenhuma tabela foi removida desde a Entrega 01 — a modelagem se manteve estável, o que valida a decisão de banco de dados tomada na Sprint 01.

## 4. CRUD completo de 2 entidades principais

**Quadras (`Court`)** — [courts.controller.ts](apps/backend/src/courts/courts.controller.ts):
`GET /courts` (listar) · `POST /courts` (criar) · `GET /courts/:id` (detalhe) · `PATCH /courts/:id` (editar) · `DELETE /courts/:id` (remover) — além de `PUT /courts/:id/price-rules` para as regras de preço.

**Cupons (`Coupon`)** — [coupons.controller.ts](apps/backend/src/coupons/coupons.controller.ts):
`GET /coupons` · `POST /coupons` · `PATCH /coupons/:id` · `DELETE /coupons/:id`.

Ambas as telas (`CourtList`/`CourtFormModal` e `CouponsPage`) têm CRUD completo também na interface, não só na API.

## 5. Pesquisa e filtros

- **Clientes** ([CustomersPage.tsx](apps/frontend/src/pages/CustomersPage.tsx)): busca por texto (nome/telefone) combinada com abas de filtro (`todos` / `inativos` / `aniversariantes do mês` / `faltas recorrentes`), sincronizadas com a URL (`?filtro=`).
- **Portal do jogador**: filtro de quadras por esporte na página do estabelecimento.
- **Relatórios** ([reports-query.dto.ts](apps/backend/src/reservations/dto/reports-query.dto.ts)) e **Agenda** ([agenda-query.dto.ts](apps/backend/src/reservations/dto/agenda-query.dto.ts)): filtro por período/quadra via query params, validados no backend.

## 6. Validação de formulários e tratamento de erros

- **Backend**: todo DTO usa `class-validator`/`class-transformer` (ex.: [create-court.dto.ts](apps/backend/src/courts/dto), [register.dto.ts](apps/backend/src/auth/dto/register.dto.ts)), rejeitando payload inválido com `400` antes de chegar à regra de negócio. Um filtro global ([prisma-exception.filter.ts](apps/backend/src/common/filters/prisma-exception.filter.ts)) converte erros do Prisma (ex.: e-mail duplicado, registro não encontrado) em respostas HTTP consistentes em vez de vazar erro interno.
- **Frontend**: formulários exibem erro de validação por campo e mensagem de erro de rede/API (toasts via [ToastHost.tsx](apps/frontend/src/components/ToastHost.tsx)); rotas do painel exigem sessão válida (redirecionam para login se o token expirar).

## 7. Interface responsiva e padronizada

Design system próprio em [apps/frontend/src/styles/primitives.css](apps/frontend/src/styles/primitives.css) e tokens em `index.css` (cores, tipografia, espaçamento reutilizados em todas as telas — `.btn`, `.card`, `.pill`, `.modal`). Responsividade: **34 dos 42 arquivos CSS do frontend** têm regras `@media` próprias (menu lateral que colapsa em mobile, grids que quebram em coluna única, modais em tela cheia no celular, etc.).

## 8. Atualização do DER

O modelo de dados (16 entidades) não mudou desde a Entrega 01 — decisão validada na Sprint 01 se manteve estável ao longo da Sprint 02, sem necessidade de migração estrutural. DER completo (núcleo do domínio) em [ENTREGA-01.md § 6](ENTREGA-01.md#6-modelagem-inicial-do-banco-de-dados-der); schema fonte da verdade em [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma).

## 9. README atualizado

[README.md](README.md) atualizado com: variáveis de ambiente do backend (incluindo `ANTHROPIC_API_KEY` do chatbot), passo de seed do banco (`npx prisma db seed`) e links para a documentação completa e os checklists de entrega.

## 10. Commits por integrante

- **GitHub**: histórico completo em https://github.com/jogaesports26/jogae-sports/commits/main, com Pull Requests revisadas antes de cada merge em `main` (https://github.com/jogaesports26/jogae-sports/pulls).
- **Trello**: quadro em https://trello.com/b/f2dEOaPL/jogae-sports com listas de backlog, tarefas em progresso e concluídas.

> Nota interna da equipe (não para o professor): a autoria dos commits recentes está concentrada em uma única conta GitHub. Antes da entrega, confirmar que Melquedesque e Stephany têm commits/PRs sob sua própria conta no período da Sprint 02 — ver observação no chat.

## 11. Trello atualizado

Quadro (https://trello.com/b/f2dEOaPL/jogae-sports) com listas `Backlog / Ideias`, `A Fazer`, `Em Progresso`, `Concluído`, além de três listas dedicadas ao redesign em andamento (`Redesign — Painel`, `Redesign — Venda`, `Redesign — Landing Page`).

## 12. Demonstração com persistência de dados

Sistema em produção, sem dados mockados:

- Frontend: https://jogae-sports-frontend.vercel.app/
- Backend/API: https://jogae-sports-backend.onrender.com
- Banco: PostgreSQL no Supabase, populado por `apps/backend/prisma/seed.ts` com 4 estabelecimentos fictícios (futebol, tênis, vôlei de praia, multiesportivo), quadras, reservas passadas/futuras, avaliações, cupons e equipamentos.

Roteiro de demonstração sugerido: abrir a lojinha pública de um estabelecimento de demonstração → reservar um horário como jogador → logar como dono (conta de demonstração, ver [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md)) → ver a reserva aparecer na Agenda → editar/cancelar → confirmar que o dado persiste após recarregar a página (vem do banco, não de estado local).
