# 6. Riscos, dívida técnica e roadmap

## 6.1 Registro de riscos

Probabilidade (P) e Impacto (I): 1 baixo – 3 alto. Exposição = P × I. Reavaliar a cada release maior.

| ID | Risco | P | I | Exp. | Resposta | Dono | Gatilho |
|---|---|---|---|---|---|---|---|
| R1 | Sem provedor de SMS: com `OTP_EXPOSE_DEV_CODE=true`, qualquer pessoa entra como qualquer jogador; sem provedor, o cliente real não consegue logar | 3 | 3 | 9 | **Mitigar**: integrar provedor, manter flag desligada; bloqueio do go-live | Raziel | Antes do 1º cliente |
| R2 | Servidor único: queda ou perda do disco derruba o serviço | 2 | 3 | 6 | Aceitar a queda curta; reduzir impacto com R3 | Raziel | Contrato com cliente |
| R3 | Backup só local: perda do servidor perde dados | 2 | 3 | 6 | **Mitigar**: backup no R2 (custo baixo) antes do piloto | Raziel | Antes do 1º cliente |
| R4 | Custo da API de IA estoura (chat público) | 2 | 2 | 4 | Tetos diários por IP/global; modelo mais barato; alerta de gasto | Raziel | Uso > 80% do teto |
| R5 | Publicar com árvore suja impede reproduzir a versão | 3 | 2 | 6 | Commitar antes de publicar; script avisar/bloquear | Raziel | Imediato |
| R6 | Produção e desenvolvimento na mesma pasta: erro de edição afeta produção | 2 | 3 | 6 | Pipeline com testes e rollback; ambiente separado na fase D | Raziel | 1º cliente |
| R7 | Migração destrutiva sem volta | 1 | 3 | 3 | Migrações aditivas; backup antes; restauração testada | Raziel | Cada migração |
| R8 | Dependência de uma pessoa (fator-ônibus 1) | 3 | 2 | 6 | Documentação (este pacote), automação, scripts | Raziel | Contínuo |
| R9 | Token JWT em `localStorage` exposto a XSS | 2 | 2 | 4 | CSP via Caddy/helmet, sem HTML injetado; avaliar cookie httpOnly | Raziel | Revisão de segurança |
| R10 | Fotos em base64 no banco inflam backup e consultas | 2 | 2 | 4 | Mover para objeto (R2) | Raziel | Banco > 1 GB |
| R11 | Dados pessoais (telefone, nome) sob LGPD | 2 | 3 | 6 | Mapa de dados, política, exclusão a pedido, mínimo necessário | Raziel | Antes do go-live |
| R12 | Domínio pessoal (`razielhub.cloud`) servindo produto | 2 | 2 | 4 | Domínio próprio antes de vender | Raziel | Antes do go-live |
| R13 | Dependências vulneráveis ou desatualizadas | 2 | 2 | 4 | `npm audit` trimestral; atualização por lote com testes | Raziel | Trimestral |
| R14 | Chrome marca o domínio como perigoso | 2 | 1 | 2 | Falso positivo conhecido; pedir revisão se atrapalhar | Raziel | Relato |

## 6.2 Dívida técnica

| Item | Efeito | Custo | Prioridade |
|---|---|---|---|
| Publicações `-dirty` | Sem rastreabilidade | Baixo | Alta |
| CI do GitHub não roda testes do front | Veredito divergente do `publicar.sh` | Baixo | Média |
| e2e do backend com 1 arquivo | Regressões de API só aparecem em produção/smoke | Médio | Média |
| Documentação antiga (`DOCUMENTACAO.md` §3, §9 citam GHCR/PR/tag) | Informação desatualizada | Baixo | Alta (ver 6.4) |
| `docker.yml` e GHCR fora do fluxo | Confusão sobre o caminho de deploy | Baixo | Baixa |
| Sem agregador de erros | Falhas silenciosas | Médio | Média |
| Variáveis `VITE_*` além de `VITE_API_URL` não chegam ao build | Rodapé sem contato/CNPJ | Baixo | Alta antes do go-live |

## 6.3 Roadmap

Ver fases A–D em [1.6](01-escopo-e-planejamento.md#16-planejamento-das-próximas-fases). Itens planejados fora do mínimo: painel da plataforma (visão do dono do Jogaê), fidelidade por pontos, notificações reais, mapa do estabelecimento na lojinha, chatbot com bolhas.

## 6.4 Manutenção desta documentação

- Atualizar com cada release que altere processo, arquitetura ou risco.
- Corrigir `DOCUMENTACAO.md` §3 e §9 para refletir o fluxo atual (build local, `publicar.sh`) [pendente nesta entrega; o texto aqui prevalece até a correção].
- Cada documento tem dono único e vale a convenção [verificado]/[decisão]/[pendente]; ao resolver um pendente, trocar a marca e a data.

## 6.5 Métricas de gestão sugeridas

| Métrica | Fonte | Meta inicial |
|---|---|---|
| Frequência de publicação | `.publicacoes.log` | Pelo menos semanal durante o desenvolvimento ativo |
| Taxa de falha de publicação | `.publicacoes.log` (`FALHOU`/total) | < 10% |
| Tempo de restauração (teste) | Teste trimestral | ≤ 2 h |
| Cobertura dos serviços críticos | `npm run test:cov` | ≥ 70% |
| Itens pendentes bloqueadores de go-live | 4.6 | 0 antes do piloto |
| Custo mensal | Faturas | ≤ R$100 |
