---
name: Jogaê
version: 1.0
description: Identidade visual do Jogaê, plataforma de agenda e reservas para quadras esportivas.
# Fonte única dos valores: apps/frontend/src/styles/tokens.css. Este arquivo documenta e explica;
# se os dois divergirem, vale o tokens.css (o lint de hex só deixa cor em tokens.css).
colors:
  brand-primary: "#013ff6"      # azul da marca: seleção, links, preço, fundo do hero
  brand-600: "#0132c4"          # azul mais fundo (fim de gradiente)
  brand-50: "#e8edff"           # azul bem claro (fundos suaves, chips informativos)
  brand-action: "#acec00"       # lima: a ação principal da tela
  on-action: "#00182e"          # texto sobre lima
  on-brand: "#ffffff"           # texto sobre azul
  navy: "#00182e"               # texto principal, fundos escuros
  background: "#f4f5fa"         # cinza claro de página (na landing: --color-soft)
  surface: "#ffffff"            # cards e modais
  text-secondary: "#5b6472"
  text-muted: "#8b94a3"         # só detalhe; NÃO usar pra texto que precisa ser lido
  positive: "#1b9e52"
  negative: "#c62828"
  warning-text: "#9a5b00"
  rating: "#8a6400"
typography:
  heading: { family: "Inter Tight", weights: [500, 600, 700], tracking: "-0.02em", leading: 1.1 }
  body:    { family: "Inter", weights: [400, 500, 600], size: 16px, leading: 1.5 }
  display: { size: "clamp(38px, 5.2vw, 76px)", weight: 600, tracking: "-0.035em", leading: 1.02 }
  h2:      { size: "clamp(30px, 3.6vw, 48px)", weight: 600 }
  label:   { size: 13px, weight: 500 }
rounded:
  sm: 10px
  md: 16px
  card: 20px
  panel: 40px     # painel grande da landing (hero)
  pill: 9999px    # botões e chips
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48]
  section-landing: "8vw 6vw"
---

# Jogaê — Design

## Visão geral

O Jogaê é uma ferramenta de trabalho do dono de quadra, e ao mesmo tempo a vitrine que o jogador usa para reservar.
A sensação que o visual deve passar é **de esporte e de organização**: energia (lima e azul vivos), mas com a
calma de um painel que funciona (muito espaço, texto claro, nada decorativo sem função).

O nome da marca é **Jogaê**, sem "Sports". Em textos curtos usa-se só "Jogaê"; quando for preciso dizer o que ele
faz, vem uma frase ao lado ("reservas e gestão de quadras"), não um sufixo no nome.

Dois públicos, dois níveis de ousadia:

- **Landing e telas do dono:** identidade completa (azul, lima, navy, movimento comedido).
- **Lojinha do estabelecimento:** a marca do dono manda. O Jogaê aparece só em "Feito com Jogaê" e no comprovante.

## Cores

**Duas famílias que nunca se misturam** (regra do `tokens.css`):

1. **Marca (`--brand-*`)** muda por lojinha quando o dono escolhe um tema (presets Jogaê, Quadra, Areia, Noite e
   Clássico). Serve para seleção, links, preço, hero e botão de ação.
2. **Semântica (`--color-positive/negative/warning/info/rating`)** tem significado fixo (sucesso, erro, aviso,
   informação, estrela). Nunca muda com o tema e nunca é usada como decoração.

Papéis:

| Cor | Papel |
|---|---|
| Lima `#acec00` | **A ação principal da tela. Um botão lima por seção.** Também detalhes pequenos (pontos, ícone de check, valores sobre azul ou navy). |
| Azul `#013ff6` | Seleção, links, preço, fundo do hero e das seções de destaque. |
| Navy `#00182e` | Texto principal, fundos escuros (comparação, rodapé), texto sobre lima. |
| Cinza claro `#f4f5fa` | Fundo de página e de cards secundários. |

Contrastes verificados (relação calculada a partir dos valores acima; AA pede 4,5:1 para texto normal e 3:1 para texto grande):

