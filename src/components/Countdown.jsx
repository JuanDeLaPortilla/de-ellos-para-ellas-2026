import { useEffect, useState } from 'react'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function remaining(targetMs) {
  const diff = Math.max(0, targetMs - Date.now())
  return {
    days: Math.floor(diff / DAY),
    hours: Math.floor((diff % DAY) / HOUR),
    minutes: Math.floor((diff % HOUR) / MINUTE),
    seconds: Math.floor((diff % MINUTE) / SECOND),
    done: diff === 0,
  }
}

const units = [
  { key: 'days', label: 'Días' },
  { key: 'hours', label: 'Horas' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'seconds', label: 'Segundos' },
]

export default function Countdown({ targetISO }) {
  const targetMs = new Date(targetISO).getTime()
  const [time, setTime] = useState(() => remaining(targetMs))

  useEffect(() => {
    const id = setInterval(() => setTime(remaining(targetMs)), SECOND)
    return () => clearInterval(id)
  }, [targetMs])

  if (time.done) {
    return <p className="font-script text-3xl text-plum">¡Es hoy, nos vemos!</p>
  }

  return (
    <div className="flex justify-center gap-3 sm:gap-5" role="timer" aria-label="Cuenta regresiva">
      {units.map(({ key, label }) => (
        <div key={key} className="w-[4.5rem] rounded-2xl border border-gold/50 bg-paper/90 py-3 sm:w-24">
          <div className="font-display text-4xl font-medium text-plum tabular-nums sm:text-5xl">
            {String(time[key]).padStart(2, '0')}
          </div>
          <div className="text-[0.65rem] tracking-widest text-ink/60 uppercase">{label}</div>
        </div>
      ))}
    </div>
  )
}
