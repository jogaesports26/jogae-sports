# Prompt: melhorias de design pra landing page do Jogaê Sports

## Contexto do produto

Jogaê Sports é um SaaS de gestão pra donos de quadras esportivas (modelo parecido com Anota AI / SAQES), ainda em fase de projeto de faculdade mas levado a sério como produto real. O público-alvo dessa landing page é o **dono do estabelecimento** (quadra de futebol, tênis, vôlei, etc.) que hoje organiza tudo por planilha/WhatsApp e está decidindo se vale a pena adotar um sistema. A landing precisa comunicar confiança, profissionalismo e ao mesmo tempo energia/esporte — não pode parecer só mais um SaaS corporativo genérico.

## Stack técnica (restrição importante)

- React 19 + Vite + TypeScript
- CSS puro (sem Tailwind, sem styled-components) — arquivos `.css` por página/componente
- Sem biblioteca de animação instalada ainda (pode sugerir Framer Motion, CSS puro, ou GSAP, mas diga explicitamente qual e por quê)
- Ícones são SVGs inline feitos à mão (não usamos ícone-font nem lib de ícones)
- Deploy: Vercel (frontend) + Render (backend NestJS) + Supabase (Postgres)

## Design system atual

```css
--color-primary: #1A237E     /* navy — headings, texto, backgrounds sólidos */
--color-background: #F5F5F5  /* cinza claro — fundos de seção */
--color-accent: #1E88E5      /* azul médio — links, destaques */
--color-white: #FFFFFF
--color-accent-green: #25D366 /* verde — usado nos ícones esportivos ilustrativos */
--color-accent-yellow: #FFC107 /* uso pontual em ilustrações */
```

- Headings: serif (Playfair Display), corpo: sans-serif (Inter)
- Cantos arredondados moderados (~12–20px), sem sombras pesadas
- Ícones esportivos flat/line-art em verde, usados como textura decorativa

## Estrutura atual da landing page (`/`)

1. **Nav fixa**: logo "Jogaê Sports" à esquerda, links (Funcionalidades / Entrar / Criar conta) à direita
2. **Hero**: fundo com gradiente navy→azul, headline serif grande ("Gestão completa para sua quadra esportiva"), subtítulo, dois botões (Criar conta grátis / Já tenho conta), ícones esportivos espalhados como textura de fundo (bola de futebol, basquete, vôlei, tênis, troféu, apito), e abaixo um mockup ilustrado (SVG) de laptop+celular mostrando um dashboard estilizado (kanban + gráfico)
3. **Seção de funcionalidades**: grid de 6 cards (ícone azul + título + descrição curta): Agenda online, Reservas em tempo real, Pagamentos integrados, Múltiplos esportes, Painel de gestão simples, Chatbot inteligente (em breve)
4. **Banner de CTA final**: fundo navy sólido, título + botão "Criar conta grátis"
5. **Footer**: simples, brand + copyright

Tudo isso já é responsivo (mobile/tablet/desktop) e funcional, mas é a primeira versão — sem animações, sem transições, sem scroll effects, sem prova social (depoimentos/números), sem seção de preço.

## O que eu quero que você proponha

Quero que você analise essa estrutura e sugira melhorias concretas pra deixar a página **mais interessante e persuasiva pro usuário**, cobrindo:

1. **Animações e micro-interações**: o que animar (entrada de seções no scroll, hover em cards, parallax nos ícones do hero, transição nos botões, etc.), com qual técnica (CSS puro vs. lib) e por quê, sem exagerar a ponto de prejudicar performance/acessibilidade (respeitar `prefers-reduced-motion`)
2. **Novos artefatos visuais**: sugestões de elementos que reforcem a credibilidade do produto — ex: seção de "como funciona" em 3 passos, mockup interativo, número de destaque (ex: "X quadras gerenciadas"), seção de depoimento/prova social (mesmo que fictícia por enquanto), comparação antes/depois (planilha vs. sistema)
3. **Copy e hierarquia**: se a headline/subtítulo atual comunica bem o valor, e se falta alguma seção de conteúdo (FAQ, preço, prova social) pra reduzir objeção de quem está decidindo se cadastra
4. **Composição visual do hero**: ideias pra deixar o mockup de dashboard e os ícones esportivos com mais vida (ex: mockup com leve flutuação, ícones com movimento sutil, algum micro-detalhe interativo ao passar o mouse)
5. **Prioridade**: no fim, me dê uma lista priorizada (top 5) do que trria mais impacto visual/conversão com menor esforço de implementação, considerando que é um time pequeno de faculdade implementando isso em React puro

Pode ser bem específico — inclusive sugerir trechos de CSS/animação, mas deixe claro quando algo depende de instalar uma lib nova.
