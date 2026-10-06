const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** R$ 4.570,00 — com separador de milhar. */
export function formatCurrency(value: number): string {
  return BRL.format(value)
}
