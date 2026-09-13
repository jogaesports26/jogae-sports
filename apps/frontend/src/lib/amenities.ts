export const AMENITY_OPTIONS = [
  { value: 'vestiario', label: 'Vestiário' },
  { value: 'estacionamento', label: 'Estacionamento' },
  { value: 'lanchonete', label: 'Lanchonete' },
  { value: 'chuveiro', label: 'Chuveiro' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'ar_condicionado', label: 'Ar-condicionado' },
  { value: 'bar', label: 'Bar' },
  { value: 'churrasqueira', label: 'Churrasqueira' },
]

export function amenityLabel(value: string): string {
  return AMENITY_OPTIONS.find((option) => option.value === value)?.label ?? value
}
