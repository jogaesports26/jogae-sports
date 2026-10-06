import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import themes from './fixtures/themes.json' with { type: 'json' }

/**
 * Testes visuais do tema por lojinha: 5 presets × 4 telas × 2 viewports (+ modo escuro por preset).
 * Em vez de comparar pixels (quebra entre sistemas), cada cenário confere o que importa pra marca:
 * o tema foi aplicado, não há rolagem horizontal, o contraste de texto continua AA e a tela some
 * sem erro de console. O screenshot de cada cenário vai anexado ao relatório pra revisão humana.
 */

const PRESETS = Object.keys(themes) as Array<keyof typeof themes>
const VIEWPORTS = [
  { name: 'celular', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
]
const SLUG = 'arena-teste'
const PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="%23557"/></svg>'

const court = {
  id: 'c1',
  name: 'Quadra 1 - Society',
  sport: 'SOCIETY',
  surfaceType: 'GRAMA_SINTETICA',
  hasLighting: true,
  photoUrls: [PHOTO, PHOTO],
  minBookingMinutes: 60,
  maxBookingMinutes: 120,
  bookingStepMinutes: 60,
  owner: { establishmentName: 'Arena Teste', establishmentAddress: 'Rua A, 10 - Centro', establishmentPhone: '11999998888' },
  fromPricePerHour: '120',
  averageRating: 4.6,
  reviewCount: 3,
}

const priceRules = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  id: `r${dayOfWeek}`,
  courtId: 'c1',
  dayOfWeek,
  startMinute: 8 * 60,
  endMinute: 23 * 60,
  pricePerHour: '120',
}))

async function mockApi(page: Page, preset: keyof typeof themes) {
  const theme = themes[preset]
  await page.route('http://api.test/**', async (route) => {
    const url = new URL(route.request().url())
    const json = (body: unknown) => route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } })

    if (url.pathname.endsWith('/theme')) {
      return json({
        rev: 1,
        name: 'Arena Teste',
        description: 'Quadras com iluminação',
        coverUrl: null,
        logoUrl: null,
        themeColor: theme.themeColor,
        cssVars: theme.cssVars,
        cssVarsDark: theme.cssVarsDark,
      })
    }
    if (url.pathname.endsWith('/agenda')) {
      return json({ reservations: [], maintenanceBlocks: [], priceRules, recurringMaintenanceBlocks: [] })
    }
    if (url.pathname.endsWith('/reviews')) return json([])
    if (url.pathname.startsWith('/public/courts/')) return json(court)
    if (url.pathname.startsWith('/public/estabelecimentos/')) {
      return json({
        establishmentName: 'Arena Teste',
        establishmentAddress: 'Rua A, 10 - Centro',
        establishmentPhone: '11999998888',
        aboutDescription: 'Quadras com iluminação e vestiário.',
        coverPhotoUrl: null,
        amenities: ['VESTIARIO', 'ESTACIONAMENTO'],
        theme: null,
        courts: [{ ...court, id: 'c1' }, { ...court, id: 'c2', name: 'Quadra 2 - Futsal', sport: 'FUTSAL' }],
      })
    }
    return route.fulfill({ status: 404, json: { message: 'não mockado' } })
  })
}

const SCREENS = [
  { name: 'lojinha', path: `/${SLUG}`, ready: '.establishment-hero', textSelector: '.establishment-hero h1', surfaceSelector: '.establishment-hero' },
  { name: 'quadra', path: `/${SLUG}/c1`, ready: '.booking-sheet', textSelector: '.booking-sheet__price strong', surfaceSelector: '.booking-sheet' },
  { name: 'minhas-reservas', path: '/minhas-reservas', ready: '.portal__nav', textSelector: '.portal__logo-name', surfaceSelector: '.portal__nav' },
  { name: 'embed', path: `/${SLUG}/embed?theme=auto`, ready: '.embed-layout__content', textSelector: '.embed-layout__footer', surfaceSelector: '.embed-layout' },
]

// WCAG: razão de contraste entre duas cores 'rgb(r, g, b)' lidas do navegador.
function ratio(a: string, b: string) {
  const lum = (css: string) => {
    const [r, g, bl] = (css.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
      const c = Number(v) / 255
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [la, lb] = [lum(a), lum(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

async function openScreen(page: Page, preset: keyof typeof themes, screen: (typeof SCREENS)[number]) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text())
  })
  await mockApi(page, preset)
  // "Minhas reservas" não tem slug na URL: o tema vem da última lojinha visitada.
  await page.addInitScript((slug) => localStorage.setItem('jogae_last_slug', slug), SLUG)
  await page.goto(screen.path)
  await page.locator(screen.ready).first().waitFor()
  return errors
}

for (const preset of PRESETS) {
  for (const screen of SCREENS) {
    for (const viewport of VIEWPORTS) {
      test(`${preset} · ${screen.name} · ${viewport.name}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.emulateMedia({ colorScheme: 'light' })
        const errors = await openScreen(page, preset, screen)

        // Tema da lojinha aplicado no <html> (o embed só com ?theme=auto).
        await expect
          .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim()))
          .toBe(themes[preset].cssVars['--brand-primary'])

        // Sem rolagem horizontal.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(1)

        // Contraste AA do texto de marca sobre a superfície onde ele aparece.
        const colors = await page.evaluate(
          ({ text, surface }) => {
            const t = document.querySelector(text)
            const s = document.querySelector(surface)
            if (!t || !s) return null
            return { color: getComputedStyle(t).color, background: getComputedStyle(s).backgroundColor }
          },
          { text: screen.textSelector, surface: screen.surfaceSelector },
        )
        expect(colors, `elementos ${screen.textSelector} / ${screen.surfaceSelector}`).not.toBeNull()
        if (colors && !colors.background.includes('0, 0, 0, 0') && !colors.background.includes('rgba(0, 0, 0, 0)')) {
          expect(ratio(colors.color, colors.background)).toBeGreaterThanOrEqual(4.5)
        }

        expect(errors).toEqual([])
        await testInfo.attach(`${preset}-${screen.name}-${viewport.name}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        })
      })
    }
  }
}

for (const preset of PRESETS) {
  test(`${preset} · modo escuro mantém marca legível`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await openScreen(page, preset, SCREENS[0])

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const read = (name: string) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)
    const surface = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim())
    const brandText = await read('--brand-text')
    expect(brandText).toBe(themes[preset].cssVarsDark['--brand-text'])

    // Link de marca sobre a superfície escura: contraste AA (4.5:1).
    const [text, background] = await page.evaluate(
      ({ a, b }) => {
        const probe = document.createElement('span')
        probe.style.color = a
        probe.style.backgroundColor = b
        document.body.append(probe)
        const styles = getComputedStyle(probe)
        const result = [styles.color, styles.backgroundColor]
        probe.remove()
        return result
      },
      { a: brandText, b: surface },
    )
    expect(ratio(text, background)).toBeGreaterThanOrEqual(4.5)

    await testInfo.attach(`${preset}-lojinha-escuro`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  })
}
