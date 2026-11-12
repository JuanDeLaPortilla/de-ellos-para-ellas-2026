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

        <div className="mt-12">
          <p className="text-sm tracking-[0.3em] text-plum-soft uppercase">Lugar</p>
          <p className="mt-2 font-display text-3xl text-ink">{event.venue.name}</p>
          <a className="btn-outline mt-5" href={event.venue.mapUrl} target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/confirmar" className="btn">
            Confirmar asistencia
          </Link>
          <Link to="/mural" className="btn-outline">
            Ver el mural
          </Link>
        </div>
      </div>
    </section>
  )
}
