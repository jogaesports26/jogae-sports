# Prompt para o Claude no Chrome: análise de UX do Jogaê (Gestão + Agendamento do cliente)

Como usar: abra o Chrome com a extensão do Claude, cole o texto abaixo (a partir de "VOCÊ É...") numa conversa nova e troque `[SENHA]` pela senha da conta de teste. Depois leve a análise e os prints para outra IA opinar.

---

VOCÊ É um designer de produto sênior e pesquisador de UX, especialista em SaaS B2B para pequenos negócios e em fluxos de reserva/checkout no celular. Vou te pedir uma análise crítica e completa, feita navegando de verdade no sistema com o navegador. Seja direto e honesto: não elogie por educação, aponte o que está ruim, cite textos exatos da tela e diga sempre o que mudaria.

## 1. O produto

**Jogaê** é um sistema de reserva de quadras esportivas (society, futsal, vôlei, beach tennis, tênis, basquete etc.) para donos de arenas pequenas e médias. Tem duas faces:

1. **Jogaê Gestão** (painel do dono/funcionário): onde o gestor cadastra quadras e preços, vê a agenda, gerencia reservas, clientes, financeiro, cupons, equipe e configura a lojinha.
2. **Lojinha pública / área de agendamento do cliente final**: a página de cada arena, onde o jogador escolhe a quadra, o dia e o horário e reserva (também existe o assistente virtual de chat e "Minhas reservas").

## 2. O que eu quero do produto (use isto como régua de tudo)

- **Minimalista, mas sem faltar dado.** Interface limpa, com pouco ruído, porém o gestor não pode sentir falta de nenhuma informação importante para tocar o negócio. Para cada tela, diga o que está sobrando (remover/esconder/agrupar) e o que está faltando.
- **Fácil de gerenciar.** Um dono de arena que não é técnico precisa operar o dia a dia e entender o negócio rapidamente: quem joga hoje, quanto entrou, que horário está vazio, que cliente sumiu, como mudar um preço.
- **Fácil para o cliente final agendar.** O jogador, quase sempre no celular, tem que achar a quadra, escolher o horário e concluir com o mínimo de toques, sem dúvida e sem cadastro desnecessário.
- **Dinâmico e adaptável a cada estabelecimento.** O mesmo sistema vai atender arenas bem diferentes, cada uma com **a sua logo, as suas cores e o seu jeito**. A lojinha precisa parecer da arena, não do Jogaê. Avalie o quanto isso funciona hoje e o que falta para ficar realmente flexível.

## 3. Acesso e regras de segurança

- **Gestão:** https://jogae.razielhub.cloud/login com `raziel.teste@jogae.test` e senha `[SENHA]`. É uma conta de teste (arena "Arena Centro Esportivo", 7 quadras, reservas futuras, cupons, equipamentos, instrutores). O financeiro aparece zerado e "Clientes" sem inativos porque não dá para criar reservas no passado; considere isso uma limitação dos dados de teste, não um defeito, mas diga se a tela vazia/zerada comunica bem.
- **Lojinha do cliente (sem login):** https://jogae.razielhub.cloud/arena-centro-esportivo (e a página de qualquer quadra, que abre ao clicar num card).
- **Regras:** não apague nada, não altere configurações existentes, não envie formulários que mudem dados reais, não use outras contas. Você pode abrir telas, clicar em abas, abrir modais, preencher campos SEM salvar e cancelar. No fluxo de reserva do cliente, vá até onde o sistema deixar sem confirmar; o login do jogador usa código por SMS/WhatsApp, então pare nessa etapa e analise o que vem antes e a própria etapa. O chat do assistente aparece como "não configurado" (falta a chave de IA): analise só o visual e a interação.
- Se algo travar ou der erro, registre (texto exato, tela, o que você fez) e siga em frente.

## 4. Como navegar

