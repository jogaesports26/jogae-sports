# Projeto Interdisciplinar (Certificação) — Clima x Jogaê Sports

## Contexto

Disciplina de Projeto Interdisciplinar (Certificação): exige documentos e um artigo científico
relacionados ao tema **CLIMA**. Decidiu-se reaproveitar o sistema Jogaê Sports (SaaS de reserva
de quadras esportivas) como base do projeto, integrando dados climáticos à gestão de reservas.

## Tema definido

**Integração de dados climáticos em sistemas de gestão de quadras esportivas: prevenção de
cancelamentos e otimização da ocupação.**

O projeto combina duas frentes complementares:

1. **Alerta climático operacional** — previsão do tempo cruzada com as reservas já confirmadas.
2. **Análise histórica clima x ocupação** — dados históricos para apoiar decisões estratégicas do gestor.

## Decisão de escopo: visibilidade restrita ao gestor

Avaliou-se expor a previsão do tempo também ao usuário final no momento da reserva, mas essa
opção foi descartada.

- **Risco identificado:** mostrar previsão de chuva na tela de escolha de horário/pagamento pode
  assustar o usuário e reduzir a conversão de vendas.
- **Decisão:** a informação climática (tempo real e histórica) fica disponível **apenas na tela
  de administração**, visível somente ao gestor.
- **Fluxo:** o gestor identifica reservas em risco (ex: quadra descoberta com previsão de chuva)
  e entra em contato diretamente com o cliente para negociar remarcação.
- **Motivo:** evita perda de venda no fluxo do usuário e reduz reclamações/reembolsos por o
  cliente ser pego de surpresa, sem expor incerteza climática durante a compra.

O usuário final não terá nenhuma exibição de dados climáticos no sistema.

## Frentes do projeto

### Frente 1 — Alerta operacional (tela do gestor)

- Consome API de previsão do tempo (ex: OpenWeatherMap) para a data/local de cada reserva confirmada.
- Exibe na tela de administração algo como: `Quadra 3, sábado 14h — previsão de chuva 80%`.
- Gestor decide se contata o cliente para remarcar.

### Frente 2 — Análise histórica (dashboard do gestor)

- Cruza histórico de reservas com dados climáticos históricos da região.
- Identifica padrões: dias/estações com maior cancelamento por clima, impacto em quadras
  cobertas vs. descobertas.
- Apoia decisões estratégicas: precificação dinâmica, política de remarcação/reembolso,
  investimento em cobertura de quadras.

## Estrutura sugerida do artigo científico

1. Introdução — problema (perda de receita/satisfação por eventos climáticos não previstos)
2. Referencial teórico — clima urbano, sistemas de reserva, APIs meteorológicas
3. Metodologia — integração dos dados climáticos, o que foi medido
4. Desenvolvimento/protótipo — funcionalidade no sistema (alerta + dashboard do gestor)
5. Resultados/discussão — dados de exemplo, cenários, benefício estimado
6. Conclusão — impacto para o gestor, trabalhos futuros

## Entregáveis da disciplina

- [ ] Artigo científico (modelo a ser fornecido pelo professor/disciplina)
- [ ] Demais documentos exigidos (a definir conforme modelo)

## Status

Tema e escopo definidos. Próximo passo: decidir entre escrever o artigo primeiro ou implementar
a funcionalidade no sistema antes de documentar.
