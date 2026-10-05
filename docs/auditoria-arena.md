# Auditoria de UX/Design — Reserva Jogaê Sports (Arena Vitória)

Sep 25, 2026 · @Raziel

A base do fluxo funciona: dá pra escolher quadra, dia, duração e horário, pagar (OTP por telefone), receber comprovante com QR code e ver o histórico em "Minhas reservas". O modelo de preço variável por horário está implementado de verdade — a Quadra 2 custa R$ 100/h às 08h e R$ 130/h às 19h, por exemplo. Essa fundação está certa.

Mas hoje a tela parece um protótipo funcional, não uma "lojinha" que inspira o jogador a colocar o cartão. Três problemas pesam mais contra conversão e percepção premium:

1. **O widget de chat flutuante cobre o botão de reservar/confirmar em quase toda tela no celular**, inclusive a barra fixa com preço e "Reservar agora" — fricção direta bem na etapa que gera receita.
2. **Cancelar uma reserva paga acontece com um único clique, sem nenhuma confirmação** ("tem certeza?") e sem política de cancelamento visível em nenhum ponto do fluxo — risco para o negócio e insegurança para o jogador.
3. **"Minhas reservas" não é responsiva**: no celular, os 5 botões de ação (Convidar, Google Calendar, Comprovante, Reagendar, Cancelar) ficam espremidos numa coluna estreita ao lado do card, com texto quebrando de forma feia — bem diferente da tela de reserva em si, que é responsiva.

Fora isso, faltam elementos básicos de confiança: não há avaliação agregada do estabelecimento (só por quadra), não há política de cancelamento em lugar nenhum, não há telefone/horário de funcionamento/link de mapa, e a grade de horários (até 30 opções em lista simples) não indica visualmente quais horários custam mais — o jogador só descobre o preço depois de clicar.

Nenhum desses pontos exige refazer a arquitetura do produto. O ganho de conversão e de percepção "premium" vem mais de polimento visual e ajuste de componentes específicos do que de mudança de fluxo.

## Achados por etapa do funil

## Lojinha do estabelecimento (arena-vitoria)

**O que funciona:** hero com foto aérea da quadra, nome e endereço do local, chips de comodidades (Vestiário, Estacionamento, Lanchonete, Chuveiro, Wi-Fi, Ar-condicionado), filtro por tipo de quadra (Todas / Futebol Society / Futebol Fut7) e cards de quadra com nota, preço "a partir de" e CTA "Ver horários". No celular, o layout empilha corretamente em uma coluna — isso responde bem.

**O que falta ou incomoda:**

- **Sem prova social agregada**: a nota (★ 4.0) aparece por quadra, mas não existe uma avaliação geral do estabelecimento nem número total de reservas/jogos realizados — sinais que aumentam confiança antes mesmo de escolher a quadra.
- **Sem galeria de fotos real**: cada quadra tem uma única imagem. Quadra 1 usa uma foto aérea realista de alta qualidade; Quadra 2 usa uma ilustração escura estilizada, bem diferente em estilo e qualidade percebida da primeira — essa inconsistência visual entre as duas quadras passa impressão amadora/inacabada.
- **Sem informação prática básica**: nenhum telefone de contato, horário de funcionamento do estabelecimento ou link para mapa/rota. Só o endereço em texto.
- **Seção "Sobre" muito curta** (uma frase genérica) e sem política de cancelamento, regras de uso ou diferenciais do local.
- **Widget de chat flutuante** já aparece sobrepondo o canto inferior direito nesta tela também, cobrindo parcialmente o último card quando a página termina de rolar.

## Escolha de quadra, dia, duração e horário

**O que funciona bem:**

- Tela responsiva de verdade no celular: dias em pills horizontais, duração em pills que quebram linha, grade de horários em 2 colunas.
- O preço realmente muda com o horário (confirmado: mesma quadra custa R$ 100,00 às 08h e R$ 130,00 às 19h), provando que o motor de precificação por horário do produto está funcionando.
- Após escolher um horário, uma **barra fixa (sticky) no rodapé** mostra dia, horário, preço e o botão "Reservar agora" — ótimo padrão, mantém o resumo visível enquanto o usuário rola a página.
- Horários ocupados aparecem visualmente diferentes (cinza, só com a hora de início) e têm um botão **"Avise-me"** que abre um mini-formulário de fila de espera (nome + telefone) — funcionalidade presente e fácil de entender.

**O que atrapalha:**

