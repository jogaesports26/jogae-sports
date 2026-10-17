# 1. Escopo e planejamento

## 1.1 Visão do produto

**Jogaê** é um SaaS de gestão e reserva de quadras esportivas. Cada estabelecimento (arena, clube, quadra avulsa) tem um espaço isolado para cadastrar quadras, preços, horários, equipe e clientes, e uma **lojinha pública** (`/<slug>`) onde jogadores reservam online. Modelo escolhido: SaaS puro, não marketplace (ver [DOCUMENTACAO.md §1](../DOCUMENTACAO.md)). A marca se escreve **Jogaê**, sem "Sports".

**Declaração de valor:** tirar o dono de quadra da planilha e do WhatsApp: agenda sem conflito, preço por horário, fila de espera, CRM e relatórios; e dar ao jogador reserva em poucos toques.

## 1.2 Partes interessadas

| Parte | Interesse | Envolvimento |
|---|---|---|
| Raziel Rodrigues | Dono do produto, back-end, infraestrutura e publicação | Decide escopo, prioridade e releases |
| Melquedesque | Front-end | Desenvolvimento (fase acadêmica) |
| Stephany | Suporte / UX | Pesquisa e usabilidade (fase acadêmica) |
| Professor/disciplina Programação Web | Avaliador das entregas ([ENTREGA-01](../../ENTREGA-01.md), [ENTREGA-02](../../ENTREGA-02.md)) | Marcos acadêmicos |
| Donos de quadra (futuros clientes) | Cliente pagante; usa o painel | Ainda sem clientes reais [verificado: CLAUDE.md do servidor] |
| Jogadores | Usuário final gratuito; usa a lojinha | Idem |
| Provedores externos | Anthropic (chat com IA), ViaCEP, futuro SMS/WhatsApp | Dependências, ver [riscos](06-riscos-e-pendencias.md) |

## 1.3 Escopo

### Dentro do escopo (entregue) [verificado no código]

| Área | Capacidades |
|---|---|
| Acesso | Cadastro/login do dono, recuperação de senha; funcionário com permissão (`MANAGE_RESERVATIONS` ou `VIEW_ONLY`); jogador por telefone + OTP |
| Quadras | CRUD, regras de preço por dia/faixa, manutenção pontual e recorrente, fila de espera |
| Reservas | Agenda diária e semanal, criar/editar/cancelar/reagendar, preço congelado (`priceSnapshot`), instrutores, equipamentos |
| Comercial | Cupons, aluguel de equipamento, relatórios financeiros e comerciais com CSV |
| CRM | Histórico do cliente, inativos, aniversariantes, alerta de falta recorrente |
| Lojinha pública | Página por slug, tema por estabelecimento (OKLCH, contraste AA), reserva em 2 etapas, avaliações, favoritos, QR code, widget `<iframe>` |
| IA | Chatbot do portal (API Anthropic) com limite diário por IP e global |
| Integração | ViaCEP para endereço |
| Clima (temporário) | Previsão do tempo do dia escolhido na página de reserva (Open-Meteo), para o trabalho de Clima; ver [9](09-clima-temporario.md) |
| Marketing | Landing page do Jogaê |

> **Estado de validação:** o front-end e a aba da lojinha ainda estão em processo de validação. A aparência das telas pode mudar com as atualizações; o fluxo (escolher quadra, dia e horário, confirmar) deve se manter.

### Fora do escopo [decisão da equipe, DOCUMENTACAO.md §10]

- Reserva recorrente automática tipo "aula fixa".
- Múltiplas unidades/filiais por dono (um dono = uma arena).
- Marketplace de quadras.

### Restrições

- **Orçamento** [decisão]: teto de R$100/mês para toda a infraestrutura pessoal (servidor + domínio + APIs); nenhum serviço pago novo sem aviso.
- **Infraestrutura** [verificado]: um único servidor (VPS 4 vCPU/15 GiB), sem alta disponibilidade.
- **Equipe**: desenvolvimento majoritariamente individual desde a migração para a VPS.
- **Domínio**: produção roda em `jogae.razielhub.cloud`, exceção temporária; o produto terá domínio próprio antes de vender.

## 1.4 Estrutura analítica do projeto (EAP)

```
Jogaê
├── 1 Produto
│   ├── 1.1 Painel do dono (Hoje, Quadras, Clientes, Financeiro, Configurar)
│   ├── 1.2 Portal do jogador / lojinha
│   ├── 1.3 Landing page
│   └── 1.4 Chatbot com IA
├── 2 Plataforma
│   ├── 2.1 API NestJS + Prisma (16 modelos, 21 migrações)
│   ├── 2.2 Front React + servidor Node de borda (meta tags/tema por slug)
│   └── 2.3 Notificações (hoje só log; provedor real pendente)
├── 3 Qualidade
│   ├── 3.1 Testes unitários (backend Jest, frontend node:test)
│   ├── 3.2 Testes visuais e2e (Playwright, API mockada)
│   └── 3.3 Lint e regra de design (sem hex fora de tokens.css)
├── 4 Entrega e operação
│   ├── 4.1 publicar.sh (build local, deploy, rollback)
│   ├── 4.2 Backup e restauração
│   └── 4.3 Monitoramento
└── 5 Gestão e documentação
```

## 1.5 Histórico de marcos

Primeiro commit em 2026-08-24; 225 commits até 2026-10-14; tags `v0.1.0` e `v0.2.0`. [verificado: `git log`, `git tag`]

| Data | Marco |
|---|---|
| 2026-08 | Início; Entrega 01 da disciplina (escopo, DER, stack) |
| 2026-09-28 | Entrega 02: requisitos da Sprint 01, integrações CEP e IA |
| 2026-10 (início) | Migração de Vercel/Render/Supabase para a VPS |
| 2026-10-10 | Decisão: código e produção na mesma pasta (`/srv/apps/jogae`) |
| 2026-10-11 | Plano e início do redesign da gestão ([plano-gestao.md](../plano-gestao.md)) |
| 2026-10-14 | Lote final do relatório de UX (C04–C10, G05–G11, G13), 5 publicações no dia |

## 1.6 Planejamento das próximas fases

Planejamento por **fluxo contínuo (Kanban leve) com marcos**, adequado a equipe de uma pessoa. Cada item entra no quadro (Trello) com: objetivo, critério de aceite e risco. Prioridade = (valor para o 1º cliente) ÷ esforço, com **bloqueadores de segurança sempre à frente**.

| Fase | Objetivo | Itens | Critério de saída |
|---|---|---|---|
| A. Endurecer | Remover o que impede abrir ao público | OTP sem `devCode` e com provedor real; rate limit do chat; trocar o modelo do chatbot; domínio próprio | Checklist de [go-live](04-release-e-deploy.md#46-checklist-de-go-live) 100% |
| B. Concluir UX | Fechar relatório de UX e itens extras da fase 7 | Ver [plano-gestao](../plano-gestao.md) e `prompt-analise-ux.md` | Itens aceitos pelo dono |
| C. Piloto | 1–3 arenas reais | Notificações reais, suporte, termos/privacidade com CNPJ | Primeira reserva paga por cliente real |
| D. Escala | Preparar o crescimento | Ambiente de desenvolvimento separado, backup fora do servidor, painel da plataforma | Reavaliar a exceção de pasta única |
