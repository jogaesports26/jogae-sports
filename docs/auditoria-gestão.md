# Auditoria de UX/UI — Painel Jogaê Sports

Sep 25, 2026 · @Raziel

## 1. Resumo executivo

1. **A paleta de cor primária compete consigo mesma.** O mesmo tipo de ação (botão principal "salvar"/"adicionar"/"criar") aparece ora em verde-limão, ora em azul sólido, ora em contorno neutro, dependendo da tela — às vezes na mesma tela. Sem uma hierarquia de cor clara, nada parece proposital; parece que cada tela foi feita por uma pessoa diferente.
2. **A Agenda — o coração do produto — está sub-construída.** Ela só mostra os horários que já têm preço cadastrado; se o gestor não configurou preço, o horário simplesmente não existe na grade, sem nenhuma explicação na própria tela. Isso faz a ferramenta mais importante do painel parecer quebrada ou vazia na primeira impressão.
3. **Ícones e fotos genéricos matam a sensação de marca.** Quadras são representadas por um ícone de troféu repetido; os cards da Visão geral usam emojis coloridos (calendário, moeda, bolo, zzz) que destoam do resto da UI, que é toda em ícones de linha monocromáticos. Nada disso comunica "arena esportiva" — poderia ser qualquer SaaS genérico.
4. **Uploads e datas usam controles nativos crus do navegador.** Campo de foto por URL + input de arquivo sem estilo, e inputs de data nativos (dd/mm/aaaa) aparecem em pelo menos 4 telas (editar quadra, relatórios, cliente, configurações). É o detalhe mais "datado"/inacabado do produto hoje.
5. **Densidade de informação desbalanceada: fraca onde deveria ser forte, alta onde deveria ser simples.** A Visão geral dá o mesmo peso visual a "Faturamento do mês" e a "aniversariantes do mês". Relatórios não tem eixo nem tooltip no gráfico. Já Preços & disponibilidade empilha três blocos de texto explicativo só para o gestor entender a diferença entre bloqueio recorrente e manutenção pontual — sinal de que o problema é a arquitetura da informação, não a falta de explicação.

## 2. Achados por tela

### Visão geral (/painel)

Primeira tela que o gestor vê, e a que menos comunica prioridade. Os 6 cards de KPI (Reservas hoje, Previsto pra hoje, Faturamento do mês, Ocupação do mês, aniversariantes, clientes inativos) têm exatamente o mesmo peso visual — tamanho, cor, tipografia — mesmo que "Faturamento do mês" seja uma ordem de grandeza mais importante para a decisão do dia que "2 aniversariantes esse mês". Não há filtro de período nem comparação com o mês anterior (setas de tendência, %), então o número fica solto, sem contexto de "isso é bom ou ruim?".

Os ícones dos cards são emojis nativos do sistema operacional (📅💰📈🏢🎂😴) — coloridos, com estilo próprio de cada emoji — enquanto o menu lateral usa ícones de linha monocromáticos consistentes. É a maior quebra de consistência visual do produto num único olhar, e a primeira coisa que o usuário vê ao entrar.

"Reservas de hoje" é a única seção de conteúdo da página e, com dado vazio, sobra uma caixa branca enorme com uma frase e um link — não há atalhos de ação (criar reserva rápida, ver agenda da semana) nem qualquer outra informação que preencha esse espaço. Não existe saudação com o nome da arena, nem qualquer elemento de marca além da cor.

### Quadras (/painel/quadras) — lista

Grid de cards, um por quadra, com ícone genérico de troféu em vez de foto real — mesmo o cadastro permitindo URL de foto (visto em Configurações), a listagem não usa a primeira foto cadastrada como thumbnail. Isso é uma oportunidade perdida simples: são quadras de futebol, o produto tem fotos, e a lista ainda assim é toda ícone-placeholder.

