# Plano do redesign da gestão do Jogaê

Escrito em 2026-10-11 a partir das referências do dono (`docs/referencias-shadcn/` e `docs/referencias-kinetics/`), do `DESIGN.md`
e do que o painel faz hoje. Nada aqui foi implementado além do tema escuro e da Visão geral (commit `6fe77ba`).

## 1. O que o dono pediu
- Mais **clean, mais escuro** (azul do Jogaê), no estilo do shadcn/ui, **sem cara de genérico**: tem que parecer Jogaê.
- Menos informação por tela, menos desorganização, **padronização** entre as telas.
- **Configurar** tem que ser direto e fácil: hoje o gestor acha difícil cadastrar e alterar.
- Mapa do estabelecimento para o cliente (lojinha). Chatbot com bolhas. Visão do dono do Jogaê no futuro.

## 2. Estrutura: de 10 itens para 5 áreas
| Grupo | Área | O que reúne hoje |
|---|---|---|
| Operação | **Hoje** | Visão geral + Agenda (a "grade do dia": quadras em linhas, horários em blocos, linha de "agora") |
| Operação | **Quadras** | Quadras, com preços, fila de espera e manutenção dentro de cada uma |
| Operação | **Clientes** | Lista de clientes + Avaliações |
| Gestão | **Financeiro** | Relatórios + Cupons + Equipamentos mais usados |
| Gestão | **Configurar** | Arena, lojinha pública, aparência, equipe, equipamentos, cupons, metas |

A funcionário (permissão limitada) vê só Hoje e Quadras. Os itens da barra lateral têm selo com contador (reservas de hoje, avaliações sem resposta).

## 3. Telas
- **Hoje:** KPIs em uma faixa, grade do dia com linha de agora, próximas reservas, "pra ficar de olho". Botão lima "Nova reserva".
- **Quadras:** cartões das quadras com a situação de hoje; dentro de cada uma, abas Agenda, Preços, Fila e Manutenção.
- **Clientes:** tabela com avatar (iniciais), etiquetas (aniversário, inativo, faltas), filtro em segmentos, busca e paginação.
- **Financeiro:** gráfico de área do faturamento por dia, ranking de quadras em barras horizontais, comparação com o período anterior em barras agrupadas, tabela com total.
- **Configurar:** passo a passo no topo ("3 de 4"), menu de seções à esquerda, cada ajuste em uma **linha com "Editar"** que salva na hora (indicador "Salvando… / Salvo / Não foi possível salvar"), formulários curtos para criar coisas novas, prévia ao vivo da lojinha.
- **Transversais:** busca e ações rápidas (Ctrl+K), avisos (toast) no canto inferior direito, atalho Ctrl+B para recolher o menu.

### Configurar, para ficar fácil
1. **Preço simples primeiro:** três campos (dia, noite, fim de semana) com "aplicar a todas as quadras"; a grade por dia e hora fica atrás de "Personalizar".
2. **Valores já preenchidos** por padrão, endereço automático pelo CEP, textos de ajuda embaixo do campo.
3. **Sem botão "Salvar" geral** nas linhas: cada mudança salva sozinha, com retorno claro. Formulários de criação têm "Salvar" e "Cancelar".
4. **Português simples**, sem termo técnico; estado vazio sempre diz o que fazer.

## 4. Kit de componentes (referência → Jogaê)
Tudo em CSS do projeto e tokens do `DESIGN.md`; nada de cor fixa.
| Componente | Vem de | Usado em |
|---|---|---|
| Casca (barra lateral `inset`, recolhe para ícones, gaveta no celular) | shadcn Sidebar | todas |
| Cartão de indicador, cartão, `PageHeader` | shadcn dashboard | Hoje, Financeiro |
| Tabela + rodapé de total + paginação | shadcn Table, Pagination | Clientes, Financeiro |
| Filtro em segmentos com pílula deslizante | Kinetics | Hoje/Semana, períodos, filtros |
| Formulário (bloco com título e frase, rótulo, ajuda) | shadcn Field | Configurar, nova quadra, cupom |
| Interruptor, chip selecionável, contador | shadcn Switch, Kinetics | Configurar, Cupons, reserva |
| Botão de copiar com retorno | Kinetics | link da lojinha, cupom |
| Indicador de estado, spinner, esqueleto | Kinetics, shadcn Spinner | salvamento, botões, carregamento |
| Aviso (toast) com mola suave | Kinetics | avisos |
| Avatar (iniciais, selo de status) | shadcn Avatar | Clientes, Equipe, menu |
| Gráficos (área, barras) em SVG, sem biblioteca | shadcn Charts | Financeiro, Hoje |
| Busca e ações (Ctrl+K) | shadcn Command (biblioteca `cmdk`) | global |
| Bolhas de chat | shadcn Bubble, Message | chatbot da lojinha |
| Barra de rolagem fina | shadcn Scroll Area (só CSS) | painel inteiro |
| Medidor de senha / progresso em 4 passos | Kinetics | senha, passo a passo |

