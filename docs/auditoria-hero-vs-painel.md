# Auditoria: promessa do hero da landing × painel real

05/10/2026 · conferido contra o código do `main` (Pix e pagamentos), as telas do painel e a landing.

## O que a landing prometia e o produto não entrega (corrigido)

| Promessa na landing | Realidade | O que foi feito |
|---|---|---|
| Selo "+ R$ 140,00 · Pix recebido" no mockup do hero | Não existe Pix no código; o card "Pagamentos (Pix)" está em A Fazer no Trello | Selo removido |
| Card "Pagamentos integrados — receba online" | O sistema calcula e registra o preço da reserva, mas não cobra | Virou "Financeiro e relatórios" (faturamento, ocupação, meta); Pix aparece como "Em breve" |
| Comparação: "Pagamento integrado no ato da reserva" | Idem | Trocado por "Preço de cada horário já na reserva" |
| Como funciona, passo 3: "agendam e pagam sozinhos, sem calote" | Só agendam | Texto ajustado |
| "Suporte direto no WhatsApp" | Nenhum número configurado no projeto | Só aparece se `VITE_WHATSAPP` estiver definido |
| Mockup ilustrado de dashboard (kanban + gráfico de barras) | O painel real é a Visão geral (faturamento do mês, ocupação, meta, reservas de hoje); não há kanban | Trocado por screenshots reais (painel + página de reserva no celular), legendadas como dados de demonstração |
| Selo "4.9 de avaliação dos jogadores" | Público errado para uma página de venda B2B | Já havia sido removido antes desta rodada |

## O que o painel entrega e a landing ainda mostra pouco

- Agenda geral com todas as quadras lado a lado, relatórios, clientes (inativos, aniversariantes), cupons, equipamentos e equipe com permissões. Hoje só aparecem como cards de texto; dá pra ganhar mais uma screenshot (agenda) numa próxima rodada.

## Pendências que dependem de decisão ou dado seu

1. **Contato e CNPJ**: definir `VITE_CONTACT_EMAIL`, `VITE_WHATSAPP` e `VITE_CNPJ` no `.env.local` em desenvolvimento ou, em produção, no build da imagem do front (precisa de `ARG`/`ENV` no `apps/frontend/Dockerfile`). O rodapé e as páginas legais se adaptam ao que existir.
2. **Texto jurídico**: `/termos` e `/privacidade` são um texto-base fiel ao que o produto faz hoje; vale uma revisão jurídica antes de cobrar clientes.
3. **Política de preço**: a seção "Quanto custa?" diz o que já era dito no FAQ (sem taxa por reserva, sem fidelidade, mensalidade fixa quando houver plano) e que hoje é grátis. Se os planos Básico/Intermediário/Âncora (card do backlog) forem definidos, trocar por tabela.
4. **Prova social**: não há depoimento nem número de uso inventado. Os números reais ligam com `VITE_SHOW_STATS=true`; depoimentos entram em `content/testimonials.ts`.
