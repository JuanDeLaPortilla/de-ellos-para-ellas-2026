import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Countdown from '../components/Countdown.jsx'
import Envelope from '../components/Envelope.jsx'
import { CornerBouquet, FloralDivider } from '../components/decor/Flora.jsx'
import { event } from '../config/event.config.js'
import { useMusic } from '../lib/music.jsx'

const OPENED_KEY = 'envelope-opened:v1'
/** After the envelope: the last text block starts at 2.5 s and takes 0.5 s, with a small margin. */
const OPENING_MS = 3100
/** The card frame appears at 1.8 s, once the envelope has faded out. Texts start right after, every 0.1 s. */
const OPENING_CASCADE_START = 1.9
/** Reload with the key present: same cascade, no envelope (last block starts at 0.8 s). */
const REVEALING_MS = 1500
const REVEALING_CASCADE_START = 0.2
const CASCADE_STEP = 0.1

function hasOpenedKey() {
  try {
    return localStorage.getItem(OPENED_KEY) === '1'
  } catch {
    return false
  }
}

function saveOpenedKey() {
  try {
    localStorage.setItem(OPENED_KEY, '1')
  } catch {
    // Storage can be unavailable (private mode); the envelope then shows on every load.
  }
}

export default function Invitation() {
  const { play } = useMusic()
  // 'closed' = envelope waiting, 'opening' = envelope animation running, 'revealing' = card with only the
  // text cascade running (reload with the key), 'open' = card with all texts shown.
  const [stage, setStage] = useState(() => (hasOpenedKey() ? 'revealing' : 'closed'))
  const [hasKey, setHasKey] = useState(hasOpenedKey)

  useEffect(() => {
    if (stage !== 'opening' && stage !== 'revealing') return undefined
    const timer = setTimeout(() => setStage('open'), stage === 'opening' ? OPENING_MS : REVEALING_MS)
    return () => clearTimeout(timer)
  }, [stage])

  function openEnvelope() {
    if (stage !== 'closed') return
    saveOpenedKey()
    setHasKey(hasOpenedKey())
    play()
    setStage('opening')
  }

  // Cascade: each text block fades in after the previous one while the envelope is opening.
  function cascade(index) {
    if (stage !== 'opening' && stage !== 'revealing') return {}
    const start = stage === 'opening' ? OPENING_CASCADE_START : REVEALING_CASCADE_START
    return { className: 'animate-text-in', style: { animationDelay: `${start + index * CASCADE_STEP}s` } }
  }
  const c = (index) => cascade(index).className ?? ''
  const d = (index) => cascade(index).style

  if (stage === 'closed') return <Envelope onOpen={openEnvelope} />

  return (
    <>
      {stage === 'opening' && <Envelope opening />}
      <section className={`card relative overflow-hidden text-center ${stage === 'opening' ? 'animate-card-in' : ''}`}>
        <CornerBouquet corner="tl" width={220} />
        <CornerBouquet corner="br" width={220} />

        <div className="relative z-10 py-10 sm:py-16">
          <p className={`text-sm tracking-[0.3em] text-plum-soft uppercase ${c(0)}`} style={d(0)}>
            Estás invitada a
          </p>
          <h1 className={`mt-4 font-script text-6xl leading-tight text-plum sm:text-8xl ${c(1)}`} style={d(1)}>
            {event.name}
          </h1>
          <div className={c(2)} style={d(2)}>
            <FloralDivider width={280} className="mt-4" />
          </div>

          <div className={`mt-6 ${c(3)}`} style={d(3)}>
            <p className="font-display text-3xl text-ink sm:text-4xl">{event.dateText}</p>
            <p className="font-display text-2xl text-plum-soft">{event.timeText}</p>
          </div>

          <div className={`mt-10 ${c(4)}`} style={d(4)}>
            <Countdown targetISO={event.dateISO} />
          </div>

          <div className={`mt-10 ${c(5)}`} style={d(5)}>
            <div className="flex items-center justify-center gap-1">
              <p className="text-sm tracking-[0.3em] text-plum-soft uppercase">Lugar</p>
              <a
                href={event.venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cómo llegar al lugar (abre el mapa)"
                title="Cómo llegar"
                className="-my-2 flex h-10 w-10 items-center justify-center"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold text-plum transition hover:bg-rose-pale">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8" />
                    <path d="M12 17h.01" />
                  </svg>
                </span>
              </a>
            </div>
            <p className="mt-2 font-display text-3xl text-ink">{event.venue.name}</p>
          </div>

          <div className={`mt-10 flex items-center justify-center ${c(6)}`} style={d(6)}>
            <Link to="/confirmar" className="btn">
              Confirmar asistencia
            </Link>
          </div>
        </div>
      </section>

      {stage === 'open' && hasKey && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setStage('closed')}
            className="min-h-10 px-3 text-xs tracking-wider text-plum-soft underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
          >
            Ver animación otra vez
          </button>
        </div>
      )}
    </>
  )
}
