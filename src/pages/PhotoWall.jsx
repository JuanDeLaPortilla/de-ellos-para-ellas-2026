import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useSearchParams } from 'react-router-dom'
import { FloralDivider } from '../components/decor/Flora.jsx'
import PhotoUploadModal from '../components/PhotoUploadModal.jsx'
import { db, firebaseReady } from '../lib/firebase.js'
import { useAuthUser } from '../lib/useAuthUser.js'

const ADMIN_AUTHOR = 'Organizadores'
const COLUMN_WIDTH = 272
const GAP = 12

// Number of fixed-width columns that fit in the element, so leftover space can be centered.
function useColumnCount(ref) {
  const [count, setCount] = useState(2)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const update = () => setCount(Math.max(2, Math.floor((el.clientWidth + GAP) / (COLUMN_WIDTH + GAP))))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return count
}

export default function PhotoWall() {
  const { status, isAdmin, hasSession } = useAuthUser()
  // Set right after a successful redeem, before the auth hook re-reads the session.
  const [redeemed, setRedeemed] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  // A code in the link (/mural?codigo=XXXX, e.g. from a QR) is used by the modal without showing the field; it is never redeemed by itself.
  const linkCode = useSearchParams()[0].get('codigo')?.trim() ?? ''
  const [linkHandled, setLinkHandled] = useState(false)

  const canUpload = isAdmin || hasSession || redeemed

  // Opens the modal once, after auth has settled, only if the visitor cannot upload yet.
  if (firebaseReady && linkCode && !linkHandled && status !== 'loading') {
    setLinkHandled(true)
    if (!canUpload) setUploadOpen(true)
  }

  if (!firebaseReady) {
    return (
      <section className="card text-center">
        <h1 className="heading">Mural de fotos</h1>
        <p className="mt-4">El mural aún no está disponible. Vuelve a intentarlo en unos días.</p>
      </section>
    )
  }


  return (
    <div className="grid gap-8 2xl:gap-14">
      <div className="text-center">
        <h1 className="heading">Mural de fotos</h1>
        <FloralDivider width={240} className="mt-3" />
        <p className="mt-4">Toca el botón + para subir tus fotos.</p>
      </div>

      <Gallery />

      {/* Sits above the music button (bottom-4, 48px) so the two never overlap. */}
      <button
        type="button"
        aria-label="Subir una foto"
        onClick={() => setUploadOpen(true)}
        className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex h-12 w-12 items-center justify-center rounded-full border border-gold bg-plum text-paper shadow-lg transition hover:bg-plum-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {uploadOpen && (
        <PhotoUploadModal
          onClose={() => setUploadOpen(false)}
          canUpload={canUpload}
          authLoading={status === 'loading'}
          authorName={isAdmin ? ADMIN_AUTHOR : null}
          onRedeemed={() => setRedeemed(true)}
          initialCode={linkCode}
        />
      )}
    </div>
  )
}

function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loaded, setLoaded] = useState(false)
  const listRef = useRef(null)
  const columnCount = useColumnCount(listRef)

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        setPhotos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoaded(true)
      },
      () => setLoaded(true),
    )
  }, [])

  if (loaded && photos.length === 0) {
    return <p className="text-center">Todavía no hay fotos. ¡Sé la primera en subir una!</p>
  }

  // Round-robin keeps the newest-first order reading left to right, row by row.
  const columns = Array.from({ length: columnCount }, () => [])
  photos.forEach((photo, i) => columns[i % columnCount].push(photo))
  // Below `sm` the layout is two fluid columns; from `sm` on, fixed-width columns centered.
  return (
    <div ref={listRef} className="flex justify-center gap-3">
      {columns.filter((column) => column.length > 0).map((column, i) => (
        <ul key={i} className="flex w-[calc(50%-0.375rem)] flex-none flex-col gap-3 sm:w-68">
          {column.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-2xl border border-rose/30 bg-paper">
              <img src={photo.url} alt={`Foto de ${photo.authorName}`} loading="lazy" className="w-full" />
              <p className="px-3 py-2 text-xs text-plum-soft">{photo.authorName}</p>
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}