Clicar no **título** do card abre um modal de edição ("Editar quadra") em vez de navegar para o detalhe da quadra — comportamento não óbvio; o padrão esperado (inclusive pelo cursor de link no texto) é que clicar no nome abra a página da quadra, e que a ação de editar fique num ícone de lápis ou menu "⋯" separado. Só o link "Ver agenda →", no canto inferior direito do card, de fato entra na quadra.

Quadras inativas usam badge vermelho/rosa "Inativa" — cor tipicamente reservada para erro/alerta, quando "inativa" é só um estado neutro (o gestor pausou a quadra de propósito). Não há busca, ordenação ou contagem-resumo ("4 quadras · 2 ativas"), mas com poucos itens isso ainda não dói.

### Quadra → Agenda

Grade semanal (dia × hora), navegação por "Semana anterior / Hoje / Próxima semana". O grande problema: **a Agenda só exibe as horas que têm preço cadastrado** na aba Preços & disponibilidade. Quadras sem preço configurado mostram a semana quase inteira hachurada, sem nenhum aviso do tipo "configure preços para liberar horários" — o gestor vê uma agenda praticamente vazia e pode achar que é um bug. Faltam também: uma legenda explicando o hachurado, um indicador visual de "hoje" na régua de datas, visão do dia inteiro (a grade só mostra as 1–2 linhas de horário que existem, deixando a maior parte da tela em branco) e uma visão consolidada de todas as quadras num só calendário — essencial para quem administra mais de uma quadra e hoje precisa abrir uma de cada vez.

### Quadra → Preços & disponibilidade

A tela funcionalmente mais rica do painel, e a mais carregada de texto explicativo: três blocos de parágrafo ("os blocos de preço são gerados...", "essas opções controlam o que o jogador vê...", "diferente do bloqueio pontual, na aba Manutenção...") só para o gestor entender como as peças se conectam. Isso é sintoma de arquitetura confusa sendo compensada com documentação inline, não de excesso de cuidado.

Na mesma tela aparecem três estilos de botão diferentes para três ações do tipo "salvar": "Gerar horários" (contorno cinza), "Salvar configurações de reserva" (contorno escuro) e "Salvar preços" / "Salvar bloqueios" (azul sólido) — sem relação clara entre a cor e a importância da ação.

### Quadra → Fila de espera

Tela funcional porém mínima: lista simples de nome, telefone, horário desejado e um "x" para remover. Sem contador ("3 pessoas aguardando"), sem ação de notificar manualmente, sem indicar o que acontece de fato quando um horário abre (o texto de apoio explica, mas nada na interface confirma que o aviso foi enviado). Com poucos itens, a tela fica majoritariamente vazia — mesmo padrão de espaço subutilizado visto em outras abas.

### Quadra → Manutenção

Lista de bloqueios pontuais com data/horário, descrição, custo e status ("Marcar concluído" ou badge verde "Concluído · R$ 350,00"). É uma das telas mais claras do produto — estado pendente vs. concluído bem diferenciado. O botão principal "+ Novo bloqueio", porém, é azul sólido, enquanto o equivalente estrutural em Quadras ("+ Nova quadra", mesma posição no canto superior direito da página) é verde-limão — mesmo papel de interface, cores diferentes.

### Relatórios (/painel/relatorios)

A tela mais densa e a que mais se aproxima de um "relatório de verdade": faixa de meta de faturamento, filtros de período (Hoje/7 dias/Este mês/Mês passado + De/Até + seletor de quadra), 3 KPIs, ranking de quadras por faturamento, gráfico de barras de faturamento por dia, cupom mais usado e equipamento mais alugado. O conjunto de informação é bom; a execução visual não acompanha:

Os campos "De" e "Até" usam o input de data nativo do navegador (calendarzinho cinza padrão do Chrome), destoando completamente dos pills customizados ao lado. O gráfico de barras é sólido azul, sem eixo Y, sem grid, sem tooltip ao passar o mouse e com apenas 5 datas no eixo X distribuídas de forma irregular (09/09, 15/09, 17/09, 19/09, 25/09) — difícil de ler como tendência. O botão ativo dos filtros de período ("Este mês") usa um azul-marinho escuro que não aparece em nenhum outro lugar do produto como cor de "selecionado". "Cupom mais usado" mostra 1 linha de dado num card do mesmo tamanho dos outros, deixando metade do card vazio.

