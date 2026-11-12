/** Flowers drawn as inline SVG, animated piece by piece with CSS. */

import './flora.css'

const rand = (seed) => {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Places an element and gives it its own sway.
 * Two nested <g>: the outer one positions, the inner one animates, so the
 * CSS animation never overrides the SVG `transform` attribute.
 */
function Sway({ x = 0, y = 0, size = 1, rotate = 0, delay = 0, dur = 6, kind = 'bloom', children }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size})`}>
      <g className={`fl-${kind}`} style={{ '--d': `${delay}s`, '--t': `${dur}s` }}>
        {children}
      </g>
    </g>
  )
}

export function FloralDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="fl-blush" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FCEEF2" />
          <stop offset="55%" stopColor="#F2BCCB" />
          <stop offset="100%" stopColor="#E8A0B4" />
        </radialGradient>

        <radialGradient id="fl-lilac" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FBF1DC" />
          <stop offset="55%" stopColor="#EBD3A0" />
          <stop offset="100%" stopColor="#C9A25B" />
        </radialGradient>

        <radialGradient id="fl-plum" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#B07A9E" />
          <stop offset="60%" stopColor="#8F5A7E" />
          <stop offset="100%" stopColor="#6B3A5B" />
        </radialGradient>

        <radialGradient id="fl-blue" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#EAF2EB" />
          <stop offset="55%" stopColor="#BCD0BE" />
          <stop offset="100%" stopColor="#9DB8A0" />
        </radialGradient>

        <radialGradient id="fl-cream" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="60%" stopColor="#FBF5EE" />
          <stop offset="100%" stopColor="#E8DCC8" />
        </radialGradient>

        <linearGradient id="fl-leaf" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#B9C9B2" />
          <stop offset="100%" stopColor="#8A9E84" />
        </linearGradient>

        <linearGradient id="fl-leaf-2" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#CBD8C6" />
          <stop offset="100%" stopColor="#9DAF97" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Rose({ x, y, size = 1, tone = 'blush', rotate = 0, delay = 0, dur = 7 }) {
  return (
    <Sway x={x} y={y} size={size} rotate={rotate} delay={delay} dur={dur} kind="bloom" tone={tone}>
      {[0, 72, 144, 216, 288].map((a, i) => (
        <path
          key={a}
          d="M0,0 C-9,-6 -9.5,-17 0,-22 C9.5,-17 9,-6 0,0"
          fill={`url(#fl-${tone})`}
          opacity={0.92}
          transform={`rotate(${a + (i % 2 ? 6 : -4)})`}
        />
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <path
          key={a}
          d="M0,0 C-6,-4 -6.5,-12 0,-15 C6.5,-12 6,-4 0,0"
          fill={`url(#fl-${tone})`}
          opacity={0.98}
          transform={`rotate(${a})`}
        />
      ))}
      <path
        d="M0,-1 a5.5,5.5 0 1,1 -0.1,0 a3.8,3.8 0 1,0 0.1,0 a2.1,2.1 0 1,1 0,0"
        fill="none"
        stroke="rgba(120,78,110,0.34)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Sway>
  )
}

export function Hydrangea({ x, y, size = 1, tone = 'blue', delay = 0, dur = 6, seed = 1 }) {
  const florets = Array.from({ length: 9 }, (_, i) => {
    const a = rand(seed + i) * Math.PI * 2
    const r = 4 + rand(seed + i + 40) * 11
    return {
      cx: Math.cos(a) * r,
      cy: Math.sin(a) * r * 0.85,
      rot: rand(seed + i + 80) * 90,
      s: 0.72 + rand(seed + i + 120) * 0.45,
    }
  })

  return (
    <Sway x={x} y={y} size={size} delay={delay} dur={dur} kind="bloom" tone={tone}>
      {florets.map((f, i) => (
        <g key={i} transform={`translate(${f.cx} ${f.cy}) rotate(${f.rot}) scale(${f.s})`}>
          {[0, 90, 180, 270].map((a) => (
            <ellipse
              key={a}
              rx={3.4}
              ry={5}
              cy={-4.4}
              fill={`url(#fl-${tone})`}
              opacity={0.9}
              transform={`rotate(${a})`}
            />
          ))}
          <circle r={1.5} fill="#F6F1E2" opacity={0.95} />
        </g>
      ))}
    </Sway>
  )
}

export function LilacSpray({ x, y, size = 1, rotate = 0, tone = 'lilac', delay = 0, dur = 5.5, seed = 3 }) {
  const buds = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15
    const spread = (1 - t) * 13 + 2
    return {
      cx: (rand(seed + i) - 0.5) * spread * 2,
      cy: -t * 34,
      r: 2 + rand(seed + i + 30) * 2.4,
      o: 0.7 + rand(seed + i + 60) * 0.3,
    }
  })

  return (
    <Sway x={x} y={y} size={size} rotate={rotate} delay={delay} dur={dur} kind="bloom" tone={tone}>
      <path d="M0,2 C1,-8 -1,-18 0,-30" stroke="#9DAF97" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {buds.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={`url(#fl-${tone})`} opacity={b.o} />
      ))}
    </Sway>
  )
}

