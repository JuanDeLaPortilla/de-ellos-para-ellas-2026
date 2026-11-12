import { Outlet, useLocation } from 'react-router-dom'
import { FloralDefs } from './decor/Flora.jsx'
import Petals from './decor/Petals.jsx'
import MusicToggle from './MusicToggle.jsx'
import { MusicProvider } from '../lib/music.jsx'

export default function Layout() {
  // The photo wall is projected on a wall-sized screen, so it uses the full width.
  const wide = useLocation().pathname.replace(/\/+$/, '').endsWith('/mural')
  return (
    <MusicProvider>
      <div className="relative min-h-screen">
        <FloralDefs />
        <Petals />
        <main className={`relative z-10 mx-auto w-full px-5 pt-10 pb-24 ${wide ? 'max-w-none lg:px-12 2xl:px-20' : 'max-w-4xl'}`}>
          <Outlet />
        </main>
        <MusicToggle />
      </div>
    </MusicProvider>
  )
}
