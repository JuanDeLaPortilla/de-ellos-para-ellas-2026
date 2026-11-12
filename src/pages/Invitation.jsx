import { Link } from 'react-router-dom'
import Countdown from '../components/Countdown.jsx'
import { CornerBouquet, FloralDivider } from '../components/decor/Flora.jsx'
import { event } from '../config/event.config.js'

export default function Invitation() {
  return (
    <section className="card relative overflow-hidden text-center">
      <CornerBouquet corner="tl" width={220} />
      <CornerBouquet corner="br" width={220} />

      <div className="relative z-10 py-10 sm:py-16">
        <p className="text-sm tracking-[0.3em] text-plum-soft uppercase">Estás invitada a</p>
        <h1 className="mt-4 font-script text-6xl leading-tight text-plum sm:text-8xl">{event.name}</h1>
        <FloralDivider width={280} className="mt-4" />

        <p className="mt-6 font-display text-3xl text-ink sm:text-4xl">{event.dateText}</p>
        <p className="font-display text-2xl text-plum-soft">{event.timeText}</p>

        <div className="mt-10">
          <Countdown targetISO={event.dateISO} />
        </div>

        <div className="mt-10">
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

        <div className="mt-10 flex items-center justify-center">
          <Link to="/confirmar" className="btn">
            Confirmar asistencia
          </Link>
        </div>
      </div>
    </section>
  )
}
