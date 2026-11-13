// Genera el QR del mural (PNG) y la tarjeta proyectable (HTML) en generated/.
// Uso: npm run qr -- <CÓDIGO> [URL_BASE]
// El código del evento nunca se escribe en el repo: se recibe como argumento.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import QRCode from 'qrcode'
import { floralDecoration } from './floral.js'

const BASE_URL = 'https://juandelaportilla.github.io/de-ellos-para-ellas-2026'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'generated')
const pngPath = path.join(outDir, 'qr-mural.png')
const cardPath = path.join(outDir, 'tarjeta-qr.html')
const templatePath = path.join(root, 'scripts', 'qr-card.template.html')

const [, , rawCode, baseArg] = process.argv
const code = (rawCode ?? '').trim().toUpperCase()

if (!code) {
  console.error('Falta el código del evento.')
  console.error('Uso: npm run qr -- <CÓDIGO> [URL_BASE]')
  console.error('Ejemplo: npm run qr -- ELLAS2026')
  console.error('La URL base también puede venir de la variable QR_BASE_URL.')
  process.exit(1)
}

const base = (baseArg || process.env.QR_BASE_URL || BASE_URL).trim().replace(/\/+$/, '')
const link = `${base}/mural?codigo=${encodeURIComponent(code)}`

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const { event } = await import(pathToFileURL(path.join(root, 'src', 'config', 'event.config.js')).href)

const png = await QRCode.toBuffer(link, {
  type: 'png',
  errorCorrectionLevel: 'H',
  margin: 4,
  width: 1200,
  color: { dark: '#000000', light: '#ffffff' },
})

const values = {
  QR_DATA_URI: `data:image/png;base64,${png.toString('base64')}`,
  EVENT_NAME: escapeHtml(event.name),
  FLORAL: floralDecoration(),
}
const template = await readFile(templatePath, 'utf8')
const card = template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] ?? match)

await mkdir(outDir, { recursive: true })
await writeFile(pngPath, png)
await writeFile(cardPath, card)

console.log(`PNG:     ${pngPath}`)
console.log(`Tarjeta: ${cardPath}`)
console.log(`Enlace:  ${link}`)
