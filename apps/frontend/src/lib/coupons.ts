import { API_URL, authFetch, parseApiError } from './api'

export type CouponDiscountType = 'PERCENT' | 'FIXED'

export interface Coupon {
  id: string
  ownerId: string
  code: string
  discountType: CouponDiscountType
  discountValue: number
  validFrom: string | null
  validUntil: string | null
  usageLimit: number | null
  usageCount: number
  active: boolean
  createdAt: string
}

export interface CreateCouponInput {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  validFrom?: string
  validUntil?: string
  usageLimit?: number
}

export interface UpdateCouponInput {
  active?: boolean
  validUntil?: string
  usageLimit?: number
}

export interface CouponPreview {
  valid: boolean
  code: string
  discountType: CouponDiscountType
  discountValue: number
}

function normalizeCoupon(coupon: Coupon): Coupon {
  return { ...coupon, discountValue: Number(coupon.discountValue) }
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const response = await authFetch('/coupons')
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os cupons'))
  }
  const coupons: Coupon[] = await response.json()
  return coupons.map(normalizeCoupon)
}

export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  const response = await authFetch('/coupons', { method: 'POST', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível criar o cupom'))
  }
  return normalizeCoupon(await response.json())
}

export async function updateCoupon(id: string, input: UpdateCouponInput): Promise<Coupon> {
  const response = await authFetch(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível salvar o cupom'))
  }
  return normalizeCoupon(await response.json())
}

export async function removeCoupon(id: string): Promise<void> {
  const response = await authFetch(`/coupons/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível remover o cupom'))
  }
}

export async function validateCouponForCourt(courtId: string, code: string): Promise<CouponPreview> {
  const response = await fetch(`${API_URL}/public/courts/${courtId}/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Cupom inválido'))
  }
  const preview: CouponPreview = await response.json()
  return { ...preview, discountValue: Number(preview.discountValue) }
}
