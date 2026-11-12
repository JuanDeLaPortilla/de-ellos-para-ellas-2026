import { useEffect, useId, useRef, useState } from 'react'
import { FloralDivider } from './decor/Flora.jsx'
import { firebaseReady } from '../lib/firebase.js'
import { saveRsvp } from '../lib/rsvp.js'
import { emailReady, sendConfirmation } from '../lib/email.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Modal exit animation length; keep in sync with `modal-out` in src/index.css. */
const CLOSE_MS = 220
/** Texts cascade in after the dialog itself starts appearing, like the invitation card. */
const CASCADE_START = 0.2
const CASCADE_STEP = 0.08
const delay = (index) => ({ animationDelay: `${CASCADE_START + index * CASCADE_STEP}s` })

const emptyForm = { firstName: '', lastName: '', age: '', email: '', attending: '' }

function validate(form) {
  const errors = {}
  if (!form.firstName.trim()) errors.firstName = 'Escribe tu nombre.'
  if (!form.lastName.trim()) errors.lastName = 'Escribe tu apellido.'
  const age = Number(form.age)
  if (form.age === '' || !Number.isInteger(age) || age < 5 || age > 99) {
    errors.age = 'La edad debe ser un número entero entre 5 y 99.'
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Escribe un correo válido.'
  if (form.attending === '') errors.attending = 'Cuéntanos si podrás venir.'
  return errors
}

/**
 * RSVP form in a native modal dialog. It is mounted only while open, so closing it discards the form.
 * `onClose` unmounts it; the modal calls it after any allowed close.
 */
export default function RsvpModal({ onClose }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [result, setResult] = useState(null)
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

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const hasData = Object.keys(emptyForm).some((key) => form[key] !== emptyForm[key])

  function requestClose() {
    if (status === 'sending' || closing) return
    if (status === 'success' || !hasData) {
      finish()
      return
    }
    setConfirmingDiscard(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus('sending')
    try {
      const attending = form.attending === 'yes'
      const saved = await saveRsvp({
        firstName: form.firstName,
        lastName: form.lastName,
        age: Number(form.age),
        email: form.email,
        attending,
      })

      // The email is only sent when the RSVP is created, never on update.
      let emailSent = false
      if (saved.created && emailReady) {
        try {
          await sendConfirmation({ email: saved.email, firstName: form.firstName.trim() })
          emailSent = true
        } catch {
          emailSent = false
        }
      }
      setResult({ attending, created: saved.created, emailSent, emailAttempted: saved.created })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const sending = status === 'sending'

  let content
  if (confirmingDiscard) {
    content = (
      <div className="text-center" role="alertdialog" aria-labelledby={titleId}>
        <h2 id={titleId} className="heading animate-text-in" style={delay(0)}>
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
    )
  } else if (!firebaseReady) {
    content = (
      <div className="text-center">
        <h2 id={titleId} className="heading animate-text-in" style={delay(0)}>
          Confirmar asistencia
        </h2>
        <p className="mt-4 animate-text-in" style={delay(1)}>
          La confirmación aún no está disponible. Vuelve a intentarlo en unos días.
        </p>
      </div>
    )
  } else if (status === 'success') {
    content = (
      <div className="text-center" aria-live="polite">
        <h2 id={titleId} className="heading animate-text-in" style={delay(0)}>
          {result.attending ? '¡Gracias por confirmar!' : 'Gracias por avisarnos'}
        </h2>
        <div className="animate-text-in" style={delay(1)}>
          <FloralDivider width={240} className="mt-3" />
        </div>
        {result.attending ? (
          <>
            <p className="mt-6 animate-text-in" style={delay(2)}>
              Te esperamos con mucho cariño.
            </p>
            {result.emailAttempted &&
              (result.emailSent ? (
                <p className="mt-3 animate-text-in" style={delay(3)}>
                  Te enviamos un correo de confirmación. Revisa también la carpeta de spam.
                </p>
              ) : (
                <p className="mt-3 animate-text-in" style={delay(3)}>
                  No pudimos enviar el correo de confirmación.
                </p>
              ))}
            {!result.created && (
              <p className="mt-3 animate-text-in" style={delay(4)}>
                Actualizamos tu confirmación.
              </p>
            )}
          </>
        ) : (
          <p className="mt-6 animate-text-in" style={delay(2)}>
            Lamentamos que no puedas venir. Si cambias de opinión, vuelve a confirmar aquí.
          </p>
        )}
        <button type="button" className="btn mt-8 animate-text-in" style={delay(5)} onClick={finish}>
          Cerrar
        </button>
      </div>
    )
  } else {
    content = (
      <>
        <h2 id={titleId} className="heading text-center animate-text-in" style={delay(0)}>
          Confirmar asistencia
        </h2>
        <div className="animate-text-in" style={delay(1)}>
          <FloralDivider width={240} className="mt-3" />
        </div>
        <p className="mt-4 text-center animate-text-in" style={delay(2)}>
          Si ya confirmaste y quieres cambiar tu respuesta, vuelve a enviar el formulario con el mismo correo.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mx-auto mt-8 grid max-w-xl gap-5">
          <div className="grid gap-5 animate-text-in sm:grid-cols-2" style={delay(3)}>
            <Field label="Nombre" error={errors.firstName}>
              <input
                className="field"
                value={form.firstName}
                onChange={update('firstName')}
                autoComplete="given-name"
                maxLength={60}
              />
            </Field>
            <Field label="Apellido" error={errors.lastName}>
              <input
                className="field"
                value={form.lastName}
                onChange={update('lastName')}
                autoComplete="family-name"
                maxLength={60}
              />
            </Field>
          </div>

          <div className="grid gap-5 animate-text-in items-start sm:grid-cols-[8rem_1fr]" style={delay(4)}>
            <Field label="Edad" error={errors.age}>
              <input
                className="field"
                type="number"
                inputMode="numeric"
                min={5}
                max={99}
                value={form.age}
                onChange={update('age')}
              />
            </Field>
            <Field label="Correo electrónico" error={errors.email}>
              <input
                className="field"
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                maxLength={120}
              />
            </Field>
          </div>

          <fieldset className="animate-text-in" style={delay(5)}>
            <legend className="mb-2 text-sm tracking-wide text-plum-soft uppercase">¿Podrás asistir?</legend>
            <div className="flex gap-6">
              {[
                { value: 'yes', label: 'Sí, ahí estaré' },
                { value: 'no', label: 'No podré' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="attending"
                    value={option.value}
                    checked={form.attending === option.value}
                    onChange={update('attending')}
                    className="accent-plum"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {errors.attending && <p className="mt-1 text-sm text-red-700">{errors.attending}</p>}
          </fieldset>

          {status === 'error' && (
            <p role="alert" className="rounded-xl bg-rose-pale p-3 text-center text-sm text-red-800">
              No pudimos guardar tu confirmación. Revisa tu conexión e inténtalo de nuevo.
            </p>
          )}

          <button className="btn mt-2 animate-text-in" style={delay(6)} type="submit" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar confirmación'}
          </button>
        </form>
      </>
    )
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
      className="modal-dialog m-auto w-[calc(100%-2rem)] max-w-2xl bg-transparent p-0 backdrop:bg-plum/60"
    >
      <div className="card relative max-h-[90dvh] overflow-y-auto">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={requestClose}
          disabled={sending || closing}
          className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full text-plum transition hover:bg-rose-pale disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {content}
      </div>
    </dialog>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="grid content-start gap-1">
      <span className="text-sm tracking-wide text-plum-soft uppercase">{label}</span>
      {children}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </label>
  )
}