- **Nenhuma indicação visual de preço na grade de horários.** Todos os slots têm a mesma cor azul, sejam eles R$ 80/h ou R$ 130/h — o jogador só descobre o valor depois de clicar em cada um. Para um modelo de negócio construído em cima de preço variável por horário, isso esconde justamente a informação mais relevante para a decisão de compra.
- **Grade de horários muito longa e sem agrupamento**: com intervalos de 30 min das 08h às 23h, são até 30 pills idênticas em sequência, sem separação por Manhã/Tarde/Noite. Um jogador que só joga à noite precisa rolar a tela inteira.
- **Widget de chat flutuante sobrepõe a barra fixa de reserva**: o botão "Reservar agora" e o preço na barra inferior ficam parcialmente cobertos pelo balão verde de chat no canto inferior direito — no celular isso chega a esconder metade do texto do botão principal da tela.
- **Uma das quadras (Quadra 1 - Society) não teve nenhum horário disponível em nenhum dos 7 dias testados**, sempre com a mensagem genérica "Sem horários disponíveis nesse dia". Pode ser só dado de teste, mas do ponto de vista de UX a mensagem não diferencia "esgotado" de "esta quadra ainda não tem horário configurado", o que deixaria o estabelecimento avisado de um problema de configuração antes de perder uma reserva.
- **Bug de estado vazio inconsistente**: ao trocar a duração para 2h30min em um dia sem disponibilidade, a seção "Horários" fica completamente em branco (nem horários, nem a mensagem "Sem horários disponíveis"), diferente do que acontece com a duração padrão de 1h.

## Checkout: login por telefone, cupom, equipamento, resumo

Tudo acontece em **um único modal**, sem navegar para uma página separada — boa escolha para reduzir fricção. A sequência testada: escolher horário → modal com cupom + aluguel de equipamento + telefone → enviar código → digitar OTP → confirmar.

**Pontos positivos:**

- **Preço atualiza em tempo real** ao adicionar itens (bola oficial R$ 15, colete R$ 5, luva de goleiro R$ 10): o valor riscado (de/por) deixa claro o que mudou.
- **Cupom com validação clara**: ao aplicar um código inválido, aparece "Cupom não encontrado" em vermelho, sem travar o fluxo.
- **Usuário recorrente tem atalho**: depois do primeiro login, o modal reconhece o telefone salvo e pula direto para "Confirmar reserva com seus dados salvos?", sem pedir OTP de novo — ótimo para reduzir fricção em reservas futuras.

**Pontos de atenção:**

- **Campo de telefone sem máscara**: o placeholder mostra "(85) 99999-9999", mas ao digitar o número fica em texto corrido sem formatação ("11987654321"), o que passa impressão de campo mal validado, mesmo funcionando.
- **Nenhuma menção à política de cancelamento neste momento** — o ponto de decisão de pagamento é exatamente onde essa informação mais ajuda a reduzir ansiedade de compra, e ela não aparece em lugar nenhum do modal.
- **Resumo do pedido é só o total final**, sem discriminar "quadra R$ X + equipamento R$ Y = total R$ Z" linha a linha — funciona quando os itens são poucos, mas fica menos claro se o jogador aluga vários itens.
- **Duplo campo de identificação**: no fluxo de fila de espera ("Avise-me") o sistema pede nome e telefone de novo mesmo quando o jogador já está autenticado por OTP, sem pré-preencher — pequena inconsistência de personalização.

## Confirmação, comprovante e fila de espera

**Confirmação:** mensagem simples "Reserva confirmada! Você já pode fechar esta janela", com três ações úteis — Convidar pra jogar, Adicionar ao Google Calendar, Ver comprovante — além do botão Fechar. O conjunto de ações é bom, mas a tela em si é seca: sem ícone de sucesso, sem cor de destaque, sem número de reserva visível diretamente (fica implícito no QR code do comprovante). Para a tela que marca o momento em que o dinheiro efetivamente entrou, falta um pouco de celebração visual.

**Comprovante:** card limpo com nome da quadra, estabelecimento, data/horário, valor e QR code, mais botões Compartilhar e Imprimir. Funcional, mas sem número/código de reserva legível por humano (útil se o jogador precisar informar por telefone na portaria) e sem link para a política de cancelamento.

**Fila de espera ("Avise-me"):** aparece em horários já ocupados, com texto claro — "Esse horário está ocupado. Deixe seu nome e telefone pra gente avisar se ele abrir" — e formulário simples de duas perguntas. Funciona bem e é fácil de achar (aparece ao lado do próprio horário ocupado, sem precisar procurar em outro lugar).

## Minhas reservas (pós-compra)

No desktop a tela funciona: card por reserva, com status ("Confirmada"/"Cancelada") e ações à direita (Convidar pra jogar, Google Calendar, Comprovante, Reagendar, Cancelar).

**No celular, porém, é a pior tela do fluxo inteiro.** O layout não reflui para uma coluna: o card mantém a estrutura de duas colunas do desktop espremida em \~390px, empurrando as 5 pills de ação para uma faixa estreita à direita, onde "Convidar pra jogar" e "Google Calendar" quebram em duas linhas cada. O resultado é visualmente quebrado — destoa muito da tela de reserva de quadra, que é responsiva de verdade. Isso é o oposto do que se espera: a tela de pós-compra é onde o jogador volta repetidas vezes (ver comprovante, cancelar, reagendar), quase sempre pelo celular.