### Clientes (/painel/clientes)

Uma das melhores telas do painel. Filtros úteis e específicos do negócio (Todos, Inativos, Aniversariantes do mês, Faltas recorrentes), busca por nome/telefone, exportar CSV, e uma lista com Reservas, Gasto total e Última reserva por cliente — exatamente os dados que um gestor de quadra quer ver. Badges de contexto (Aniversário, N faltas, Inativo) aparecem só quando relevantes, sem poluir as linhas que não precisam deles.

Clicar no nome abre um modal de detalhe bem construído: resumo (reservas, gastos, faltas), data de nascimento editável e histórico de reservas com status colorido (Confirmada, Não compareceu). Único ponto fraco: o campo de data de nascimento usa, de novo, o input nativo do navegador, e os números de "2 aniversariantes"/"6 clientes inativos" mostrados na Visão geral não parecem linkar para os filtros equivalentes aqui — seriam dois cliques úteis a menos.

### Equipe (/painel/equipe)

Cadastro simples de professores/instrutores (nome + telefone) para associar a reservas. Padrão "formulário à esquerda + cards à direita" — o mesmo reaproveitado em Cupons e Equipamentos, o que é um bom sinal de consistência de template. O problema aqui é mais de nomenclatura/IA do que visual: **"Equipe" e "Funcionários" são dois itens de menu separados**, ambos sobre "pessoas que trabalham na arena", e nada no menu lateral deixa claro a diferença (instrutor sem login vs. funcionário com login e permissão). Um gestor novo provavelmente clica no errado na primeira tentativa. Os cards não mostram nenhuma associação (quais quadras/horários o instrutor atende), apesar do texto de apoio mencionar isso.

### Cupons (/painel/cupons)

Tela bem resolvida: formulário de criação à esquerda, cards de cupom à direita com badges de status coerentes (Ativo verde, Inativo cinza, Expirado laranja/bege), valor em destaque, uso e ações de texto (Editar / Ativar ou Desativar). É um bom exemplo de card denso mas legível — vale usar como referência de padrão para outras listagens do produto (Equipamentos já segue essa linha; Fila de espera e Manutenção, por exemplo, poderiam).

### Equipamentos (/painel/equipamentos)

Mesmo padrão de Cupons e Equipe (formulário + cards), aplicado a itens avulsos de aluguel (bola, colete, luva). Tela curta, direta, sem problemas notáveis — exatamente por seguir o template já validado nas outras duas. Único ponto: nenhuma das três telas desse grupo (Equipe/Cupons/Equipamentos) mostra confirmação antes do "x" de remover — não testamos por ser ação destrutiva, mas vale confirmar que existe um passo de confirmação antes de excluir de fato.

### Avaliações (/painel/avaliacoes)

Lista de reviews por quadra com estrelas, autor, data, comentário e um card lilás claro para a resposta do estabelecimento quando existe ("Sua resposta"). Falta o que normalmente vem primeiro numa tela de avaliações: **uma nota média agregada** (ex. "4,5 ★ · 12 avaliações") no topo da página — hoje o gestor só forma essa noção rolando a lista inteira e fazendo a média de cabeça. Também não há filtro por quadra ou por nota, nem ordenação explícita.

O botão "Responder" ocupa a largura total do card, um padrão de botão full-width que não aparece em nenhuma outra tela do produto (em todo o resto os botões têm largura do próprio texto/pill) — parece um componente de mobile que vazou para o layout desktop.

### Funcionários (/painel/funcionarios)

