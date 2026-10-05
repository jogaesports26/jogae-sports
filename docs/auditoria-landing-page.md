# Auditoria de Design e Mensagem — Landing Page Jogaê Sports

Sep 25, 2026 · @Raziel

## Resumo executivo

1. **Falta prova social real.** Não há depoimento, logo de cliente ou número de arenas atendidas em nenhum ponto da página — a única "prova" é um badge de avaliação dos *jogadores*, que é o público errado para uma landing de venda B2B.
2. **Mockups genéricos demais para a vibe "premium e única" pedida.** Os ilustrações de dashboard/celular no hero e os ícones de feature são um kit visual padrão de SaaS, sem identidade própria do produto — e contrastam com as fotos aéreas reais de quadra que aparecem na página de reserva do jogador, que na prática parecem mais premium.
3. **Mistura de público na página B2B.** "Sou jogador" no menu principal e o badge "4.9 de avaliação dos jogadores" no hero introduzem o público errado logo na primeira dobra de uma página feita para donos de arena.
4. **Rodapé praticamente vazio.** Sem contato, termos, política de privacidade ou CNPJ — pesa contra a confiança em um produto que vai processar pagamentos (Pix) do estabelecimento.
5. **Nenhuma prova numérica.** Todos os benefícios (tempo economizado, redução de calote, ocupação) são afirmados, nunca quantificados — a comparação Planilha/WhatsApp vs. Jogaê é só qualitativa.

## Achados por seção da página

### Header / navegação

Logo + 4 links: Funcionalidades, Sou jogador, Entrar, Criar conta (CTA em destaque azul). "Sou jogador" aparece com contraste mais baixo (cinza) que os outros itens — não fica claro se é intenção de desenfatizar. De qualquer forma, ter uma rota para o jogador final no menu principal de uma landing 100% B2B é ruído: compete por atenção logo na primeira dobra com o público que a página deveria estar convertendo.

### Hero

Headline forte e específica — "Sua quadra parou de depender do WhatsApp" — comunica a dor do dono, não do jogador, em segundos. Subheadline resume os 3 pilares (agenda, reservas, pagamentos) sem jargão. CTA duplo bem resolvido: "Criar conta grátis" (primário, verde-lima) e "Ver como funciona" (secundário, outline) — sem excesso de botões. Os 3 badges de confiança (sem taxa, sem fidelidade, suporte WhatsApp) respondem objeções comuns de compra logo de cara. Pontos fracos: o mockup visual (dashboard + celular com barras genéricas, elementos flutuantes "+R$140 Pix recebido", "Grade 100% ocupada", "4.9 de avaliação dos jogadores") é uma ilustração de template, não um screenshot real do produto — reduz a sensação de prova e originalidade. O badge de avaliação "dos jogadores" está deslocado do público desta página.

### Como funciona (3 passos)

Estrutura clara e didática (01/02/03), reduz a fricção percebida de setup ("menos de 2 minutos"). Cards brancos consistentes. Problema de layout: há um espaço em branco muito grande (parece bug de margin/padding) entre esta seção e "Tudo que você precisa", quebrando o ritmo de leitura da página.

### Funcionalidades (grid 2×3)

Seis cards com ícone, título e descrição curta — completo e claro. Mas todos têm o mesmo peso visual: nenhum se destaca como diferencial principal (ex.: pagamentos integrados, que resolve calote, provavelmente gera mais valor percebido que "múltiplos esportes", mas estão visualmente idênticos). Ícones são line-icons genéricos em quadrado cinza-claro, sem qualquer referência à identidade esportiva da marca. "Chatbot inteligente (em breve)" está na mesma grade de features já entregues — pode comunicar produto incompleto logo na primeira leitura.

### Planilha e WhatsApp vs. Jogaê Sports

Seção de copy forte: contraste direto ✓/✕ reforça dor → solução de forma eficaz, bem posicionada antes do FAQ. Falta, porém, prova numérica que sustente as afirmações (ex.: "economize X horas/mês", "reduza Y% de no-show") — hoje é só qualitativo.

### FAQ

Quatro perguntas bem escolhidas (taxa, mensalistas, app, múltiplas quadras) antecipam objeções reais de um dono de estabelecimento. A primeira pergunta (sobre taxa) já vem aberta por padrão, o que é uma boa decisão — é a dúvida mais crítica pra decisão de compra.

### CTA final e rodapé

CTA final repete "Criar conta grátis" e reforça baixa fricção ("sem cartão de crédito"). O rodapé, porém, é mínimo: só nome e copyright, sem contato, termos, política de privacidade, redes sociais ou CNPJ. Isso pesa contra confiança em um produto B2B que processa pagamentos.

### Prova social (transversal)

Não há, em nenhum ponto da página, depoimento de dono de arena, logo de cliente, número de estabelecimentos atendidos ou case de sucesso. Essa é a lacuna mais crítica da página: a decisão de compra de um gestor depende de confiança/prova ainda mais que a de um jogador final.

### Responsividade mobile

