import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCustomers } from '../../lib/customers'
import type { Customer } from '../../lib/customers'
import './CommandPalette.css'

interface PaletteItem {
  id: string
  label: string
  hint?: string
  to: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  /** Telas que o usuário pode abrir (já filtradas pelo papel). */
  destinations: { label: string; to: string }[]
  canSearchCustomers: boolean
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function CommandPalette({ open, onClose, destinations, canSearchCustomers }: CommandPaletteProps) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      inputRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Busca de clientes só depois de digitar (evita carregar a lista toda ao abrir).
  useEffect(() => {
    const term = query.trim()
    if (!open || !canSearchCustomers || term.length < 2) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      fetchCustomers({ q: term, porPagina: 5 })
        .then((result) => !cancelled && setCustomers(result.items))
        .catch(() => !cancelled && setCustomers([]))
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, open, canSearchCustomers])

  const items = useMemo<PaletteItem[]>(() => {
    const term = normalize(query.trim())
    const screens = destinations
      .filter((d) => !term || normalize(d.label).includes(term))
      .map((d) => ({ id: `d-${d.to}`, label: d.label, hint: 'Ir para', to: d.to }))
    const people =
      term.length >= 2
        ? customers.map((c) => ({
            id: `c-${c.phone}`,
            label: c.name,
            hint: c.phone,
            to: `/painel/clientes?busca=${encodeURIComponent(c.phone)}`,
          }))
        : []
    return [...screens, ...people]
  }, [query, destinations, customers])

  function close() {
    setQuery('')
    setCustomers([])
    setActive(0)
    onClose()
  }

  function choose(item: PaletteItem | undefined) {
    if (!item) return
    close()
    navigate(item.to)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(items[active])
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      aria-label="Busca rápida"
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close()
      }}
    >
      <input
        ref={inputRef}
        className="palette__input"
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-list"
        aria-activedescendant={items[active] ? `palette-${active}` : undefined}
        aria-label="Buscar tela ou cliente"
        placeholder={canSearchCustomers ? 'Buscar tela ou cliente...' : 'Buscar tela...'}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
        }}
        onKeyDown={handleKeyDown}
      />
      <ul id="palette-list" role="listbox" className="palette__list">
        {items.length === 0 && <li className="palette__empty">Nada encontrado.</li>}
        {items.map((item, index) => (
          <li
            key={item.id}
            id={`palette-${index}`}
            role="option"
            aria-selected={index === active}
            className={`palette__item${index === active ? ' palette__item--active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(item)}
          >
            <span>{item.label}</span>
            {item.hint && <small>{item.hint}</small>}
          </li>
        ))}
      </ul>
    </dialog>
  )
}
