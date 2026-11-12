import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db, firebaseReady } from '../lib/firebase.js'
import { useAuthUser } from '../lib/useAuthUser.js'

export default function Admin() {
  const { status, user, isAdmin } = useAuthUser()

  if (!firebaseReady) {
    return (
      <section className="card text-center">
        <h1 className="heading">Administración</h1>
        <p className="mt-4">Firebase no está configurado.</p>
      </section>
    )
  }

  if (status === 'loading') return <p className="text-center">Cargando…</p>

  // Anonymous guests (code redeemers) are not admins and must log in with their own account.
  if (!user || user.isAnonymous) return <LoginForm />

  if (!isAdmin) {
    return (
      <section className="card text-center">
        <h1 className="heading">Administración</h1>
        <p className="mt-4">Esta cuenta no tiene permisos de administración.</p>
        <button className="btn-outline mt-6" onClick={() => signOut(auth)}>
          Cerrar sesión
        </button>
      </section>
    )
  }

  return <RsvpTable />
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState('idle') // idle | checking | error

  async function handleSubmit(e) {
    e.preventDefault()
    setState('checking')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch {
      setState('error')
    }
  }

  return (
    <section className="card mx-auto max-w-md">
      <h1 className="heading text-center">Administración</h1>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm tracking-wide text-plum-soft uppercase">Correo</span>
          <input
            className="field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm tracking-wide text-plum-soft uppercase">Contraseña</span>
          <input
            className="field"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {state === 'error' && (
          <p role="alert" className="rounded-xl bg-rose-pale p-3 text-center text-sm text-red-800">
            Credenciales incorrectas.
          </p>
        )}
        <button className="btn" type="submit" disabled={state === 'checking'}>
          {state === 'checking' ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}

function RsvpTable() {
  const [rsvps, setRsvps] = useState([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => setRsvps(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setFailed(true),
    )
  }, [])

  const yes = rsvps.filter((r) => r.attending).length
  const no = rsvps.length - yes

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading">Confirmaciones</h1>
        <button className="btn-outline" onClick={() => signOut(auth)}>
          Cerrar sesión
        </button>
      </div>

      {failed && <p role="alert" className="mt-4 text-red-800">No se pudieron cargar las confirmaciones.</p>}

      <p className="mt-4 flex gap-6 font-display text-2xl text-plum">
        <span>Sí: {yes}</span>
        <span>No: {no}</span>
        <span>Total: {rsvps.length}</span>
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-plum/30 text-xs tracking-wide text-plum-soft uppercase">
            <tr>
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Edad</th>
              <th className="py-2 pr-4">Correo</th>
              <th className="py-2">Asistirá</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.map((r) => (
              <tr key={r.id} className="border-b border-rose/30">
                <td className="py-2 pr-4">
                  {r.firstName} {r.lastName}
                </td>
                <td className="py-2 pr-4">{r.age}</td>
                <td className="py-2 pr-4">{r.email}</td>
                <td className="py-2">{r.attending ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
