/**
 * Closed envelope shown on a first visit. Tapping it calls `onOpen`; `opening` plays the flap/letter
 * animation and fades the whole scene out (the card is rendered underneath by the page).
 * Drawn with CSS only; animates transform and opacity.
 */
export default function Envelope({ onOpen, opening = false }) {
  return (
    <div
      className={`fixed inset-0 z-20 flex items-center justify-center px-5 ${
        opening ? 'pointer-events-none animate-envelope-out' : ''
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={opening}
        aria-label="Abrir la invitación"
        className="group relative flex min-h-10 min-w-10 cursor-pointer flex-col items-center gap-8 rounded-lg p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum disabled:cursor-default"
      >
        {!opening && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-1/2 block h-48 w-72 -translate-x-1/2 animate-envelope-glow rounded-full bg-gold blur-3xl"
          />
        )}

        <span className="relative block" style={{ perspective: '900px' }}>
          <span className="relative block aspect-3/2 w-[min(72vw,320px)] border border-gold/60 bg-rose shadow-md">
            {/* Letter, hidden behind the pocket until it rises */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-3 top-[8%] z-10 block h-[88%] border border-gold/40 bg-paper ${
                opening ? 'animate-letter-rise' : ''
              }`}
            />
            {/* Front pocket: bottom and side folds */}
            <span
              aria-hidden="true"
              className="absolute inset-0 z-20 block bg-rose-pale"
              style={{ clipPath: 'polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)' }}
            />
            {/* Flap */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 z-30 block h-[58%] bg-plum-soft/80 ${
                opening ? 'animate-flap-open' : ''
              }`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transformOrigin: 'top' }}
            />
          </span>
        </span>

        <span className="relative block text-sm tracking-[0.3em] text-plum-soft uppercase">Toca para abrir</span>
      </button>
    </div>
  )
}
