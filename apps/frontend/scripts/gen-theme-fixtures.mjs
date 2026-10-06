// Gera e2e/fixtures/themes.json a partir da derivação REAL do backend (apps/backend/src/theme/theme.util.ts),
// pra os testes visuais não terem cores escritas à mão. Rode de novo se os presets mudarem:
//   node scripts/gen-theme-fixtures.mjs
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const util = await import(pathToFileURL(resolve('../backend/src/theme/theme.util.ts')).href)

const fixtures = {}
for (const preset of Object.keys(util.THEME_PRESETS)) {
  const { cssVars, cssVarsDark, themeColor } = util.resolveTheme({ preset })
  fixtures[preset] = { cssVars, cssVarsDark, themeColor }
}
writeFileSync(resolve('e2e/fixtures/themes.json'), JSON.stringify(fixtures, null, 2) + '\n')
console.log('themes.json:', Object.keys(fixtures).join(', '))