Faça tudo em **dois tamanhos de janela**: desktop (~1440 px de largura) e celular (~375 px). Use o redimensionamento de janela. Tire **capturas de tela de cada tela e de cada estado relevante** (vazio, aberto, modal, erro, foco no teclado quando possível) e me dê uma lista numerada com o nome de cada captura no formato `NN-tela-desktop` / `NN-tela-mobile` e uma frase dizendo o que ela mostra, para eu juntar os prints depois.

**Gestão (painel):** `/login`, `/painel` (Hoje, com a grade do dia), `/painel/quadras` e, dentro de uma quadra, as abas Agenda, Preços & disponibilidade, Fila de espera e Manutenção; `/painel/clientes` (e o histórico de um cliente) e `/painel/avaliacoes`; `/painel/relatorios` (Financeiro); `/painel/configuracoes` com as abas Arena, Lojinha pública, **Aparência**, Preços e Metas; `/painel/equipe/instrutores`, `/painel/equipe/acesso`, `/painel/cupons`, `/painel/equipamentos`. Teste também: o menu lateral (recolher com Ctrl+B), a busca rápida **Ctrl+K**, "Nova reserva" na grade do dia e o passo a passo inicial/medidor de progresso se aparecer.

**Cliente final:** a página da arena (topo, busca, filtros por esporte, cards das quadras), a ficha de uma quadra (fotos, informações, escolha de dia e horário, resumo/barra de reserva, fluxo de reserva), a barra de abas do celular (Início / Assistente / Minhas reservas), `/minhas-reservas`, o botão **Como chegar**, o assistente (chat), o alternador de tema claro/escuro, `/privacidade` e `/termos`.

## 5. O que analisar (em cada tela)

1. **Propósito e hierarquia:** dá para entender em 5 segundos para que serve a tela e qual é a ação principal? O que chama mais atenção e deveria ser isso?
2. **Informação:** o que está presente, o que está faltando para o dono decidir, o que é ruído. Números, rótulos, unidades, datas e moeda estão claros e consistentes?
3. **Minimalismo vs. completude:** onde há excesso (cartões, textos, botões duplicados) e onde falta dado. Proponha o que esconder atrás de um clique e o que subir para a frente.
4. **Facilidade de uso:** conte **quantos cliques/toques** cada tarefa abaixo leva e onde a pessoa pode se perder.
5. **Textos (copy):** clareza, tom, termos técnicos, erros de português, rótulos ambíguos, botões sem verbo.
6. **Estados:** vazio, carregando, erro, sucesso, confirmação antes de ações destrutivas. A tela vazia ensina o que fazer?
7. **Mobile:** alvos de toque, texto minúsculo, rolagem horizontal, teclado cobrindo campos, ações importantes ao alcance do polegar.
8. **Acessibilidade básica:** contraste, foco visível no teclado, campos com rótulo, não depender só de cor, tamanho de fonte.
9. **Consistência visual:** botões, cores, espaçamentos, tipografia, ícones, tabelas e cartões seguem um padrão ou mudam de tela para tela?
10. **Confiança:** a tela passa segurança (principalmente na lojinha, onde o cliente decide reservar e pagar)?

## 6. Tarefas para cronometrar (cliques e dificuldade)

**Como gestor:** (a) ver quem joga hoje e qual horário está livre; (b) criar uma reserva manual para um cliente que ligou; (c) bloquear um horário para manutenção; (d) mudar o preço da noite de uma quadra e de todas as quadras; (e) saber quanto faturei no mês e como estou contra a meta; (f) achar clientes que sumiram e os aniversariantes; (g) criar um cupom; (h) adicionar um funcionário com acesso limitado; (i) mudar logo e cores da lojinha e ver como ficou; (j) mudar horário de funcionamento, endereço e telefone; (k) achar qualquer coisa pela busca Ctrl+K.

**Como cliente final (celular):** (a) achar uma quadra de um esporte específico; (b) ver preço e horários livres de amanhã à noite; (c) iniciar a reserva e ver o que é pedido; (d) usar um cupom; (e) saber como chegar ao local; (f) ver ou cancelar uma reserva já feita; (g) tirar uma dúvida no assistente.

