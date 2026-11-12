import { useRef, useState } from 'react'

const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/background-loop.mp3`

/** Floating button that starts/stops the looping background music. Never autoplays. */
export default function MusicToggle() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  async function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Silenciar la música' : 'Activar la música'}
        className="fixed right-4 bottom-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-paper text-plum shadow-md transition hover:bg-rose-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
          {!playing && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </>
  )
}
