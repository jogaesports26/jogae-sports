/** Dias sem reservar para o cliente contar como inativo (o frontend usa o mesmo número). */
export const INACTIVE_THRESHOLD_DAYS = 30;
/** Faltas a partir das quais o cliente aparece em "Faltas recorrentes". */
export const NO_SHOW_ALERT_THRESHOLD = 2;

export const CUSTOMER_FILTERS = [
  'all',
  'inactive',
  'birthdays',
  'noShows',
] as const;
export type CustomerFilter = (typeof CUSTOMER_FILTERS)[number];

export const DEFAULT_PAGE_SIZE = 20;
