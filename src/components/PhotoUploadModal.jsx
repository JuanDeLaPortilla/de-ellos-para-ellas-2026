import { useEffect, useId, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase.js'
import { normalizeEmail } from '../lib/rsvp.js'
import { cloudinaryReady, uploadPhoto } from '../lib/cloudinary.js'
import { markSessionRedeemed } from '../lib/useAuthUser.js'

/** Modal exit animation length; keep in sync with `modal-out` in src/index.css. */
const CLOSE_MS = 220
/** Texts cascade in after the dialog itself starts appearing, like the invitation card. */
const CASCADE_START = 0.2
const CASCADE_STEP = 0.08
const delay = (index) => ({ animationDelay: `${CASCADE_START + index * CASCADE_STEP}s` })

/**
 * Photo wall upload in a native modal dialog: redeem the access code, then upload photos.
 * Mounted only while open, so closing it discards what was typed and the upload state.
 * `onClose` unmounts it; the modal calls it after any allowed close.
 */
export default function PhotoUploadModal({ onClose, canUpload, authLoading, authorName, onRedeemed }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef(null)

  // showModal() gives focus trapping and the top layer; close() on unmount returns focus to the opener.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
    return () => dialog.close()
  }, [])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Plays the exit animation, then unmounts through `onClose`.
  function finish() {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(onClose, CLOSE_MS)
  }

  function requestClose() {
    if (busy || closing) return
    if (!dirty) {
      finish()
      return
    }
    setConfirmingDiscard(true)
  }

  let screen
  if (authLoading) {
    screen = (
      <p className="text-center animate-text-in" style={delay(2)}>
        Cargando…
      </p>
    )
  } else if (canUpload) {
    screen = <PhotoUploader authorName={authorName} onBusyChange={setBusy} />
  } else {
    screen = <RedeemForm onRedeemed={onRedeemed} onBusyChange={setBusy} onDirtyChange={setDirty} />
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        requestClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
      data-closing={closing}
      className="modal-dialog modal-fullscreen m-auto bg-transparent p-0 backdrop:bg-plum/60 sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-2xl"
    >
      <div className="card relative h-full overflow-y-auto rounded-none border-0 sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl sm:border">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={requestClose}
          disabled={busy || closing}
          className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full text-plum transition hover:bg-rose-pale disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {confirmingDiscard && (
          <div className="mx-auto max-w-md text-center" role="alertdialog" aria-labelledby={`${titleId}-discard`}>
            <h2 id={`${titleId}-discard`} className="heading animate-text-in" style={delay(0)}>
              ¿Descartar lo escrito?
            </h2>
            <p className="mt-4 animate-text-in" style={delay(1)}>
              Si cierras ahora, se perderán los datos que escribiste.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 animate-text-in" style={delay(2)}>
              <button type="button" className="btn" onClick={() => setConfirmingDiscard(false)}>
                Seguir editando
              </button>
              <button type="button" className="btn-outline" onClick={finish}>
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Kept mounted (only hidden) while the discard prompt shows, so "Seguir editando" keeps the data. */}
        <div hidden={confirmingDiscard} className="mx-auto max-w-md text-center">
          <h2 id={titleId} className="heading animate-text-in" style={delay(0)}>
            Subir una foto
          </h2>
          <div className="mt-8">{screen}</div>
        </div>
      </div>
    </dialog>
  )
}

/** Reports a boolean to the parent while mounted, and resets it to false on unmount. */
function useReport(callback, value) {
  useEffect(() => {
    callback?.(value)
    return () => callback?.(false)
  }, [callback, value])
}

function RedeemForm({ onRedeemed, onBusyChange, onDirtyChange }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [state, setState] = useState('idle') // idle | checking | error

  useReport(onBusyChange, state === 'checking')
  useReport(onDirtyChange, name !== '' || email !== '' || code !== '')

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
    <form onSubmit={handleSubmit} className="grid gap-4 text-left">
      <p className="text-center animate-text-in" style={delay(2)}>
        Si confirmaste tu asistencia, escribe tu correo y el código que te enviamos para subir fotos.
      </p>
      <label className="grid gap-1 animate-text-in" style={delay(3)}>
        <span className="text-sm tracking-wide text-plum-soft uppercase">Tu nombre</span>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="given-name"
        />
      </label>
      <label className="grid gap-1 animate-text-in" style={delay(4)}>
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
      <label className="grid gap-1 animate-text-in" style={delay(5)}>
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
      <button className="btn animate-text-in" style={delay(6)} type="submit" disabled={state === 'checking'}>
        {state === 'checking' ? 'Verificando…' : 'Desbloquear subida'}
      </button>
    </form>
  )
}

function PhotoUploader({ authorName, onBusyChange }) {
  const inputRef = useRef(null)
  const [state, setState] = useState('idle') // idle | uploading | done | error

  useReport(onBusyChange, state === 'uploading')

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
    return (
      <p className="animate-text-in" style={delay(2)}>
        La subida de fotos aún no está disponible.
      </p>
    )
  }

  return (
    <div className="grid justify-items-center gap-3 animate-text-in" style={delay(2)}>
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