Aqui fica clara a diferença para "Equipe": Funcionários têm e-mail, senha e nível de permissão ("Somente visualiza" / "Gerencia reservas") para logar no painel pela aba "Sou funcionário" do login. É uma funcionalidade sólida (controle de acesso por papel), mas o nome do menu não entrega isso — só fica óbvio depois de entrar na tela. O e-mail cadastrado é cortado com reticências no card ("paulo.arenavitoria@jogaeseed.t...") sem tooltip para ver o valor completo, o que incomoda justamente num campo de credencial de acesso.

### Configurações (/painel/configuracoes)

A tela mais longa do produto — uma única coluna contínua com nome do estabelecimento, link da lojinha pública, QR code, widget de embed (iframe), telefone, CEP/endereço, foto de capa, descrição, comodidades (checkboxes) e meta de faturamento, tudo empilhado verticalmente. Em telas largas (testamos em \~1350px), **essa coluna ocupa menos da metade da largura disponível e deixa o resto da tela em branco do topo ao fim** — é o exemplo mais extremo de subutilização de espaço do painel inteiro, numa página que já exige bastante rolagem.

O campo "Foto de capa da lojinha" pede uma URL colada manualmente ("cole o link de uma imagem já hospedada... Instagram, Google Drive público, etc."), sem upload direto de arquivo do computador — uma barreira real para o perfil de usuário típico (dono de arena, não desenvolvedor), que provavelmente não sabe hospedar uma imagem e obter um link público. O botão final "Salvar alterações" é verde-limão — rompendo, mais uma vez, com o azul usado para "salvar" nas telas de Preços, Cupons e Equipamentos.

Uma seção útil que passa despercebida: "Meta de faturamento mensal" define o valor usado na barra "Meta de faturamento do mês" que aparece (vazia, sem call-to-action visível) no topo de Relatórios — a conexão entre as duas telas existe, mas só se descobre por acaso, rolando Configurações até o fim.

### Responsividade (mobile/tablet)

**Limitação desta auditoria:** o ambiente de navegação usado não permitiu redimensionar a janela do navegador para simular larguras de mobile/tablet (o comando de redimensionamento não teve efeito sobre a janela real do Chrome nesta sessão) — todas as telas acima foram avaliadas em desktop (\~1350px). Não dá pra confirmar visualmente o comportamento responsivo, mas alguns pontos observados no desktop já são sinais de risco específico pra telas pequenas e merecem teste manual prioritário: a barra de filtros de Relatórios (5 controles + 2 date pickers + dropdown + botão, tudo numa linha só); a grade semanal da Agenda (7 colunas fixas, sem indicação de scroll horizontal); o menu lateral fixo de ícone+texto (se não colapsar num menu hambúguer, toma uma fatia desproporcional da tela em telas estreitas); e os inputs de data nativos, que em iOS/Android têm aparência e comportamento ainda mais destoantes do resto da UI do que no desktop. Recomendamos um teste manual dedicado nessas quatro telas antes do redesign.

## 3. Problemas transversais

**Cor de ação primária sem regra.** Contamos pelo menos 4 cores diferentes fazendo o papel de "botão principal da tela": verde-limão (Entrar, + Nova quadra, Salvar alterações em Configurações), azul sólido (+ Novo bloqueio, Salvar preços, Salvar bloqueios, + Adicionar instrutor, + Criar cupom, + Adicionar equipamento, + Adicionar funcionário), contorno cinza (Gerar horários) e contorno escuro (Salvar configurações de reserva). O mesmo tipo de ação — "criar/salvar algo importante" — muda de cor sem lógica aparente entre telas estruturalmente idênticas (ex.: "+ Nova quadra" vs. "+ Novo bloqueio", ambos botões de topo-direito da página). Isso sozinho já comunica "feito por partes, sem design system", o oposto do objetivo premium.

**Controles nativos do navegador vazando na UI customizada.** Inputs de data (`dd/mm/aaaa`) e de arquivo (`Escolher Ficheiros`) aparecem sem estilização em Editar quadra, Relatórios, ficha do Cliente e Configurações. São o contraste mais forte com o resto da interface, que é toda customizada — e típicamente a primeira coisa que faz um produto parecer inacabado.