Limitação desta auditoria: o ambiente de navegador usado não permitiu redimensionar a janela pra simular um viewport mobile real (ficou travado em \~1451px de largura mesmo após comandos de resize), então não consegui capturar screenshots mobile de fato. Como proxy, inspecionei o CSS carregado: a página tem a meta tag `viewport` correta e 47 regras `@media` distribuídas em breakpoints de 640px, 768px, 860px, 900px e 960px — sinal de que a responsividade foi implementada de propósito. Não encontrei, porém, nenhum menu-hambúguer no código do header, o que sugere que os 4 itens de navegação podem competir por espaço ou quebrar linha em telas estreitas. **Recomendo validar visualmente em um celular real antes de assumir que está correto** — este ponto não pôde ser confirmado aqui.

### Consistência com o resto do produto

As páginas públicas de `/cadastro` e `/login` mantêm a mesma paleta azul-marinho/lima e a mesma ilustração de dashboard do hero — boa continuidade visual nessa parte do funil. Já a página pública de reserva do jogador (ex.: `/arena-vitoria`) usa fotos aéreas reais de quadra, que comunicam qualidade melhor que as ilustrações genéricas da landing — um sinal de que o material real do produto pode ser mais forte que o material de marketing atual. Não tive acesso ao painel de gestão do dono (dashboard pós-login): isso exigiria criar uma conta de teste, o que está fora do escopo do que posso fazer nesta auditoria. Vale comparar manualmente se os gráficos/cards do mockup do hero batem com o que o dono realmente vê ao entrar.

## Avaliação da mensagem/copy

**Foco no público certo:** majoritariamente sim. O hero, a subheadline, o "Como funciona" e o FAQ falam claramente com o dono/gestor ("sua quadra", "seu estabelecimento", "administrar", "painel do dono"). A única quebra de consistência é "Sou jogador" no menu e o badge de avaliação de jogadores no hero, que introduzem o público errado logo na primeira dobra.

**Clareza:** copy direta, curta, sem jargão técnico. Frases como "sem horário duplicado, sem mensagem fora de hora, sem planilha pra fechar o mês" são concretas e batem com dores reais do dia a dia de quem gerencia uma quadra.

**Foco em benefício:** bom equilíbrio entre feature e benefício — tempo economizado, redução de calote, autoatendimento 24h, ocupação e relatório financeiro instantâneos. Não fica preso a listar só funcionalidades técnicas.

**Tom de voz:** direto, confiante, em português brasileiro natural (não soa como copy traduzida ou genérica). Consistente do hero ao CTA final.

**Ponto fraco principal:** ausência de prova quantificada. Todos os benefícios são afirmados, nunca demonstrados — nenhum número real ("usado por X arenas", "processou R$X em reservas", "economiza X horas/semana"). Isso deixa a promessa "premium" apoiada só no design, sem lastro de credibilidade — e para um SaaS B2B, prova > afirmação.

**Preço:** não há menção a valor/planos em nenhum lugar da página. Isso pode ser intencional (venda mais consultiva) ou pode gerar hesitação se o modelo de aquisição pretendido é self-service — vale uma decisão explícita sobre isso.

## Recomendações priorizadas

### Ganhos rápidos (baixo esforço, alto impacto)

1. Remover ou reposicionar "Sou jogador" do menu principal (rodapé ou subdomínio próprio) — a landing de venda B2B não deveria abrir espaço de navegação pro público errado.
2. Trocar o badge "4.9 de avaliação dos jogadores" no hero por algo que prove confiança do *dono* (ex.: "X arenas já usam o Jogaê") ou remover até haver um número real de gestores.
3. Corrigir o espaço em branco excessivo entre "Como funciona" e "Tudo que você precisa" — parece bug de layout.
4. Completar o rodapé: contato/suporte, termos de uso, política de privacidade, CNPJ/endereço — relevante pra confiança num produto que processa pagamentos.
5. Mover "Chatbot inteligente (em breve)" pra fora da grade principal de features, ou remover até o lançamento, pra não comunicar produto incompleto na primeira leitura.
6. Validar visualmente a página em um celular real, confirmando que os 4 itens do header não quebram ou disputam espaço.

### Reestruturação de seções/mensagem (maior esforço)

1. **Adicionar prova social real** — depoimentos de donos de quadra (nome, foto, nome do estabelecimento), logos de clientes e, idealmente, 2–3 números fortes (nº de arenas ativas, reservas processadas, redução de no-show). Esta é a lacuna mais crítica da página hoje.
2. **Substituir os mockups ilustrativos genéricos por screenshots reais** (ou uma composição estilizada a partir deles) do painel de gestão — muda a percepção de "template de landing page" para "produto real e testado".
3. **Quantificar a comparação Planilha/WhatsApp vs. Jogaê** com números reais de clientes, se disponíveis (ex.: "economize X horas por mês").
4. **Definir e comunicar uma política de preço clara** — mesmo que seja "a partir de R$X/mês" ou "fale com vendas" — reduz fricção e passa mais transparência pra um comprador B2B avaliando ferramentas.
5. **Repensar a identidade visual de ícones/ilustrações** pra ter linguagem própria da marca esportiva — hoje é um kit de ícones/ilustração de SaaS genérico, o que vai contra o objetivo de vibe "premium e única".
6. **Auditar o painel pós-login** e comparar com a promessa visual do hero — se o dashboard real for mais simples que o mockup, a primeira experiência pós-cadastro quebra a expectativa criada pela landing. (Não verificado nesta auditoria por exigir criar conta.)
