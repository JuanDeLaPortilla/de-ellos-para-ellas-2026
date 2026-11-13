// Floral decoration for the QR card: static SVG strings that mirror src/components/decor/Flora.jsx
// (same shapes and colors, no animation). Used only by generate-qr.js.

const rand = (seed) => {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

const n = (value) => Number(value.toFixed(2))

const place = ({ x = 0, y = 0, size = 1, rotate = 0 }, inner) =>
  `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${size})">${inner}</g>`

const radial = (id, stops) =>
  `<radialGradient id="${id}" cx="38%" cy="32%" r="72%">${stops
    .map(([offset, color]) => `<stop offset="${offset}%" stop-color="${color}"/>`)
    .join('')}</radialGradient>`

const linear = (id, from, to) =>
  `<linearGradient id="${id}" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient>`

const defs = () =>
  `<svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs>${[
    radial('fl-blush', [[0, '#FCEEF2'], [55, '#F2BCCB'], [100, '#E8A0B4']]),
    radial('fl-lilac', [[0, '#FBF1DC'], [55, '#EBD3A0'], [100, '#C9A25B']]),
    radial('fl-plum', [[0, '#B07A9E'], [60, '#8F5A7E'], [100, '#6B3A5B']]),
    radial('fl-blue', [[0, '#EAF2EB'], [55, '#BCD0BE'], [100, '#9DB8A0']]),
    radial('fl-cream', [[0, '#FFFDF8'], [60, '#FBF5EE'], [100, '#E8DCC8']]),
    linear('fl-leaf', '#B9C9B2', '#8A9E84'),
    linear('fl-leaf-2', '#CBD8C6', '#9DAF97'),
  ].join('')}</defs></svg>`

const rose = (pos, tone = 'blush') => {
  const outer = [0, 72, 144, 216, 288]
    .map(
      (a, i) =>
        `<path d="M0,0 C-9,-6 -9.5,-17 0,-22 C9.5,-17 9,-6 0,0" fill="url(#fl-${tone})" opacity="0.92" transform="rotate(${a + (i % 2 ? 6 : -4)})"/>`,
    )
    .join('')
  const inner = [36, 108, 180, 252, 324]
    .map(
      (a) =>
        `<path d="M0,0 C-6,-4 -6.5,-12 0,-15 C6.5,-12 6,-4 0,0" fill="url(#fl-${tone})" opacity="0.98" transform="rotate(${a})"/>`,
    )
    .join('')
  const swirl =
    '<path d="M0,-1 a5.5,5.5 0 1,1 -0.1,0 a3.8,3.8 0 1,0 0.1,0 a2.1,2.1 0 1,1 0,0" fill="none" stroke="rgba(120,78,110,0.34)" stroke-width="1.4" stroke-linecap="round"/>'
  return place(pos, outer + inner + swirl)
}

const hydrangea = (pos, tone = 'blue', seed = 1) => {
  const florets = Array.from({ length: 9 }, (_, i) => {
    const a = rand(seed + i) * Math.PI * 2
    const r = 4 + rand(seed + i + 40) * 11
    const cx = n(Math.cos(a) * r)
    const cy = n(Math.sin(a) * r * 0.85)
    const rot = n(rand(seed + i + 80) * 90)
    const s = n(0.72 + rand(seed + i + 120) * 0.45)
    const petals = [0, 90, 180, 270]
      .map((p) => `<ellipse rx="3.4" ry="5" cy="-4.4" fill="url(#fl-${tone})" opacity="0.9" transform="rotate(${p})"/>`)
      .join('')
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">${petals}<circle r="1.5" fill="#F6F1E2" opacity="0.95"/></g>`
  })
  return place(pos, florets.join(''))
}

const lilacSpray = (pos, tone = 'lilac', seed = 3) => {
  const buds = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15
    const spread = (1 - t) * 13 + 2
    const cx = n((rand(seed + i) - 0.5) * spread * 2)
    const cy = n(-t * 34)
    const r = n(2 + rand(seed + i + 30) * 2.4)
    const o = n(0.7 + rand(seed + i + 60) * 0.3)
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#fl-${tone})" opacity="${o}"/>`
  })
  const stem = '<path d="M0,2 C1,-8 -1,-18 0,-30" stroke="#9DAF97" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
  return place(pos, stem + buds.join(''))
}

