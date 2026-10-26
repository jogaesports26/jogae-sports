# Auditoria de segurança do Jogaê (2026-10-26)

Método: revisão estática do código (backend NestJS/Prisma, frontend React, servidor Node do frontend), busca por padrões de risco, `npm audit` e varredura de segredos nos arquivos versionados. Não foi feito teste dinâmico (pentest) contra o ambiente no ar.

## Resumo

| Categoria | Resultado |
|---|---|
| SQL Injection | Sem achado: nenhum `$queryRaw`/`$executeRaw`; tudo por Prisma parametrizado |
| Command Injection | Sem achado: `child_process` só em teste; nenhum `exec`/`eval`/`new Function` |
| XSS | Sem achado crítico; 1 melhoria (sem CSP) |
| Criptografia insegura | Sem achado grave; 2 observações |
| Vazamento de credenciais | Sem achado: sem segredos nos arquivos versionados; `.env` fora do git |
| Deserialização insegura | Sem achado: só `JSON.parse` de dados próprios (localStorage, respostas da API) |
| OWASP Top 10 | 1 achado alto (dependências), demais médios/baixos |

## Achados

### A1. Dependências do backend com vulnerabilidades (ALTO) — A06 Componentes vulneráveis
`npm audit --omit=dev` no backend: 8 vulnerabilidades (1 crítica, 6 altas, 1 moderada). Frontend: 0.
- `proxy-addr` (crítica): spoofing de IP via IPv4 mapeado em IPv6. Importa porque o rate limit (`@nestjs/throttler`) usa o IP e o app usa `trust proxy`.
- `multer` (alta, várias): DoS em upload. O app não usa upload multipart (fotos vão em base64 no JSON), então o risco real é baixo.
- `body-parser`, `qs`, `deepmerge-ts`: DoS.
- Correção: `npm audit fix` no backend, rodar testes e publicar. O `npm audit` informa correção disponível.

### A2. OTP exposto na resposta, se a flag ficar ligada (MÉDIO) — A07 Falhas de autenticação
`player-auth.service.ts` devolve `devCode` quando `OTP_EXPOSE_DEV_CODE=true`. O padrão é `false` (`compose.yaml`) e o `randomInt` (criptograficamente seguro) já substituiu o `Math.random`. Com a flag ligada qualquer pessoa entra como qualquer telefone. Já era pendência conhecida: manter desligada antes de cliente real e ter SMS/WhatsApp real.

### A3. JWT sem revogação, validade de 7 dias, token em localStorage (MÉDIO) — A07
- `auth.module.ts`: `expiresIn: '7d'`, sem refresh nem lista de revogação; token roubado vale 7 dias e trocar a senha não o invalida.
- Token em `localStorage` (`jogae_token`, `jogae_player_token`): qualquer XSS futuro o leva. Hoje não há `dangerouslySetInnerHTML`/`innerHTML`, e o React escapa por padrão, então o risco é só de defesa em profundidade.
- Sugestão: reduzir a validade e/ou cookie `HttpOnly`; no mínimo uma CSP.

### A4. Sem Content-Security-Policy no frontend (MÉDIO) — A05 Configuração
O servidor do frontend só envia `frame-ancestors *` na rota de embed; o Caddy usa o snippet `seguranca`, que não foi revisado aqui. Uma CSP restrita (script-src 'self' mais o hash do script de tema) limitaria o estrago de qualquer XSS.

### A5. bcrypt com custo 10 (BAIXO) — A02 Falhas criptográficas
`bcrypt.hash(..., 10)`. Aceitável, mas 12 é o recomendado hoje. Mudança simples, vale só para novas senhas.

### A6. Limite de corpo JSON de 10 MB em todas as rotas (BAIXO) — A04 Design inseguro
`main.ts` aceita 10 MB para fotos em base64, mas vale para a API inteira, inclusive rotas públicas. Dá para limitar só nas rotas de foto.

### A7. CSV sem proteção contra fórmulas (BAIXO) — Injeção (CSV/formula injection)
`csv.util.ts` escapa aspas e separadores, mas não neutraliza células que começam com `=`, `+`, `-`, `@`. Um cliente que cadastre nome `=HYPERLINK(...)` pode executar fórmula ao abrir a exportação no Excel. Correção: prefixar com `'` essas células.

### A8. Chamada externa ao ViaCEP (INFO) — A10 SSRF
`cep.service.ts` só aceita 8 dígitos e monta a URL fixa: sem SSRF. Sem timeout no `fetch`; sugestão de `AbortSignal.timeout`.

## O que está bom (evidências)
- **Isolamento entre donos (A01 Controle de acesso):** as consultas de reserva, quadra, avaliação, cliente, lista de espera e equipamento são escopadas por `ownerId` (`findOneOrThrow(courtId, ownerId)`, `court: { ownerId }`). Cliente do portal só cancela reserva própria (`where: { id, playerId }`). Guards `JwtAuthGuard` + `RolesGuard` + `StaffPermissionGuard` nos controllers.
- **Validação de entrada:** `ValidationPipe({ whitelist: true })` com class-validator; senha forte exigida no cadastro e na redefinição.
- **Reset de senha:** token aleatório de 32 bytes, guardado só como hash SHA-256.
- **OTP:** `randomInt`, limite de pedidos e de falhas por telefone, expiração, uso único.
- **Rate limit:** global 120/min por IP, mais 5–10/min em login, OTP e chat (6/min).
- **JWT_SECRET:** a subida falha se faltar ou tiver menos de 32 caracteres.
- **XSS no head da lojinha:** `renderHead` escapa HTML nos metadados, valida nomes e valores das variáveis CSS por regex e escapa `<` no JSON embutido em `<script>`; há testes (`head.test.ts`).
- **Segredos:** nenhum segredo nos arquivos versionados (só o `.env.example` com placeholder); `.env` no `.gitignore` e fora das imagens.
- **Servidor estático:** o Node usa `normalize`/`resolve` com `DIST` (proteção contra path traversal) e valida `slug` e `courtId` por regex.
- **Infra:** Helmet ativo, CORS por lista de origens, banco só na rede interna, HTTPS pelo Caddy, fail2ban.

## Prioridade sugerida
1. `npm audit fix` no backend (A1).
2. Manter `OTP_EXPOSE_DEV_CODE=false` e integrar SMS antes de ter clientes (A2).
3. CSP e validade/revogação do JWT (A3, A4).
4. CSV, bcrypt 12, limite de corpo por rota, timeout no ViaCEP (A5–A8).

## Limitações
Sem teste dinâmico, sem análise do snippet `seguranca` do Caddy, sem revisão do chatbot contra prompt injection (o endpoint tem rate limit e é público), sem varredura do histórico completo do git além de `sk-ant`.
