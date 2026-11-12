import { useEffect, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { FloralDivider } from '../components/decor/Flora.jsx'
import { auth, db, firebaseReady } from '../lib/firebase.js'
import { normalizeEmail } from '../lib/rsvp.js'
import { cloudinaryReady, uploadPhoto } from '../lib/cloudinary.js'
import { markSessionRedeemed, useAuthUser } from '../lib/useAuthUser.js'

const ADMIN_AUTHOR = 'Organizadores'

export default function PhotoWall() {
  const { status, isAdmin, hasSession } = useAuthUser()
  // Set right after a successful redeem, before the auth hook re-reads the session.
  const [redeemedName, setRedeemedName] = useState(null)

  if (!firebaseReady) {
    return (
      <section className="card text-center">
        <h1 className="heading">Mural de fotos</h1>
        <p className="mt-4">El mural aún no está disponible. Vuelve a intentarlo en unos días.</p>
      </section>
    )
  }

  const canUpload = isAdmin || hasSession || redeemedName !== null
  const authorName = isAdmin ? ADMIN_AUTHOR : (redeemedName ?? 'Invitada')

  return (
    <div className="grid gap-8">
      <section className="card text-center">
        <h1 className="heading">Mural de fotos</h1>
        <FloralDivider width={240} className="mt-3" />
        <p className="mt-4">Los recuerdos de la noche, compartidos por todas.</p>

        <div className="mt-8">
          {status === 'loading' ? (
            <p>Cargando…</p>
          ) : canUpload ? (
            <PhotoUploader authorName={authorName} />
          ) : (
            <RedeemForm onRedeemed={setRedeemedName} />
          )}
        </div>
      </section>

      <Gallery />
    </div>
  )
}

function RedeemForm({ onRedeemed }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [state, setState] = useState('idle') // idle | checking | error

  async function handleSubmit(e) {
    e.preventDefault()
    setState('checking')
    try {
      const credential = auth.currentUser ?? (await signInAnonymously(auth)).user
      await setDoc(doc(db, 'sessions', credential.uid), {
        email: normalizeEmail(email),
        code: code.trim().toUpperCase(),
        createdAt: serverTimestamp(),
      })
      markSessionRedeemed(credential.uid)
      onRedeemed(name.trim() || 'Invitada')
    } catch {
      // The rules reject wrong codes, unknown emails and guests who are not attending.
      setState('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-md gap-4 text-left">
      <p className="text-center">
        Si confirmaste tu asistencia, escribe tu correo y el código que te enviamos para subir fotos.
      </p>
      <label className="grid gap-1">
        <span className="text-sm tracking-wide text-plum-soft uppercase">Tu nombre</span>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="given-name"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm tracking-wide text-plum-soft uppercase">Correo electrónico</span>
        <input
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm tracking-wide text-plum-soft uppercase">Código de acceso</span>
        <input
          className="field tracking-[0.3em] uppercase"
          required
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
        />
      </label>
      {state === 'error' && (
        <p role="alert" className="rounded-xl bg-rose-pale p-3 text-center text-sm text-red-800">
          El correo o el código no son correctos, o aún no has confirmado tu asistencia.
        </p>
      )}
      <button className="btn" type="submit" disabled={state === 'checking'}>
        {state === 'checking' ? 'Verificando…' : 'Desbloquear subida'}
      </button>
    </form>
  )
}

function PhotoUploader({ authorName }) {
  const inputRef = useRef(null)
  const [state, setState] = useState('idle') // idle | uploading | done | error

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setState('uploading')
    try {
      await uploadPhoto(file, authorName)
      setState('done')
    } catch {
      setState('error')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (!cloudinaryReady) {
    return <p>La subida de fotos aún no está disponible.</p>
  }

  return (
    <div className="grid justify-items-center gap-3">
      <input
        ref={inputRef}
        id="photo-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
        disabled={state === 'uploading'}
      />
      <label htmlFor="photo-input" className={`btn cursor-pointer ${state === 'uploading' ? 'opacity-60' : ''}`}>
        {state === 'uploading' ? 'Subiendo…' : 'Subir una foto'}
      </label>
      <p aria-live="polite" className="text-sm">
        {state === 'done' && '¡Listo! Tu foto ya está en el mural.'}
        {state === 'error' && 'No pudimos subir la foto. Inténtalo de nuevo.'}
        {state === 'idle' && `Publicarás como «${authorName}».`}
      </p>
    </div>
  )
}

function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loaded, setLoaded] = useState(false)

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

  return (
    <ul className="columns-2 gap-3 sm:columns-3">
      {photos.map((photo) => (
        <li key={photo.id} className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-rose/30 bg-paper">
          <img src={photo.url} alt={`Foto de ${photo.authorName}`} loading="lazy" className="w-full" />
          <p className="px-3 py-2 text-xs text-plum-soft">{photo.authorName}</p>
        </li>
      ))}
    </ul>
  )
}