| Par | Relação | Uso |
|---|---|---|
| navy sobre lima | 12,6:1 | texto dos botões de ação |
| branco sobre azul | 6,9:1 | texto no hero e nas seções azuis |
| lima sobre azul | 4,85:1 | valores em destaque sobre azul (só texto médio ou grande; em azul claro do gradiente cai, então use sobre painel escurecido) |
| lima sobre navy | 12,6:1 | rótulos e números sobre fundo escuro |
| azul sobre branco | 6,9:1 | links e preço |
| cinza secundário sobre branco | 6,0:1 | texto de apoio |
| cinza mudo sobre branco | 3,1:1 | **não passa para texto**; só detalhe |
| **lima sobre branco** | **1,4:1** | **nunca como texto nem como linha fina** |

Modo escuro existe só nas rotas da lojinha (`data-theme="dark"`). Os neutros são uma paleta fixa e a marca é
derivada no backend. O painel do dono continua claro.

## Tipografia

- **Inter Tight** nos títulos (500 a 700), com espaçamento negativo e entrelinha curta. É ela que dá o tom "esporte".
- **Inter** no corpo (400 a 600), 16px com entrelinha 1,5.
- Escala fluida com `clamp()` nos títulos grandes. Linhas de texto corrido com no máximo 46 a 65 caracteres.
- Texto que precisa ser lido: **mínimo 13px**; em cards e FAQ, 15 a 16px.
- Título só em sentence case. Nada de caixa alta nem de uma palavra isolada em outra cor dentro do título.

## Layout

- **Ritmo de fundos** (landing): azul (hero) → lima (faixa de modalidades) → branco → azul-claro → navy → azul → cinza claro → branco → azul → navy.
  Não colocar três fundos chapados e saturados em sequência; alternar claro e escuro.
- Alinhamento à esquerda no hero e nos blocos de texto. Centralizado só em títulos de seção curtos.
- Espaçamento em múltiplos de 4 (4, 8, 12, 16, 24, 32, 48). Seções da landing: `8vw 6vw`.
- Raio por hierarquia: **painel (40) > card (20 a 28) > elemento interno (10 a 16)**. Nunca o mesmo raio em tudo.
- Em telas até 640px tudo vira uma coluna; sem rolagem horizontal (verificado em 375, 768 e 1280px).

## Gestão (painel do dono)

- **Casca:** barra lateral e página no mesmo fundo (`--color-sidebar`), o conteúdo num painel arredondado com borda fina (`--color-background`) e os cartões um degrau acima (`--color-surface`). Três degraus de azul-navy, sem sombra.
- **Menu:** 5 áreas em 2 grupos, "Dia a dia" (Hoje, Quadras, Clientes) e "Negócio" (Financeiro, Configurar). Item ativo em azul, selo com a contagem de reservas de hoje, recolhe para ícones (botão e Ctrl+B), vira gaveta no celular. Telas que moram dentro de uma área (Avaliações, Equipe, Cupons, Equipamentos) aparecem como abas no topo do conteúdo.
- **Grade do dia (assinatura do produto):** quadras em linhas, horas em colunas, linha de "agora". Aqui a lima também aparece nos blocos de reserva, porque é dado e é o traço do Jogaê (o mesmo da mini-agenda da landing). Fora disso, a lima continua só no botão principal. Horas já passadas ficam apagadas; no celular a grade rola sozinha até o "agora".
  - **Estados legíveis (G02):** o que dá para fazer é o mais forte: horário livre tem borda azul-clara, fundo levemente tingido e "+" sempre visível; o que já passou quase some (contorno de 8%, sem "+"); sem preço fica hachurado. Reservado = lima; concluída e faltou têm fundo escuro com borda da própria cor e símbolo no texto (✓ e ✕); manutenção tem hachura âmbar e a palavra. O significado nunca depende só da cor. Contrastes do texto conferidos no tema escuro (7,4:1 a 8,3:1).
  - **Legenda antes da grade**, compacta, mostrando só os estados que existem naquela tela (Reservado e Livre sempre; Concluída, Faltou, Manutenção, Já passou e Sem preço quando aparecem). Cada amostra repete o estilo da célula.
  - **Regra de "já passou":** o mesmo do servidor e da agenda semanal: horário que já começou não tem botão, inclusive a hora corrente; "Nova reserva" oferece os meios-horários que ainda restam.