export function Leaf({ x, y, size = 1, rotate = 0, tone = 'leaf', delay = 0, dur = 6 }) {
  return (
    <Sway x={x} y={y} size={size} rotate={rotate} delay={delay} dur={dur} kind="leaf" tone={tone}>
      <path d="M0,0 C7,-7 9,-19 0,-28 C-9,-19 -7,-7 0,0" fill={`url(#fl-${tone})`} opacity={0.88} />
      <path d="M0,-1 L0,-26" stroke="rgba(70,88,66,0.3)" strokeWidth={0.9} strokeLinecap="round" />
    </Sway>
  )
}

export function Sprig({ x, y, size = 1, rotate = 0, delay = 0, dur = 6.5, length = 5 }) {
  return (
    <Sway x={x} y={y} size={size} rotate={rotate} delay={delay} dur={dur} kind="leaf" tone="leaf-2">
      <path d="M0,0 C2,-14 -2,-28 0,-44" stroke="#9DAF97" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {Array.from({ length }, (_, i) => {
        const cy = -8 - i * 8
        return (
          <g key={i}>
            <ellipse rx={7} ry={3.2} cx={6} cy={cy} fill="url(#fl-leaf-2)" opacity={0.85} transform={`rotate(-28 6 ${cy})`} />
            <ellipse rx={7} ry={3.2} cx={-6} cy={cy} fill="url(#fl-leaf-2)" opacity={0.85} transform={`rotate(28 -6 ${cy})`} />
          </g>
        )
      })}
    </Sway>
  )
}

export function Berries({ x, y, size = 1, tone = 'cream', delay = 0, dur = 5, seed = 7 }) {
  const dots = Array.from({ length: 7 }, (_, i) => ({
    cx: (rand(seed + i) - 0.5) * 22,
    cy: (rand(seed + i + 20) - 0.5) * 20,
    r: 2.2 + rand(seed + i + 40) * 1.8,
  }))
  return (
    <Sway x={x} y={y} size={size} delay={delay} dur={dur} kind="bloom" tone={tone}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={`url(#fl-${tone})`} opacity={0.9} />
      ))}
    </Sway>
  )
}


/** Corner bouquet. `corner` is one of: tl, tr, bl, br. */
export function CornerBouquet({ corner = 'tl', width = 260, opacity = 1, className = '' }) {
  const flipX = corner === 'tr' || corner === 'br' ? -1 : 1
  const flipY = corner === 'bl' || corner === 'br' ? -1 : 1

  return (
    <svg
      className={`fl-corner fl-bouquet fl-corner--${corner} ${className}`}
      style={{ width, opacity }}
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
    >
      <g transform={`translate(110 110) scale(${flipX} ${flipY}) translate(-110 -110)`}>
        <g className="fl-breathe">
          <Sprig x={44} y={128} size={1.25} rotate={-38} delay={0.2} dur={7.5} />
          <Sprig x={104} y={96} size={1.1} rotate={12} delay={1.1} dur={6.8} length={4} />
          <Sprig x={26} y={78} size={0.95} rotate={-72} delay={0.7} dur={8.2} length={4} />
          <Leaf x={132} y={132} size={1.5} rotate={54} delay={0.4} dur={7} />
          <Leaf x={18} y={122} size={1.3} rotate={-58} delay={1.3} dur={6.2} tone="leaf-2" />
          <Leaf x={78} y={38} size={1.15} rotate={-14} delay={0.9} dur={7.8} />

          <LilacSpray x={126} y={74} size={1.05} rotate={26} delay={0.5} dur={5.8} seed={11} />
          <LilacSpray x={30} y={104} size={0.9} rotate={-34} delay={1.4} dur={6.4} seed={19} tone="plum" />
          <Hydrangea x={96} y={46} size={1.1} delay={0.3} dur={6.6} seed={5} />
          <Hydrangea x={44} y={62} size={0.85} delay={1.2} dur={7.2} seed={23} tone="lilac" />
          <Berries x={132} y={104} size={1} delay={0.8} dur={5.4} seed={31} />

          <Rose x={72} y={82} size={1.35} tone="blush" rotate={-12} delay={0} dur={7.4} />
          <Rose x={112} y={122} size={1.05} tone="lilac" rotate={22} delay={0.9} dur={6.6} />
          <Rose x={40} y={40} size={0.8} tone="cream" rotate={-30} delay={1.6} dur={8} />
          <Rose x={140} y={44} size={0.62} tone="plum" rotate={14} delay={2.1} dur={7} />
        </g>
      </g>
    </svg>
  )
}

