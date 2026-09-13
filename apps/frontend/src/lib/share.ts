export type ShareResult = 'shared' | 'copied' | 'failed'

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback pra navegadores sem Clipboard API (ou sem permissão) — textarea invisível + execCommand.
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }
    document.body.removeChild(textarea)
    return copied
  }
}

/** Usa a Web Share API quando disponível (principalmente mobile); senão copia o texto+link pra área de transferência. */
export async function shareOrCopy(data: { title: string; text: string; url: string }): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'failed'
      // cai pro fallback de copiar se o share nativo falhar por outro motivo
    }
  }

  const copied = await copyToClipboard(`${data.text}\n${data.url}`)
  return copied ? 'copied' : 'failed'
}
