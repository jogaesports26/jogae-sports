# 3. Processo de desenvolvimento

## 3.1 Modelo de trabalho

Fluxo contínuo e incremental: cada mudança pequena, testada e publicada logo. Ciclo: **ideia → item no quadro com critério de aceite → implementação → verificação → publicação → observação**.

> **Exceção vigente** [decisão 2026-10-10]: o desenvolvimento acontece direto em `/srv/apps/jogae`, commit na `main` e push quando o dono pedir, sem PR nem tag. Isso substitui o fluxo de branches descrito em [DOCUMENTACAO.md §9](../DOCUMENTACAO.md), que vale para a fase de equipe. Quando houver mais de uma pessoa programando, voltar ao fluxo com branches e PR.

## 3.2 Gestão de configuração (SCM)

| Item | Regra |
|---|---|
| Repositório | Monorepo `npm workspaces`: `apps/backend`, `apps/frontend` |
| Ramo | `main` é a única linha; deve estar sempre publicável |
| Mensagens de commit | Convencional em português sem acentos: `tipo(escopo): resumo`. Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`. Escopos usados: `api`, `portal`, `gestao`, `landing` |
| Atribuição | **Nenhuma** linha de coautoria de IA em commits/PR (CLAUDE.md do repositório) |
| Segredos | `.env`, `data/`, `compose.yaml` e scripts de produção ficam **fora do git** (`.git/info/exclude`) e fora das imagens (`.dockerignore`); `.env.example` é o contrato das variáveis |
| Versionamento | SemVer nas tags (`v0.1.0`, `v0.2.0` existem). Em produção, o identificador real é a tag da imagem `AAAAMMDD-HHMMSS-<hash>[-dirty]` |
| Dependências | `package-lock.json` versionado; `npm ci` em CI e nas imagens; dependência nova (ex.: GSAP) exige aprovação do dono |

**Débito de rastreabilidade** [verificado]: todas as publicações recentes saíram com sufixo `-dirty`, ou seja, com alterações não commitadas no momento do build. Regra a adotar: **commitar antes de publicar**, para que cada imagem corresponda a um commit exato.

## 3.3 Definição de pronto (DoD)

Uma mudança está pronta quando:

1. Atende o critério de aceite do item.
2. `npm run lint` passa nos dois apps (inclui `check-no-hex`).
3. Testes unitários passam; teste novo para regra de negócio nova ou bug corrigido.
4. Mudança de banco tem **migração** Prisma (nunca editar o banco à mão) e é compatível com a versão anterior do código (permite rollback).
5. Interface nova segue o `DESIGN.md` (cores só por tokens, movimento com `prefers-reduced-motion`, contraste AA, funciona em 360 px de largura).
6. Variável de ambiente nova está em `.env.example` e documentada no README.
7. Publicada com `./publicar.sh` e verificada (testes pós-deploy verdes).
8. Documentação afetada atualizada (README, esta pasta, CHANGELOG do servidor se mexer em infraestrutura).

## 3.4 Estratégia de testes

| Nível | Ferramenta | Onde | Escopo | Estado |
|---|---|---|---|---|
| Unitário backend | Jest | `apps/backend/src/**/*.spec.ts` (21 arquivos) | Regras de serviço | [verificado] |
| e2e backend | Jest | `apps/backend/test/` | Fluxos de API | 1 arquivo; [pendente] ampliar |
| Unitário/lógica front | `node --test` | `apps/frontend/edge`, `server/` | Grade, preços, horários, head, manifest, chat | [verificado] |
| Visual e2e | Playwright (API mockada) | `apps/frontend/e2e` | Tema por lojinha e captura da landing | [verificado] |
| Pós-deploy (fumaça) | `publicar.sh` | Produção | `/api/health`, `/healthz`, home, 404 de slug, `frame-ancestors *` no embed, migrações completas | [verificado] |
| Segurança | Revisão manual / `/security-review` | Antes de go-live | Auth, OTP, upload, injeção | [pendente] sistematizar |
| Desempenho | Lighthouse / web-perf | Landing e lojinha | Core Web Vitals | [pendente] |

**Meta de cobertura** [decisão proposta]: ≥70% de linhas nos serviços de reservas, preços e autenticação (os de maior risco). `npm run test:cov` no backend mede; registrar o valor atual na primeira medição.

## 3.5 Revisão de código

Sem revisor humano enquanto o trabalho é individual. Compensações: lint e testes obrigatórios, `/code-review` antes de mudanças grandes (migração, autenticação, preço) e, antes de go-live, revisão de segurança.

## 3.6 Integração contínua

`.github/workflows/ci.yml` roda em PR e em push na `main`: instala, gera o Prisma Client, **lint, build e testes** (backend), **lint e build** (frontend). `docker.yml` publica no GHCR ao criar tag `vX.Y.Z`, mas **não está no caminho de produção** (a produção usa o build local). O CI do GitHub e o `publicar.sh` precisam dar o mesmo veredito; o CI não roda os testes do front nem o Playwright [pendente: incluir `npm test` do front].

## 3.7 Padrões de código

- TypeScript estrito; backend com DTOs validados (`class-validator`, `whitelist`).
- Sem comentários óbvios; comentar o **porquê**.
- Português do Brasil em textos de interface e documentação; identificadores de código em inglês.
- Estilo visual: somente `tokens.css`; marca "Jogaê".