- **Clientes e Quadras:** Clientes é uma tabela (avatar com iniciais, alertas em pílulas, números alinhados à direita), com filtros que mostram a contagem, busca com atraso de 300 ms e paginação "Anterior / Próxima" ("1–20 de N"). No celular a tabela rola dentro do cartão, nunca a página. Os cards de Quadras mostram a faixa de preço ("R$ 80,00 a R$ 110,00/h") e um aviso âmbar quando falta preço.
- **Busca rápida (Ctrl+K):** janela nativa `<dialog>` com telas e, a partir de 2 letras, clientes; setas, Enter e Esc; no celular, o botão de lupa na barra do topo. Sem biblioteca externa.

- **Financeiro (gráficos):** SVG puro, sem biblioteca, em `components/panel/charts/`. Gráfico de área do faturamento por dia (um ponto por dia, com 0 nos dias vazios, eixo com teto redondo, dica ao passar o mouse e setas do teclado, desenhado na largura real do cartão para o texto não encolher no celular); ranking em barras horizontais (quadras, cupons, equipamentos); barras agrupadas "este período e o anterior" por quadra; tabela "Detalhe por quadra" com rodapé de total. Cores só de tokens: série atual em `--brand-primary`/`--brand-text`, anterior em `--color-text-muted`. Todo valor aparece também em texto (nunca só em cor ou só no desenho). Cada indicador mostra a variação sobre o período anterior de mesmo tamanho (▲ verde / ▼ vermelho com sinal e %); sem base de comparação, diz isso em palavras.

- **Senha (cadastro, redefinição, funcionário):** campo com o medidor `PasswordMeter` (4 barras + frase em texto: "Senha forte", "Essa senha é muito comum"). Regra: 8 a 72 caracteres, sem senha comum, sem repetir 1 ou 2 caracteres e sem só números; o servidor decide (`common/strong-password.ts`) e o frontend só avisa antes (`lib/password.ts`). O login NÃO exige 8: contas antigas têm 6 ou 7.
- **Acessibilidade e movimento:** todo campo tem nome (rótulo ou `aria-label`; linhas repetidas numeram "regra 2", "bloqueio 1"); alvo de toque de pelo menos 24 px; anel de foco também em campos de data e hora; `prefers-reduced-motion` zera animações e transições em todo o app (o indicador de carregamento fica de fora). Prévias de outra tela dentro do painel (a prévia da lojinha) voltam aos neutros claros.

- **Chatbot da lojinha (`ChatWidget`):** bolhas de conversa. O assistente tem avatar (inicial "J" na cor de ação) e bolha clara; o cliente fala à direita em azul; mensagens seguidas do mesmo lado se agrupam (cantos menos arredondados, avatar só na última). Cabeçalho com nome, frase de apoio, "Nova conversa" e fechar. Antes da primeira pergunta aparecem 3 sugestões clicáveis. "Digitando" é uma bolha com 3 pontos (parada para quem pede menos movimento, e anunciada por `role="status"`). A conversa é um `role="log"` que rola sozinho só se a pessoa já está no fim; se ela subiu para reler, aparece "Ir para a mensagem mais nova". Pergunta que não chegou mostra "Não enviada. Tentar de novo"; limite de mensagens (429) tem texto próprio. Avisos do próprio chat nunca viram histórico enviado ao servidor, e o histórico respeita o limite do servidor (20 mensagens de até 2000 caracteres).

- **Como chegar (lojinha):** botão `DirectionsButton` (ícone de seta de navegação + "Como chegar", 40 px de altura) no topo da página da arena, sobre a faixa colorida (`onBrand`, translúcido), e na ficha da quadra, abaixo do nome da arena (`default`, borda fina e texto da marca). Abre a rota do Google Maps em outra aba (`rel="noopener noreferrer"`, rótulo diz que sai do site); sem endereço cadastrado o botão não aparece. Nenhum mapa é incorporado: nada do Google é carregado até o clique.

