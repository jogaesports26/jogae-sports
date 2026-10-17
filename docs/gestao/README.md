# Documentação de gestão de produção — Jogaê

Pacote de documentos que descreve **como o Jogaê é planejado, construído, entregue, operado e mantido**. Complementa a documentação técnica e de produto em [../DOCUMENTACAO.md](../DOCUMENTACAO.md).

_Versão 1.0 · 2026-10-17 · Responsável: Raziel Rodrigues · Revisão a cada release maior ou a cada 3 meses (o que vier primeiro)._

## Índice

| # | Documento | Área de conhecimento | Pergunta que responde |
|---|---|---|---|
| 1 | [Escopo e planejamento](01-escopo-e-planejamento.md) | Escopo, partes interessadas, cronograma | O que estamos construindo, para quem e em que ordem? |
| 2 | [Arquitetura e requisitos não funcionais](02-arquitetura-e-requisitos.md) | Arquitetura, qualidade, desempenho | Como é feito e que metas precisa cumprir? |
| 3 | [Processo de desenvolvimento](03-processo-de-desenvolvimento.md) | Configuração (SCM), qualidade, testes | Como o código nasce e é aprovado? |
| 4 | [Release e deploy](04-release-e-deploy.md) | Gestão de releases e mudanças | Como uma versão chega à produção e como se volta atrás? |
| 5 | [Operação e continuidade](05-operacao-e-continuidade.md) | Operação, monitoramento, backup, incidentes | Como o sistema é mantido no ar e recuperado? |
| 6 | [Riscos e pendências](06-riscos-e-pendencias.md) | Riscos, dívida técnica, roadmap | O que pode dar errado e o que falta fazer? |
| 7 | [Glossário](07-glossario.md) | Comunicação | O que significam os termos? |

## Fontes de verdade (para não duplicar)

| Assunto | Onde está o dado vivo |
|---|---|
| Código e histórico | Este repositório (`git log`) e o GitHub `jogaesports26/jogae-sports` |
| Versão em produção | `./publicar.sh --status`, `.versoes`, `.publicacoes.log` |
| Esquema do banco | `apps/backend/prisma/schema.prisma` e `prisma/migrations/` |
| Identidade visual | [`DESIGN.md`](../../DESIGN.md) e `apps/frontend/src/styles/tokens.css` |
| Servidor, backup, atualizações | `/srv/README.md`, `/srv/docs/RUNBOOK.md`, `/srv/docs/CHANGELOG.md` (fora deste repositório) |
| Tarefas do time (histórico) | Trello: https://trello.com/b/f2dEOaPL/jogae-sports |

## Convenção de afirmações

Cada fato é de um destes tipos: **[verificado]** (conferido no código/servidor em 2026-10-17), **[decisão]** (escolha do responsável, com data quando houver) ou **[pendente]** (ainda não feito ou não verificado). Nada aqui contém segredos; valores sensíveis vivem só no `.env` (fora do git).