const leaf = (pos, tone = 'leaf') =>
  place(
    pos,
    `<path d="M0,0 C7,-7 9,-19 0,-28 C-9,-19 -7,-7 0,0" fill="url(#fl-${tone})" opacity="0.88"/><path d="M0,-1 L0,-26" stroke="rgba(70,88,66,0.3)" stroke-width="0.9" stroke-linecap="round"/>`,
  )

const sprig = (pos, length = 5) => {
  const pairs = Array.from({ length }, (_, i) => {
    const cy = -8 - i * 8
    return `<ellipse rx="7" ry="3.2" cx="6" cy="${cy}" fill="url(#fl-leaf-2)" opacity="0.85" transform="rotate(-28 6 ${cy})"/><ellipse rx="7" ry="3.2" cx="-6" cy="${cy}" fill="url(#fl-leaf-2)" opacity="0.85" transform="rotate(28 -6 ${cy})"/>`
  })
  const stem = '<path d="M0,0 C2,-14 -2,-28 0,-44" stroke="#9DAF97" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
  return place(pos, stem + pairs.join(''))
}

const berries = (pos, tone = 'cream', seed = 7) => {
  const dots = Array.from({ length: 7 }, (_, i) => {
    const cx = n((rand(seed + i) - 0.5) * 22)
    const cy = n((rand(seed + i + 20) - 0.5) * 20)
    const r = n(2.2 + rand(seed + i + 40) * 1.8)
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#fl-${tone})" opacity="0.9"/>`
  })
  return place(pos, dots.join(''))
}

/** Corner bouquet. `corner` is one of: tl, tr, bl, br. */
const cornerBouquet = (corner) => {
  const flipX = corner === 'tr' || corner === 'br' ? -1 : 1
  const flipY = corner === 'bl' || corner === 'br' ? -1 : 1
  const parts = [
    sprig({ x: 44, y: 128, size: 1.25, rotate: -38 }),
    sprig({ x: 104, y: 96, size: 1.1, rotate: 12 }, 4),
    sprig({ x: 26, y: 78, size: 0.95, rotate: -72 }, 4),
    leaf({ x: 132, y: 132, size: 1.5, rotate: 54 }),
    leaf({ x: 18, y: 122, size: 1.3, rotate: -58 }, 'leaf-2'),
    leaf({ x: 78, y: 38, size: 1.15, rotate: -14 }),
    lilacSpray({ x: 126, y: 74, size: 1.05, rotate: 26 }, 'lilac', 11),
    lilacSpray({ x: 30, y: 104, size: 0.9, rotate: -34 }, 'plum', 19),
    hydrangea({ x: 96, y: 46, size: 1.1 }, 'blue', 5),
    hydrangea({ x: 44, y: 62, size: 0.85 }, 'lilac', 23),
    berries({ x: 132, y: 104, size: 1 }, 'cream', 31),
    rose({ x: 72, y: 82, size: 1.35, rotate: -12 }, 'blush'),
    rose({ x: 112, y: 122, size: 1.05, rotate: 22 }, 'lilac'),
    rose({ x: 40, y: 40, size: 0.8, rotate: -30 }, 'cream'),
    rose({ x: 140, y: 44, size: 0.62, rotate: 14 }, 'plum'),
  ]
  return `<svg class="corner corner-${corner}" viewBox="0 0 220 220" fill="none" aria-hidden="true"><g transform="translate(110 110) scale(${flipX} ${flipY}) translate(-110 -110)">${parts.join('')}</g></svg>`
}

/** Gradient defs plus the four corner bouquets, ready to drop into the card. */
export const floralDecoration = () => [defs(), ...['tl', 'tr', 'bl', 'br'].map(cornerBouquet)].join('\n')
