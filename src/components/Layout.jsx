import { Outlet } from 'react-router-dom'
import { FloralDefs } from './decor/Flora.jsx'
import Petals from './decor/Petals.jsx'
import MusicToggle from './MusicToggle.jsx'
import { MusicProvider } from '../lib/music.jsx'

export default function Layout() {
  return (
    <MusicProvider>
      <div className="relative min-h-screen">
        <FloralDefs />
        <Petals />
        <main className="relative z-10 mx-auto w-full max-w-4xl px-5 pt-10 pb-24">
          <Outlet />
        </main>
        <MusicToggle />
      </div>
    </MusicProvider>
  )
}
