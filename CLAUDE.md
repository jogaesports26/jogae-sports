# Instruções para o Claude Code neste repositório

## Atribuição em commits e Pull Requests

**Não adicione nenhuma linha de atribuição ao Claude/Anthropic em commits ou PRs deste repositório.**

Isso inclui, especificamente:
- `Co-Authored-By: Claude ...` no final de mensagens de commit
- `🤖 Generated with [Claude Code](https://claude.com/claude-code)` no final de descrições de Pull Request
- Qualquer variação equivalente dessas linhas

Mensagens de commit e descrições de PR devem terminar no conteúdo normal (resumo, test plan etc.), sem nenhum rodapé de atribuição.

## Design

Toda interface nova (landing, painel, lojinha) segue o `DESIGN.md` na raiz deste repositório: identidade, papéis das cores, tipografia, regras de movimento e acessibilidade. Os valores vivem em `apps/frontend/src/styles/tokens.css` (único lugar com cor hex; o `npm run lint` falha se aparecer outra). Qualquer valor fora do `DESIGN.md` precisa de justificativa no commit. A marca se escreve **Jogaê**, sem "Sports".
