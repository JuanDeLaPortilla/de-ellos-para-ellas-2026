import { useMemo } from 'react'
import './flora.css'

/**
 * Falling petals: a fixed background layer animated only with
 * `transform` and `opacity`, so it stays cheap on modest phones.
 */

const TONES = [
  { fill: '#F2BCCB', stroke: '#E8A0B4' }, // rose
  { fill: '#EBD3A0', stroke: '#C9A25B' }, // gold
  { fill: '#BCD0BE', stroke: '#9DB8A0' }, // sage
  { fill: '#FBF5EE', stroke: '#E8DCC8' }, // cream
  { fill: '#B07A9E', stroke: '#6B3A5B' }, // plum
]

// Seeded pseudo-random numbers keep the render pure and the layout stable between reloads.
const rand = (seed) => {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

export default function Petals({ count = 18 }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const tone = TONES[i % TONES.length]
        return {
          id: i,
          left: `${(i * 100) / count + (rand(i + 1) * 100) / count}%`,
          size: 9 + rand(i + 11) * 13,
          fall: 14 + rand(i + 21) * 16, // seconds to reach the bottom
          delay: -rand(i + 31) * 30, // negative: already falling on load
          spin: 3 + rand(i + 41) * 4,
          drift: `${(rand(i + 51) - 0.5) * 220}px`,
          opacity: 0.45 + rand(i + 61) * 0.4,
          ...tone,
        }
      }),
    [count],
  )

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            animationDuration: `${p.fall}s`,
            animationDelay: `${p.delay}s`,
            '--drift': p.drift,
            '--o': p.opacity,
          }}
        >
          <svg width={p.size} height={p.size * 1.35} viewBox="0 0 20 27" style={{ animationDuration: `${p.spin}s` }}>
            <path
              d="M10,0 C17.5,7 19.5,17 10,27 C0.5,17 2.5,7 10,0 Z"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="0.6"
              opacity="0.95"
            />
            <path d="M10,3 L10,24" stroke={p.stroke} strokeWidth="0.5" opacity="0.5" />
          </svg>
        </span>
      ))}
    </div>
  )
}