**Cancelamento sem confirmação — o achado mais importante desta seção:** cliquei em "Cancelar" em uma reserva confirmada e paga, e ela foi cancelada **imediatamente**, sem nenhum diálogo de "tem certeza?", sem exigir digitar algo, sem explicar se há reembolso ou multa. Só um toast discreto "Reserva cancelada." No celular, onde toques acidentais são mais comuns, isso é um risco real de cancelamento não intencional de uma reserva paga — tanto para o jogador quanto para o estabelecimento, que perde a receita e o horário sem aviso prévio real.

O cabeçalho também mostra o telefone do jogador sem formatação ("11987654321") como indicador de "logado", em vez de um nome ou avatar — reforça a sensação de ambiente de teste/admin em vez de produto voltado ao consumidor final.

## Pontos de fricção específicos

| Severidade | Onde | Fricção |
| --- | --- | --- |
| Crítica | Reserva de horário (mobile) | Widget de chat flutuante cobre parcialmente o botão "Reservar agora" e o preço na barra fixa — pode até interceptar o toque destinado ao botão |
| Crítica | Minhas reservas | Cancelamento de reserva paga em um clique, sem confirmação e sem explicar política/reembolso |
| Alta | Minhas reservas (mobile) | Layout de duas colunas do desktop não reflui: botões de ação quebram texto e ficam ilegíveis |
| Alta | Grade de horários | Nenhuma pista visual de preço por slot — usuário precisa clicar em cada horário para descobrir o valor |
| Média | Toda a jornada | Política de cancelamento nunca é mostrada (nem no checkout, nem no comprovante, nem em "Minhas reservas") |
| Média | Lojinha | Sem prova social agregada do estabelecimento (só nota por quadra) nem galeria de fotos consistente |
| Média | Grade de horários | Lista longa e uniforme de até 30 slots, sem agrupamento por período do dia |
| Baixa | Checkout | Campo de telefone sem máscara de formatação |
| Baixa | Grade de horários | Estado vazio inconsistente: some a mensagem "Sem horários disponíveis" dependendo da duração selecionada |
| Baixa | Confirmação/Comprovante | Tela de sucesso pouco celebrativa; sem número de reserva legível |
| Baixa | Identidade visual | Duas cores de destaque competindo (azul nas seleções de dia/horário, verde-limão nos botões de confirmação e no chat) |

## Recomendações priorizadas

### Ganhos rápidos (ajuste de componente, sem mudar fluxo)

- Reposicionar ou encolher o widget de chat no mobile (ou escondê-lo/minimizá-lo quando a barra fixa de reserva estiver visível) para nunca sobrepor botões de ação.
- Adicionar um diálogo de confirmação ("Cancelar reserva de R$ X em \[data/horário\]? Essa ação não pode ser desfeita") antes de cancelar, com a política de cancelamento/reembolso resumida ali mesmo.
- Aplicar máscara de telefone no campo de OTP e no formulário de fila de espera.
- Corrigir o estado vazio da grade de horários para sempre mostrar uma mensagem, independente da duração selecionada.
- Mostrar o preço (ou pelo menos uma tag "a partir de R$ X") dentro de cada pill de horário, em vez de só depois do clique — mesmo um degradê simples (horário mais barato x mais caro) já ajuda a leitura.
- Trocar o telefone cru no cabeçalho ("11987654321") por telefone formatado ou, melhor, nome do jogador quando disponível.
- Unificar a cor de destaque (escolher entre o azul e o verde-limão como única cor primária de ação) para reforçar identidade de marca.

### Mudanças estruturais de fluxo/layout

- **Refazer "Minhas reservas" como componente mobile-first**: cada reserva devia ser um card empilhado verticalmente (informações no topo, ações primárias em botões de largura total ou um menu "⋮" para as secundárias) em vez de um layout de duas colunas encolhido.
- **Agrupar a grade de horários por período do dia** (Manhã / Tarde / Noite) com âncoras/abas, reduzindo a rolagem e deixando mais rápido achar horário de pico (que é onde o preço — e a receita — é maior).
- **Adicionar uma seção fixa de confiança na lojinha**: avaliação agregada do estabelecimento, número de reservas/jogos, política de cancelamento resumida e link de mapa/telefone — hoje essas informações simplesmente não existem em nenhuma tela do funil.
- **Padronizar a qualidade/estilo das fotos de quadra** (todas fotos aéreas reais, mesmo tratamento de cor) para elevar a percepção de marca cuidada.
- **Enriquecer a tela de confirmação** com um número de reserva visível, indicação clara de sucesso (ícone/cor) e um resumo discriminado do que foi pago (quadra + equipamentos + taxas, se houver).

Em conjunto, os "ganhos rápidos" resolvem os riscos mais graves (cancelamento acidental, botão de compra escondido) e podem sair antes; as mudanças estruturais são o que separa "funciona" de "parece premium" e valem uma rodada de referencias visuais, como você mencionou que vai trazer depois.