Para cada tarefa: nº de cliques/toques, onde travou, nota de facilidade de 0 a 10 e a sugestão.

## 7. Personalização por estabelecimento (parte muito importante)

Abra **Configurar > Aparência** e **Configurar > Lojinha pública** (sem salvar) e avalie:
- O que o gestor consegue personalizar hoje (logo, cores, presets, capa, textos, comodidades, ordem das quadras, fontes, layout, link/slug, domínio próprio, esportes, mensagens, politicas)? Liste o que **existe**, o que **falta** e o que está **escondido ou confuso**.
- A **prévia ao vivo** ajuda? Ela representa fielmente a lojinha real?
- **Teste de estresse mental** (e, se der para fazer sem salvar, na prévia): como o sistema se comporta com (1) nome muito longo, (2) sem logo, (3) logo escura sobre fundo escuro e logo clara sobre fundo claro, (4) cor de marca muito clara (ex.: amarelo) ou muito escura, (5) arena com 1 quadra e arena com 20 quadras, (6) arena de um só esporte e arena multiesporte, (7) tema claro e escuro do visitante. Aponte onde o contraste, o layout ou o texto quebram.
- Imagine **5 clientes bem diferentes** (arena de society de bairro; clube de tênis tradicional; arena de beach tennis jovem e moderna; quadra poliesportiva de condomínio; complexo esportivo grande com academia) e diga, para cada um, o quanto a lojinha conseguiria parecer "dele" e o que ele sentiria falta.
- Proponha um **modelo de personalização enxuto e gerenciável** (o mínimo de controles que dê o máximo de identidade): o que deveria ser configurável pelo gestor, o que deveria ser fixo para manter qualidade e consistência, e que "trilhos de segurança" evitam que alguém deixe a lojinha feia ou ilegível (ex.: correção automática de contraste).

## 8. Formato da resposta (siga esta estrutura)

1. **Resumo executivo** (máx. 12 linhas) e **notas de 0 a 10** para: minimalismo, completude de informação, facilidade de gestão, facilidade de agendamento do cliente, personalização por estabelecimento, consistência visual, mobile, acessibilidade.
2. **Lista numerada das capturas** (nome do arquivo + o que mostra).
3. **Análise por tela**, na ordem do item 4, cada uma com: *o que funciona*, *problemas* (cada um com **severidade: Crítico / Alto / Médio / Baixo**, **evidência** com texto exato e nome da captura, e **sugestão concreta**), *o que remover/esconder* e *o que falta*.
4. **Tarefas cronometradas** (tabela: tarefa, cliques, travas, nota, sugestão).
5. **Personalização:** matriz do que existe/falta, resultados do teste de estresse, os 5 perfis de cliente e o modelo de personalização proposto.
6. **Padrões do sistema:** inconsistências entre telas (botões, cores, tabelas, cartões, textos).
7. **Top 10 prioridades**, ordenadas por impacto, com esforço estimado (P/M/G) e em qual das duas faces (Gestão ou Cliente) cada uma está.
8. **O que você NÃO conseguiu avaliar** e por quê (ex.: login do jogador, chat sem chave, dados zerados).
9. **Bloco final autônomo para colar em outra IA:** um texto de até 40 linhas, que dê todo o contexto (produto, objetivo minimalista + completo + fácil + personalizável), os 10 principais achados e 6 perguntas específicas para a outra IA responder (por exemplo: "qual a melhor estrutura de menu para 5 áreas?", "quais controles de marca realmente importam?", "como simplificar a escolha de horário no celular?").

Regras finais: baseie-se só no que você viu na tela (não invente funcionalidades nem fale de código); quando estiver em dúvida, diga que não tem certeza; priorize achados que mudem a vida do dono da arena e a taxa de conclusão da reserva do cliente.
