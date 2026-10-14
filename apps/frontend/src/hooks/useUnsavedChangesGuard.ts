import { useEffect } from 'react'

export const UNSAVED_MESSAGE = 'Você tem alterações que ainda não foram salvas. Sair desta tela mesmo assim?'

/**
 * Enquanto `dirty` for verdadeiro, avisa antes de a pessoa perder o que digitou:
 * fechar ou recarregar a aba (aviso do navegador) e clicar em qualquer link interno (menu, abas, "voltar").
 * Não cobre o botão "voltar" do navegador nem a busca Ctrl+K: a rota única do app não tem bloqueio de navegação.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      const samePlace = url.pathname === window.location.pathname && url.search === window.location.search
      if (samePlace) return
      if (!window.confirm(UNSAVED_MESSAGE)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    // Captura no documento: roda antes do React Router, então cancelar aqui impede a troca de tela.
    document.addEventListener('click', handleClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [dirty])
}