## 5. Mudanças no backend (todas pequenas)
1. **Senha:** mínimo de 8 caracteres e recusar senhas óbvias (hoje só exige 6) em criar conta, redefinir e cadastrar funcionário.
2. **Clientes:** paginação, busca e filtro no servidor (hoje a API devolve tudo).
3. **Horários de pico / reservas por dia da semana** (soma nova) para o gráfico de barras.
4. **"Novas desde a última visita":** guardar a última visita e contar reservas criadas depois.
5. **Mapa:** latitude e longitude do estabelecimento (colunas novas + migração).
6. **Bugs de texto** já vistos: "Há -12 dias" (reserva futura), "1 reservas", "Domingo, 11 De Outubro", gráfico de uma barra gigante.
7. Opcional: duas séries no financeiro (concluídas e previstas).

## 6. Dependências
- **Nenhuma obrigatória.** O visual sai do CSS próprio.
- **Opcionais, com OK do dono:** `cmdk` (busca Ctrl+K, MIT, pequena) e `maplibre-gl` (mapa; só na lojinha, carregado sob demanda).
- **Migração para Tailwind + shadcn:** adiada pelo dono. Plano de reserva: rota nova `/gestao`, carregada sob demanda, mantendo `/painel` até ficar pronta.

## 7. Entregas (cada uma publicada para o dono ver)
1. **Casca + Hoje:** barra lateral nova, grade do dia, indicadores, kit base, avisos e indicador de salvamento.
2. **Configurar:** passo a passo, linhas editáveis, formulários, interruptor, chips, copiar, preço simples, prévia da lojinha.
3. **Clientes e Quadras:** tabela, paginação, avatar, busca Ctrl+K.
4. **Financeiro:** gráficos e comparações.
5. **Acabamento:** movimento, acessibilidade, celular, textos, endurecer senha.
6. **Mapa do estabelecimento** na lojinha.
7. **Chatbot com bolhas.** Depois, no futuro: suporte gestor-Jogaê e a visão do dono do Jogaê (dependem da cobrança).

## 8. Como cada entrega é conferida
Ambiente de teste com histórico fictício; screenshots em 375, 768 e 1440 px; auditoria automática (rolagem horizontal, contraste, rótulos, foco do teclado, movimento reduzido); testes do projeto; `DESIGN.md` atualizado; CHANGELOG. Commit, deploy e push só quando o dono pedir.

## 9. Mapa do estabelecimento (decisões antes de começar)
- O `mapcn-rn.dev` é para app de celular (Expo/React Native). Para o site o certo é o **`mapcn.dev`** (React + MapLibre).
- O mapa precisa das **coordenadas**: o CEP só dá o endereço. Melhor o gestor **posicionar o pino** no Configurar, sem serviço de geocodificação.
- **Peso:** o MapLibre é grande; carregar só na página da lojinha, sob demanda. Alternativa leve: botão "Como chegar" abrindo o Google Maps.
- **Termos do fornecedor das imagens do mapa** (CARTO/OpenStreetMap): conferir uso comercial e atribuição antes de publicar.
- **LGPD:** carregar o mapa expõe o IP do visitante ao fornecedor; atualizar a Política de Privacidade.

## 10. Pendências de decisão do dono
Ver a lista no fim da conversa de 2026-10-11 (menu recolhido ou aberto, contadores no menu, gráfico principal, migração, senha mínima de 8, `cmdk`, mapa).
