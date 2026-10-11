# Referência: Sidebar (shadcn/ui, MIT) — enviada pelo dono em 2026-10-11

Resumo da documentação oficial (o dono colou o texto duas vezes). É a "casca" da gestão nova. Não é código do projeto.
O dono também mandou um print do bloco com a barra lateral e o conteúdo num painel arredondado (variante `inset`).

## Composição
```
SidebarProvider                      estado aberto/fechado + contexto
├── Sidebar  (side, variant, collapsible)
│   ├── SidebarHeader                fixo no topo: marca, título, seletor de espaço de trabalho
│   ├── SidebarContent               região rolável
│   │   └── SidebarGroup             SidebarGroupLabel · SidebarGroupAction · SidebarGroupContent
│   │       └── SidebarMenu > SidebarMenuItem
│   │            ├── SidebarMenuButton (isActive)   ├── SidebarMenuAction   ├── SidebarMenuBadge
│   │            └── SidebarMenuSub > SidebarMenuSubItem > SidebarMenuSubButton
│   ├── SidebarFooter                fixo embaixo: menu do usuário, configurações
│   └── SidebarRail                  alça fina para abrir/fechar
├── SidebarInset                     envolve o conteúdo na variante `inset`
└── SidebarTrigger                   botão que abre/fecha
```

## Comportamentos
- `collapsible`: `offcanvas` (desliza para fora), `icon` (encolhe para só ícones) ou `none`.
- `variant`: `sidebar` (colada), `floating` (flutuante) ou `inset` (o conteúdo vira um painel arredondado dentro da página).
- Atalho de teclado: Ctrl+B (Windows) ou Cmd+B (Mac).
- No celular vira uma gaveta (Sheet) que abre por cima; `useSidebar()` dá `state`, `open`, `isMobile`, `toggleSidebar`.
- Grupo recolhível (Collapsible) com seta que gira; selo (badge) com contador por item; submenu; esqueleto de carregamento.
- Largura: `--sidebar-width` (16rem) e `--sidebar-width-mobile` (18rem).
- Tema por variáveis: `--sidebar-background`, `-foreground`, `-primary`, `-primary-foreground`, `-accent`, `-accent-foreground`, `-border`, `-ring`.
- Estados por atributo: `group-data-[collapsible=icon]:hidden`, `peer-data-[active=true]/menu-button:opacity-100`.
- Header de exemplo: seletor de espaço de trabalho (DropdownMenu com "Select Workspace"); footer de exemplo: usuário.
- Dependências do original: Radix (Sheet, Tooltip, Collapsible, DropdownMenu), class-variance-authority, lucide-react e Tailwind.
