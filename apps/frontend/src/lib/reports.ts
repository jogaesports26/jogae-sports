import { authFetch, parseApiError } from './api'

export interface CourtRevenue {
  courtId: string
  courtName: string
  revenue: number
  reservationsCount: number
}

export interface DailyRevenue {
  date: string
  revenue: number
}

export interface FinancialReport {
  from: string
  to: string
  totalRevenue: number
  reservationsCount: number
  occupancyRate: number
  courts: CourtRevenue[]
  dailyRevenue: DailyRevenue[]
}

export interface ReportFilters {
  from: string
  to: string
  courtId?: string
}

export interface TopCoupon {
  couponId: string
  code: string
  usageCount: number
  totalDiscount: number
}

export interface TopEquipment {
  equipmentId: string
  name: string
  quantityRented: number
  revenue: number
}

export interface CommercialReport {
  from: string
  to: string
  topCoupons: TopCoupon[]
  topEquipment: TopEquipment[]
}

function buildQuery(filters: ReportFilters): string {
  const params = new URLSearchParams({ from: filters.from, to: filters.to })
  if (filters.courtId) params.set('courtId', filters.courtId)
  return params.toString()
}

export async function fetchReports(filters: ReportFilters): Promise<FinancialReport> {
  const response = await authFetch(`/reservations/reports?${buildQuery(filters)}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar os relatórios'))
  }
  return response.json()
}

export async function fetchCommercialReport(filters: ReportFilters): Promise<CommercialReport> {
  const response = await authFetch(`/reservations/reports/commercial?${buildQuery(filters)}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível carregar o relatório comercial'))
  }
  return response.json()
}

export async function downloadReportsCsv(filters: ReportFilters): Promise<void> {
  const response = await authFetch(`/reservations/reports/export?${buildQuery(filters)}`)
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Não foi possível exportar o relatório'))
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-${filters.from}-a-${filters.to}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
