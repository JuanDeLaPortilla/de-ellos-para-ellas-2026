import { useEffect, useId, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase.js'
import { cloudinaryReady, uploadPhoto } from '../lib/cloudinary.js'
import { markSessionRedeemed } from '../lib/useAuthUser.js'

/** Modal exit animation length; keep in sync with `modal-out` in src/index.css. */
const CLOSE_MS = 220
/** Texts cascade in after the dialog itself starts appearing, like the invitation card. */
const CASCADE_START = 0.2
const CASCADE_STEP = 0.08
const delay = (index) => ({ animationDelay: `${CASCADE_START + index * CASCADE_STEP}s` })
/** Photos uploaded per selection; the rest are skipped to spare the phone's memory and time. */
const MAX_PHOTOS = 10
/** The guest's name is remembered on this device, so it comes pre-filled next time. */
const NAME_KEY = 'photo-author-name:v1'

function readName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // Storage can be unavailable (private mode); the name is then asked again next time.
  }
}

/**
 * Photo wall upload in a native modal dialog, a single form: name, event code (only if the visitor
 * has no session yet) and the photos. Submitting redeems the code if needed, then uploads.
 * `authorName` is a fixed author (the admin) that hides the name field.
 * `initialCode` is a code that came in the link: the field is hidden and the code is used as is,
 * unless the redeem fails, in which case the field appears empty so the guest can type another one.
 * Mounted only while open, so closing it discards what was typed and the upload state.
 * `onClose` unmounts it; the modal calls it after any allowed close.
 */
export default function PhotoUploadModal({ onClose, canUpload, authLoading, authorName, onRedeemed, initialCode = '' }) {
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

  const screen = authLoading ? (
    <p className="text-center animate-text-in" style={delay(2)}>
      Cargando…
    </p>
  ) : (
    <PhotoForm
      canUpload={canUpload}
      authorName={authorName}
      initialCode={initialCode}
      onRedeemed={onRedeemed}
      onBusyChange={setBusy}
      onDirtyChange={setDirty}
      onDone={finish}
    />
  )

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
            Subir fotos
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

function PhotoForm({ canUpload, authorName, initialCode, onRedeemed, onBusyChange, onDirtyChange, onDone }) {
  const inputRef = useRef(null)
  const [storedName] = useState(readName)
  const [name, setName] = useState(storedName)
  const [code, setCode] = useState(initialCode)
  const [showCode, setShowCode] = useState(initialCode === '')
  const [files, setFiles] = useState([])
  const [state, setState] = useState('idle') // idle | working | error
  const [phase, setPhase] = useState('checking') // checking | uploading
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  // What to tell the guest while the modal stays open: a wrong code, or failed/skipped photos.
  const [notice, setNotice] = useState(null)

  const needsCode = !canUpload
  const fixedAuthor = authorName != null
  const working = state === 'working'

  useReport(onBusyChange, working)
  useReport(
    onDirtyChange,
    files.length > 0 ||
      (!fixedAuthor && name !== storedName) ||
      (needsCode && showCode && code !== '' && code !== initialCode),
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (files.length === 0) return

    const selected = files.slice(0, MAX_PHOTOS)
    const skipped = files.length - selected.length
    const author = fixedAuthor ? authorName : name.trim()
    setNotice(null)
    setPhase('checking')
    setState('working')

    if (needsCode) {
      try {
        const credential = auth.currentUser ?? (await signInAnonymously(auth)).user
        await setDoc(doc(db, 'sessions', credential.uid), {
          code: code.trim().toUpperCase(),
          createdAt: serverTimestamp(),
        })
        markSessionRedeemed(credential.uid)
      } catch {
        // The rules reject a code that differs from config/photoWall (or a missing config document).
        if (!showCode) {
          setCode('')
          setShowCode(true)
        }
        setNotice({ kind: 'code' })
        setState('error')
        return
      }
      onRedeemed()
    }

    if (!fixedAuthor) saveName(author)
    setPhase('uploading')
    let failed = 0
    for (let i = 0; i < selected.length; i += 1) {
      setProgress({ done: i, total: selected.length })
      try {
        await uploadPhoto(selected[i], author)
      } catch {
        failed += 1
      }
    }

    if (inputRef.current) inputRef.current.value = ''
    setFiles([])
    if (failed === 0 && skipped === 0) {
      setState('idle')
      onDone()
      return
    }
    setNotice({ kind: 'summary', uploaded: selected.length - failed, total: selected.length, failed, skipped })
    setState('error')
  }

  if (!cloudinaryReady) {
    return (
      <p className="animate-text-in" style={delay(2)}>
        La subida de fotos aún no está disponible.
      </p>
    )
  }

  let hint = `Puedes elegir hasta ${MAX_PHOTOS} fotos.`
  if (files.length > MAX_PHOTOS) hint = `Elegiste ${files.length} fotos; solo se subirán las primeras ${MAX_PHOTOS}.`

  let buttonText = 'Subir fotos'
  if (working) {
    buttonText = phase === 'checking' ? 'Verificando…' : `Subiendo ${Math.min(progress.done + 1, progress.total)} de ${progress.total}…`
  }

  let message = hint
  if (notice?.kind === 'summary') {
    message = [
      notice.failed > 0
        ? `Se subieron ${notice.uploaded} de ${notice.total}. No pudimos subir ${notice.failed}; inténtalo de nuevo.`
        : `Se subieron ${notice.uploaded} de ${notice.total + notice.skipped}.`,
      notice.skipped > 0 && `Elegiste más de ${MAX_PHOTOS} fotos; las otras ${notice.skipped} no se subieron.`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 text-left">
      {!fixedAuthor && (
        <label className="grid gap-1 animate-text-in" style={delay(2)}>
          <span className="text-sm tracking-wide text-plum-soft uppercase">Tu nombre</span>
          <input
            className="field"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="given-name"
            disabled={working}
          />
        </label>
      )}
      {needsCode && showCode && (
        <label className="grid gap-1 animate-text-in" style={delay(3)}>
          <span className="text-sm tracking-wide text-plum-soft uppercase">Código del evento</span>
          <input
            className="field tracking-[0.3em] uppercase"
            required
            maxLength={12}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            disabled={working}
          />
        </label>
      )}

      <div className="grid justify-items-center gap-2 animate-text-in" style={delay(4)}>
        <input
          ref={inputRef}
          id="photo-input"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          disabled={working}
        />
        <label htmlFor="photo-input" className={`btn-outline cursor-pointer ${working ? 'opacity-60' : ''}`}>
          {files.length === 0 ? 'Elegir fotos' : `${files.length} ${files.length === 1 ? 'foto elegida' : 'fotos elegidas'}`}
        </label>
        <p aria-live="polite" className="text-center text-sm">
          {message}
        </p>
      </div>

      {notice?.kind === 'code' && (
        <p role="alert" className="rounded-xl bg-rose-pale p-3 text-center text-sm text-red-800">
          El código no es correcto. Revísalo e inténtalo de nuevo.
        </p>
      )}

      <button className="btn animate-text-in" style={delay(5)} type="submit" disabled={working || files.length === 0}>
        {buttonText}
      </button>
    </form>
  )
}