- **Equipamento por quadra:** em Equipamentos, o bloco "Onde aparece" (`CourtScopePicker`): "Todas as quadras" (padrão) ou só as quadras marcadas; sem nenhuma marcada o botão de salvar fica desabilitado e a frase diz "Escolha ao menos uma quadra". Cada cartão mostra "Em todas as quadras" ou "Só em: …". Quem tem uma quadra só não vê nada disso (não há o que escolher).

- **Prévia de Aparência (G03):** usa só dados reais da arena: nome, endereço, número de quadras, menor preço por hora, capa e logo, e o aviso "Ainda não salvo" / "Igual ao que está no ar" ao lado do título (compara pelo efeito, aplicando os padrões). Faltando dado, diz isso ("Endereço ainda não cadastrado", "Defina os preços para mostrar o valor") em vez de inventar. Só os horários (18:00, 19:00, 20:00) são ilustrativos, e a nota abaixo da prévia avisa. Estilo, cores, cantos e letra aparecem na hora (cartão da quadra com o raio escolhido, letra aplicada no bloco); o rascunho nunca altera a lojinha publicada: só "Salvar aparência" publica.

- **Preços & disponibilidade (G04):** três blocos que salvam em separado (regras de reserva, preços por horário e bloqueios recorrentes), cada um com o seu botão: não se juntam num só, porque gravam em endereços diferentes e um erro num não pode derrubar o outro. Cada bloco mostra o selo **"Alterações não salvas"** (ícone + texto, âmbar) enquanto estiver diferente do que está salvo; o botão só fica ativo com algo a salvar e, ao salvar, mostra "Salvando… / Salvo". Uma faixa no topo diz o que falta salvar, com links para cada bloco. **"Gerar horários" não salva:** depois de gerar, um aviso diz quantos horários foram gerados, que substituíram os dos dias escolhidos e que ainda não foram salvos. Salvar valida antes (preço maior que zero, fim depois do início) e diz qual linha corrigir. Com alterações pendentes, fechar a aba ou clicar em qualquer link interno pede confirmação (`useUnsavedChangesGuard`); o botão "voltar" do navegador e o Ctrl+K não são cobertos.

### Configurar (padrões)
- **Linhas editáveis** (`SettingRow`): rótulo e valor à esquerda, "Editar" à direita; ao editar abre o campo ali mesmo, "Salvar" grava na hora e Esc cancela. Frase de ajuda embaixo do campo; erro em texto, nunca só em cor.
- **Salvamento** (`useSaveStatus` + `SaveStatus`): "Salvando… / Salvo / Não foi possível salvar" com ícone e texto, anunciado a leitores de tela. O que muda com um clique (comodidades, capa) salva sozinho; formulários de criar têm "Salvar" e "Cancelar".
- **Opções em chips** (`ChipToggle`): campo real escondido, anel de foco no chip e ícone de check quando marcado (azul = selecionado).
- **Copiar** (`CopyButton`): o ícone vira check, o texto vira "Copiado", com cópia alternativa e aviso de falha.
- **Preço simples** (`SimplePricing`): dia, noite e fim de semana em poucos campos, aplicado a várias quadras; sempre com confirmação dizendo o que será substituído.
- **Menu de seções** à esquerda (Arena, Lojinha pública, Aparência, Preços, Metas, Equipe, Cupons, Equipamentos) e, na lojinha, prévia ao lado do formulário.

## Forma e elevação

Cantos grandes e sombras suaves e difusas (`--shadow-soft-sm`, `--shadow-soft`, `--shadow-soft-lg`). Sem borda
dura. Sombra serve para separar camadas, não para enfeitar.

## Componentes

- **Botão principal (`.btn--primary`, `.landing__button--primary`):** pílula lima com texto navy, 15 a 16px, peso 600.
  Hover sobe 1 a 2px; pressionado afunda. Apenas **um** por seção.
- **Botão secundário (ghost):** contorno, sem preenchimento forte; sobre azul usa branco com 75% de opacidade no contorno.
- **Card (`.card`):** superfície branca, raio 20, sombra suave. Na landing, cards de destaque usam raio 28.
- **Pílulas de status (`.pill--*`):** significado fixo: positivo = ativo/confirmado; neutro = inativo (escolha, não erro);
  negativo = alerta real; aviso = atenção; info = categoria ou resposta.