/** Horizontal garland to separate sections. */
export function FloralDivider({ width = 300, className = '' }) {
  return (
    <svg className={`fl-divider fl-bouquet ${className}`} style={{ width }} viewBox="0 0 300 64" fill="none" aria-hidden="true">
      <path
        d="M8,42 C60,22 96,54 150,32 C204,12 240,44 292,26"
        stroke="#A8B8A0"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.7}
        fill="none"
      />
      <Leaf x={44} y={40} size={0.62} rotate={-42} delay={0.3} dur={6.4} />
      <Leaf x={96} y={48} size={0.55} rotate={34} delay={1.1} dur={7.1} tone="leaf-2" />
      <Leaf x={206} y={30} size={0.58} rotate={-38} delay={0.7} dur={6.8} />
      <Leaf x={256} y={40} size={0.5} rotate={40} delay={1.5} dur={7.6} tone="leaf-2" />
      <LilacSpray x={68} y={44} size={0.5} rotate={-18} delay={0.5} dur={5.6} seed={41} />
      <LilacSpray x={232} y={34} size={0.46} rotate={16} delay={1.2} dur={6.1} seed={47} tone="plum" />
      <Hydrangea x={118} y={34} size={0.6} delay={0.9} dur={6.2} seed={53} />
      <Hydrangea x={186} y={32} size={0.52} delay={0.2} dur={7} seed={59} tone="lilac" />
      <Rose x={150} y={30} size={0.82} tone="blush" delay={0} dur={7.2} />
      <Rose x={92} y={28} size={0.5} tone="cream" rotate={-16} delay={1.4} dur={6.5} />
      <Rose x={214} y={44} size={0.44} tone="lilac" rotate={20} delay={1.8} dur={6.9} />
    </svg>
  )
}

/** Vertical branch for the side edges of long sections. */
export function SideBranch({ side = 'left', height = 340, opacity = 0.75, className = '' }) {
  const flipX = side === 'right' ? -1 : 1
  return (
    <svg
      className={`fl-branch fl-bouquet fl-branch--${side} ${className}`}
      style={{ height, opacity }}
      viewBox="0 0 120 340"
      fill="none"
      aria-hidden="true"
    >
      <g transform={`translate(60 170) scale(${flipX} 1) translate(-60 -170)`}>
        <g className="fl-breathe">
          <path
            d="M18,336 C34,268 10,206 30,146 C46,96 26,44 44,4"
            stroke="#A8B8A0"
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.75}
            fill="none"
          />
          <Sprig x={26} y={300} size={0.9} rotate={22} delay={0.4} dur={7.4} />
          <Sprig x={22} y={210} size={0.8} rotate={-16} delay={1.2} dur={6.9} length={4} />
          <Sprig x={38} y={110} size={0.75} rotate={26} delay={0.8} dur={8.1} length={4} />
          <Leaf x={12} y={262} size={1} rotate={-64} delay={0.6} dur={6.6} />
          <Leaf x={40} y={168} size={0.9} rotate={62} delay={1.5} dur={7.3} tone="leaf-2" />
          <Leaf x={30} y={66} size={0.85} rotate={-48} delay={1} dur={6.4} />
          <LilacSpray x={40} y={244} size={0.7} rotate={18} delay={0.9} dur={5.9} seed={61} />
          <Hydrangea x={26} y={144} size={0.72} delay={0.5} dur={6.7} seed={67} />
          <Rose x={34} y={286} size={0.78} tone="blush" rotate={-14} delay={0.2} dur={7.6} />
          <Rose x={44} y={196} size={0.6} tone="lilac" rotate={18} delay={1.3} dur={6.8} />
          <Rose x={26} y={38} size={0.52} tone="cream" rotate={-22} delay={1.9} dur={7.2} />
        </g>
      </g>
    </svg>
  )
}

/** Small ornament for card headings. */
export function TinySprig({ width = 110, className = '' }) {
  return (
    <svg className={`fl-bouquet ${className}`} style={{ width }} viewBox="0 0 110 30" fill="none" aria-hidden="true">
      <path d="M6,20 C34,8 74,26 104,12" stroke="#A8B8A0" strokeWidth={1} opacity={0.6} fill="none" strokeLinecap="round" />
      <Leaf x={28} y={20} size={0.36} rotate={-40} delay={0.4} dur={6} />
      <Leaf x={82} y={18} size={0.32} rotate={38} delay={1} dur={6.6} tone="leaf-2" />
      <LilacSpray x={40} y={20} size={0.3} rotate={-14} delay={0.7} dur={5.5} seed={71} />
      <LilacSpray x={70} y={20} size={0.28} rotate={12} delay={1.3} dur={6} seed={73} tone="lilac" />
      <Rose x={55} y={14} size={0.42} tone="blush" delay={0} dur={7} />
    </svg>
  )
}
