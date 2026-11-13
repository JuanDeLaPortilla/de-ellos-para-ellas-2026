import { useMusic } from '../lib/music.jsx'

/** Floating button that starts/stops the looping background music. Never autoplays. */
export default function MusicToggle() {
  const { playing, volume, setVolume, toggle } = useMusic()

  return (
    <div className="fixed right-4 bottom-4 z-30 flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volumen de la música"
        className="h-2 w-24 cursor-pointer accent-plum"
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Silenciar la música' : 'Activar la música'}
        className="btn-icon shrink-0"
      >
        <svg className="pointer-events-none" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
          {!playing && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  )
}