**Campos de imagem via URL, nunca upload direto.** Foto de quadra e foto de capa da lojinha pedem link de imagem já hospedada em outro lugar. Para o perfil de usuário do produto (dono de arena esportiva, não técnico), isso é uma barreira alta o suficiente pra provavelmente nunca ser preenchida — o que ajuda a explicar por que a lista de quadras hoje só mostra ícones genéricos.

**Emojis do sistema operacional como ícone de dado.** Os cards de KPI da Visão geral e alguns rótulos usam emoji nativo (📅💰📈🏢🎂😴) em vez de um ícone da mesma família usada no menu (linha, monocromática). Emoji renderiza diferente por sistema operacional/navegador e nunca combina com um set de ícones desenhado — é um dos motivos do painel parecer "genérico" em vez de autoral.

**Padrão "formulário + cards" é o melhor ativo de consistência do produto — e está subaproveitado.** Equipe, Cupons e Equipamentos repetem a mesma estrutura (formulário à esquerda, cards à direita, badges de status) e são, não por acaso, as telas mais coerentes do painel. Fila de espera e Manutenção, que são listas parecidas, não seguem esse padrão e parecem menos acabadas por isso.

**Espaço em branco não utilizado em telas com pouco dado.** Em telas de largura desktop (\~1350px), várias páginas (Fila de espera, Cupom mais usado em Relatórios, e principalmente Configurações inteira) usam uma coluna estreita de conteúdo e deixam metade ou mais da tela vazia. Isso não é "clean", é espaço desperdiçado — um SaaS premium usaria esse espaço pra contexto adicional (gráfico, preview, atalho) em vez de deixar em branco.

**Badges de status quase formam um sistema semântico — falta formalizar.** Verde = ativo/concluído, cinza = inativo/neutro, vermelho = alerta (faltas, quadra inativa), laranja/bege = especial (aniversário, expirado), lilás claro = informativo (resposta, nível de permissão). O mapeamento já existe organicamente no código atual; documentar essas 5 cores como token oficial (com regra clara de quando usar cada uma) resolveria boa parte da sensação de inconsistência sem redesenhar nada.

**Copy em tom bem informal, mas só às vezes.** "Voltar pras quadras", "pra criar uma reserva", "pro jogador" convivem com termos mais formais ("Taxa de ocupação", "Configurações do estabelecimento"). Não é um problema grave, mas indica que a voz da marca ainda não foi definida de propósito — outro sintoma de falta de "personalidade" consistente.

## 4. Recomendações priorizadas

### Ganhos rápidos (estilo/organização, sem mexer em fluxo ou estrutura)

1. **Unificar a cor de ação primária.** Escolher uma cor (verde-limão ou azul, não as duas) para todo botão de "ação principal da tela" e uma segunda cor neutra para ações secundárias. É uma troca de token de cor, sem mudar layout nenhum, e já reduz boa parte da sensação de inconsistência.
2. **Trocar os emojis por ícones de linha da mesma família do menu.** Os 6 cards de KPI da Visão geral e rótulos equivalentes em outras telas devem usar o mesmo set de ícones do menu lateral, só isso já tira a aparência de template gratuito.
3. **Estilizar os inputs de data.** Um componente de date picker customizado (ou, no mínimo, CSS que alinhe o input nativo ao resto do design) nos 4 lugares onde aparece (editar quadra não tem data, mas Relatórios, ficha do Cliente e a meta futura de "Válido até" em Cupons têm).
4. **Adicionar nota média agregada no topo de Avaliações.** Um número grande ("4,5 ★ · 12 avaliações") acima da lista, sem precisar de nenhuma mudança de fluxo.
5. **Trocar o badge vermelho de "Inativa" (quadra) por um neutro (cinza), igual ao usado em Clientes/Cupons.** Vermelho deveria ficar reservado para alertas reais (faltas, erro).
6. **Corrigir o botão "Responder" de Avaliações para largura automática**, igual a todos os outros botões do produto, em vez de full-width.
7. **Adicionar tooltip ou truncamento com "..." clicável no e-mail de Funcionários**, para o gestor conseguir ver/copiar a credencial completa.
8. **Formalizar e documentar as 5 cores de badge (verde/cinza/vermelho/laranja/lilás) como tokens semânticos oficiais**, aplicando-os de forma consistente onde hoje há variação (ex. status de quadra, de reserva, de cupom).
9. **Adicionar um texto de estado vazio explicativo na Agenda** quando não há preço configurado ("Nenhum horário disponível ainda — configure preços em Preços & disponibilidade"), com link direto para a aba certa — resolve a confusão mais urgente sem redesenhar a Agenda.
10. **Revisar o tom do copy** para decidir entre informal ("pras quadras") e neutro em todo o produto, e aplicar de forma consistente.

