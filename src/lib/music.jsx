import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/background-loop.mp3`

const MusicContext = createContext(null)

/** Owns the single <audio> element. Music only starts from a user gesture (never autoplays). */
export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  /** Tries to start the music; never throws. Leaves `playing` false if the browser or the file refuses. */
  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }, [])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    await play()
  }, [playing, play])

  const value = useMemo(() => ({ playing, volume, setVolume, play, toggle }), [playing, volume, play, toggle])

  return (
    <MusicContext.Provider value={value}>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="none" />
      {children}
    </MusicContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic must be used inside <MusicProvider>')
  return ctx
}
