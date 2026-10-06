// Falha se houver cor hex fora de src/styles/tokens.css (ver comentário lá).
// Ilustrações SVG (mockups, ícones de esporte) ficam fora da regra.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../src', import.meta.url))
const ALLOWED = new Set([
  'styles/tokens.css',
  'pages/DeviceMockup.tsx',
  'pages/SportIcons.tsx',
])
const HEX = /#[0-9a-fA-F]{3,8}\b/g

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const offenders = []
for (const file of walk(ROOT)) {
  if (!/\.(css|tsx?)$/.test(file)) continue
  const rel = relative(ROOT, file).replaceAll(String.fromCharCode(92), '/')
  if (ALLOWED.has(rel)) continue
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (HEX.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`)
      HEX.lastIndex = 0
    })
}

if (offenders.length) {
  console.error('Cor hex fora de styles/tokens.css — use um token (var(--...)):\n' + offenders.join('\n'))
  process.exit(1)
}
console.log('check-no-hex: ok')
