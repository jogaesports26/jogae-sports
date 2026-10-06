import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import themes from './fixtures/themes.json' with { type: 'json' }

/**
 * Gera as imagens da landing (public/landing/*.jpg) a partir das TELAS REAIS do produto,
 * alimentadas com dados de demonstração. Não roda no CI nem no `test:e2e` normal:
 *   CAPTURE=1 npx playwright test e2e/capture-landing.spec.ts
 * Rode de novo quando o painel ou a lojinha mudarem de cara.
 */
test.skip(!process.env.CAPTURE, 'só roda com CAPTURE=1')

const OUT = 'public/landing'
const SLUG = 'arena-vitoria'
const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=600&fit=crop&q=80`
const PHOTOS = [photo('1517747614396-d21a78b850e8'), photo('1556056504-5c7696c4c28d')]

const today = new Date()
const at = (hour: number, minutes = 0) => {
  const d = new Date(today)
  d.setHours(hour, minutes, 0, 0)
  return d.toISOString()
}

const courts = ['Quadra 1 - Society', 'Quadra 2 - Society', 'Quadra 3 - Futsal'].map((name, index) => ({
  id: `c${index + 1}`,
  ownerId: 'o1',
  name,
  sport: index === 2 ? 'FUTSAL' : 'SOCIETY',
  surfaceType: 'GRAMA_SINTETICA',
  hasLighting: true,
  photoUrls: [PHOTOS[index % 2]],
  active: true,
  minBookingMinutes: 60,
  maxBookingMinutes: 120,
  slotStepMinutes: 60,
  bookingStepMinutes: 60,
  createdAt: at(8),
  updatedAt: at(8),
  priceRules: [{ id: `r${index}`, courtId: `c${index + 1}`, dayOfWeek: 1, startMinute: 480, endMinute: 1380, pricePerHour: '120' }],
  recurringMaintenanceBlocks: [],
}))

const guests = ['Rafael Mendes', 'Bruno Alves', 'Thiago Costa', 'Lucas Prado', 'Diego Ramos', 'Felipe Nunes']
const todayReservations = [18, 19, 20, 20, 21, 22].map((hour, index) => ({
  id: `res${index}`,
  courtId: `c${(index % 3) + 1}`,
  guestName: guests[index],
  guestPhone: '11999990000',
  startsAt: at(hour),
  endsAt: at(hour + 1),
  status: 'CONFIRMED',
  priceSnapshot: index % 3 === 2 ? '100' : '120',
  cancelledAt: null,
  instructorId: null,
  instructor: null,
  couponId: null,
  discountAmount: null,
  equipmentItems: [],
  createdAt: at(8),
  updatedAt: at(8),
  court: { id: `c${(index % 3) + 1}`, name: courts[index % 3].name },
}))

const dailyRevenue = Array.from({ length: today.getDate() }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth(), i + 1)
  return { date: d.toISOString().slice(0, 10), revenue: 600 + ((i * 337) % 900) }
})
const monthReport = {
  from: '',
  to: '',
  totalRevenue: dailyRevenue.reduce((sum, d) => sum + d.revenue, 0),
  reservationsCount: 74,
  occupancyRate: 0.68,
  courts: courts.map((c, i) => ({ courtId: c.id, courtName: c.name, revenue: 4200 - i * 600, reservationsCount: 30 - i * 4 })),
  dailyRevenue,
}

const customers = Array.from({ length: 9 }, (_, i) => ({
  phone: `1199999000${i}`,
  name: guests[i % guests.length],
  playerId: null,
  birthDate: null,
  totalReservations: 4 + i,
  totalSpent: 480 + i * 60,
  noShowCount: 0,
  lastReservationAt: at(18),
  daysSinceLastReservation: i === 3 ? 41 : 6,
}))

async function mockPanel(page: Page) {
  await page.route('http://api.test/**', async (route) => {
    const url = new URL(route.request().url())
    const json = (body: unknown) => route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } })
    if (url.pathname === '/reservations/today') return json(todayReservations)
    if (url.pathname === '/courts') return json(courts)
    if (url.pathname === '/auth/me') {
      return json({
        id: 'o1', name: 'Marcos Silva', email: 'marcos@arena.test', role: 'COURT_OWNER',
        establishmentName: 'Arena Vitória', establishmentPhone: '11999998888', establishmentAddress: 'Rua das Palmeiras, 120',
        establishmentSlug: SLUG, monthlyRevenueGoal: 18000, aboutDescription: null, coverPhotoUrl: null, amenities: [], theme: null,
      })
    }
    if (url.pathname === '/reservations/reports') {
      const previous = url.searchParams.get('from')?.slice(5, 7) !== String(today.getMonth() + 1).padStart(2, '0')
      return json(previous ? { ...monthReport, totalRevenue: monthReport.totalRevenue * 0.84 } : monthReport)
    }
    if (url.pathname === '/customers') return json(customers)
    return route.fulfill({ status: 404, json: { message: 'não mockado' } })
  })
}

async function mockStore(page: Page) {
  const theme = themes.jogae
  await page.route('http://api.test/**', async (route) => {
    const url = new URL(route.request().url())
    const json = (body: unknown) => route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } })
    const court = {
      id: 'c1', name: 'Quadra 1 - Society', sport: 'SOCIETY', surfaceType: 'GRAMA_SINTETICA', hasLighting: true,
      photoUrls: PHOTOS, minBookingMinutes: 60, maxBookingMinutes: 120, bookingStepMinutes: 60,
      owner: { establishmentName: 'Arena Vitória', establishmentAddress: 'Rua das Palmeiras, 120 - Centro', establishmentPhone: '11999998888' },
      fromPricePerHour: '120', averageRating: 4.8, reviewCount: 36,
    }
    if (url.pathname.endsWith('/theme')) {
      return json({ rev: 1, name: 'Arena Vitória', description: null, coverUrl: null, logoUrl: null, themeColor: theme.themeColor, cssVars: theme.cssVars, cssVarsDark: theme.cssVarsDark })
    }
    if (url.pathname.endsWith('/agenda')) {
      const priceRules = Array.from({ length: 7 }, (_, d) => ({ id: `p${d}`, courtId: 'c1', dayOfWeek: d, startMinute: 480, endMinute: 1380, pricePerHour: d === 0 || d === 6 ? '140' : '120' }))
      return json({ reservations: [], maintenanceBlocks: [], priceRules, recurringMaintenanceBlocks: [] })
    }
    if (url.pathname.endsWith('/reviews')) return json([])
    if (url.pathname.startsWith('/public/courts/')) return json(court)
    if (url.pathname.startsWith('/public/estabelecimentos/')) {
      return json({
        establishmentName: 'Arena Vitória', establishmentAddress: 'Rua das Palmeiras, 120 - Centro', establishmentPhone: '11999998888',
        aboutDescription: 'Quadras de society e futsal com iluminação LED e vestiário.', coverPhotoUrl: null, amenities: ['VESTIARIO', 'ESTACIONAMENTO', 'BAR'], theme: null,
        courts: [court, { ...court, id: 'c2', name: 'Quadra 2 - Society', photoUrls: [PHOTOS[1]] }, { ...court, id: 'c3', name: 'Quadra 3 - Futsal', sport: 'FUTSAL' }],
      })
    }
    return route.fulfill({ status: 404, json: { message: 'não mockado' } })
  })
}

test.beforeAll(() => mkdirSync(OUT, { recursive: true }))

test('painel · visão geral', async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 860 })
  await page.addInitScript(() => {
    localStorage.setItem('jogae_token', 'demo')
    localStorage.setItem('jogae_user', JSON.stringify({ id: 'o1', name: 'Marcos Silva', email: 'marcos@arena.test', role: 'COURT_OWNER' }))
  })
  await mockPanel(page)
  await page.goto('/painel')
  await page.locator('.overview-page__hero').waitFor()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/painel.jpg`, type: 'jpeg', quality: 86 })
})

test('lojinha · celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light' })
  await mockStore(page)
  await page.goto(`/${SLUG}`)
  await page.locator('.establishment-hero').waitFor()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/lojinha.jpg`, type: 'jpeg', quality: 86 })
})

test('quadra · celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light' })
  await mockStore(page)
  await page.goto(`/${SLUG}/c1`)
  await page.locator('.booking-sheet').waitFor()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/quadra.jpg`, type: 'jpeg', quality: 86 })
})
