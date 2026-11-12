import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Invitación', end: true },
  { to: '/confirmar', label: 'Confirmar' },
  { to: '/mural', label: 'Mural' },
]

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-rose/30 bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3" aria-label="Principal">
        <span className="font-script text-2xl text-plum">De ellos para ellas</span>
        <ul className="flex items-center gap-4 text-sm tracking-wide sm:gap-6">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `pb-1 transition hover:text-plum ${isActive ? 'border-b border-gold text-plum' : 'text-ink/70'}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