### Mudanças estruturais (relayout, novo componente, nova IA de navegação)

1. **Redesenhar a Agenda como uma grade de dia inteiro (ex. 06:00–23:00) desacoplada de preço.** Toda hora do funcionamento deveria aparecer na grade, com estado visual distinto para "sem preço definido", "disponível", "reservado" e "bloqueado/manutenção" — e uma legenda fixa explicando as cores. Hoje preço e disponibilidade estão fundidos numa regra não óbvia; seriam duas camadas independentes.
2. **Criar uma visão de agenda consolidada, com todas as quadras lado a lado** (colunas = quadras, linhas = horário, ou um seletor de quadra dentro da própria Agenda) em vez de obrigar o gestor a entrar quadra por quadra. Para quem tem 3–4+ quadras, essa é provavelmente a função mais usada no dia a dia e hoje exige mais cliques do que deveria.
3. **Repensar a IA de "pessoas": unificar Equipe e Funcionários num só item de menu ("Pessoas" ou "Equipe") com abas internas "Instrutores" e "Acesso ao painel"**, deixando claro no próprio rótulo a diferença entre quem atende na quadra e quem loga no sistema.
4. **Reestruturar Configurações em seções/abas** (ex. Geral, Lojinha pública, Comodidades, Metas) em vez de uma única coluna longa — aproveitando a largura da tela com um layout de duas colunas (formulário + preview da lojinha ao vivo, por exemplo), similar ao que Stripe/Notion fazem em telas de configuração densas.
5. **Trocar campo de URL de imagem por upload real (drag-and-drop) em Quadras e Configurações**, com preview de thumbnail, crop básico e armazenamento próprio — hoje a barreira técnica de "hospedar imagem em outro lugar e colar link" provavelmente explica por que a maioria das quadras aparece sem foto.
6. **Criar um sistema de componentes formal (design tokens) para botões, badges, cards e inputs**, com as regras de quando usar cada cor/variante — isso destrava, de uma vez, os achados de inconsistência espalhados por quase todas as telas, em vez de corrigir tela por tela.
7. **Repensar a hierarquia da Visão geral**: separar KPIs financeiros/operacionais primários (Faturamento, Ocupação, Reservas) de sinais secundários (aniversários, inativos), com os primeiros em destaque maior (ex. um card "hero" com tendência vs. mês anterior) e os segundos como uma lista compacta de "alertas"/"a fazer hoje", junto com atalhos de ação (criar reserva, ver agenda da semana).
8. **Adotar um padrão único de listagem em card para todo o produto**, baseado no que já funciona em Cupons/Equipamentos/Clientes, e aplicá-lo em Fila de espera, Manutenção e Avaliações — hoje cada uma dessas três reinventa o próprio card.
9. **Introduzir fotos reais de quadra como identidade visual central** (na lista de Quadras, no card do dashboard, na lojinha pública), substituindo o ícone genérico de troféu — essa é provavelmente a mudança única de maior impacto na percepção "premium vs. genérico" do produto, porque hoje nada na interface parece pertencer especificamente a uma arena de futebol.