- **Azulejo de ícone (`.landing__feature-icon`):** quadrado navy com linhas de quadra e traço lima. Os ícones de
  esporte têm o **traço lima fixo no código**: sobre fundo claro ou lima eles somem, então vão sempre num círculo ou azulejo navy.
- **Campos (`.field`, `.input`):** com rótulo ligado ao campo. Controles deslizantes têm nome acessível e frase completa para leitor de tela.
- **Foco do teclado:** anel em duas camadas (branco colado no elemento + navy por fora), visível em qualquer fundo.

## Movimento

Regra geral: **movimento só quando mostra algo ou responde a uma ação.** Só `transform`, `opacity` e
`stroke-dashoffset`; nunca animar layout. Tudo respeita `prefers-reduced-motion` (parado, e nada fica escondido).

Inventário atual da landing (a revisão externa recomendou, no máximo, 2 efeitos de destaque por página; hoje
estamos acima disso, então **não acrescentar nada novo sem tirar algo**):

| Efeito | Onde | Tipo |
|---|---|---|
| Seta que se traça | hero, ao carregar | uma vez |
| Parallax das telas | hero, na rolagem | scroll timeline (CSS) |
| Selo "Reserva feita pelo link" | hero | loop de 2 voltas, pausa com mouse |
| Faixa de modalidades | entre hero e passos | loop contínuo (pausa no hover) |
| Linha tracejada dos passos | Como funciona | scroll timeline |
| Horários, barras e pulso | bento | entra uma vez / pulso contínuo |
| Cascata de itens | comparação | uma vez |
| Contagem dos números | calculadora | ao entrar na tela e a cada ajuste |
| Linhas de quadra se traçando | chamada final | scroll timeline |

Preferir `animation-timeline: view()` dentro de `@supports`, para que navegadores sem suporte mostrem o estado final.

## Acessibilidade (piso mínimo)

- Contraste AA em todo texto que se lê.
- Foco visível em tudo que se clica; Enter e Espaço funcionam; ordem de Tab lógica; link "pular para o conteúdo"; um `<main>`; um único `<h1>`.
- Imagem com `alt`; decoração com `aria-hidden`.
- Alvo de toque de pelo menos 40px (ideal 44px) no celular.
- Número animado fora do leitor de tela; o leitor recebe só o valor final.

## Faça e não faça

**Faça**
- Use `var(--token)` para qualquer cor, raio e sombra. Se faltar um token, crie em `tokens.css`.
- Mantenha a lima como ação principal e o azul como seleção e link.
- Mostre o produto real (telas verdadeiras do painel, com a legenda "dados de demonstração").
- Escreva em português do Brasil, em tom direto, com verbo de ação nos botões ("Criar conta grátis").
- Teste em 375, 768 e 1280px e com o teclado antes de publicar.

**Não faça**
- Cor hex fora de `tokens.css` (o `npm run lint` falha).
- Lima como texto sobre branco, ou ícone de esporte sobre fundo claro sem o círculo navy.
- Depoimento, número de clientes ou logo de arena que não seja real.
- Cinza mudo (`--color-text-muted`) em texto que precisa ser lido.
- Animar largura, altura, margem ou blur grande; mais de um botão lima na mesma seção.
- Misturar a família de marca com a semântica (usar verde de "positivo" como cor de marca, por exemplo).
- Chamar a marca de "Jogaê Sports".

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| Tokens (fonte única) | `apps/frontend/src/styles/tokens.css` |
| Botões, campos, cards, pílulas | `apps/frontend/src/styles/primitives.css` |
| Entradas por rolagem | `apps/frontend/src/styles/scroll-reveal.css` |
| Temas por lojinha e modo escuro | `apps/frontend/src/lib/theme.ts` (cores derivadas no backend) |
| Landing | `apps/frontend/src/pages/LandingPage.tsx` e `components/landing/*` |
| Regra de lint de cor | `apps/frontend/scripts/check-no-hex.mjs` |
