import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { auth, db } from './firebase.js'

const SESSION_KEY = 'redeemedSessionUid'

/** Remembers (per tab) that the anonymous user `uid` redeemed a valid code. */
export function markSessionRedeemed(uid) {
  try {
    sessionStorage.setItem(SESSION_KEY, uid)
  } catch {
    // Storage can be unavailable (private mode); the unlock then lasts only until reload.
  }
}

function isSessionRedeemed(uid) {
  try {
    return sessionStorage.getItem(SESSION_KEY) === uid
  } catch {
    return false
  }
}

// `admins` is not readable from the client, so ask the rules indirectly:
// only an admin can read `rsvps`; anyone else gets permission-denied.
async function canReadRsvps() {
  try {
    await getDocs(query(collection(db, 'rsvps'), limit(1)))
    return true
  } catch {
    return false
  }
}

const SIGNED_OUT = { status: 'ready', user: null, isAdmin: false, hasSession: false }

/**
 * Tracks the Firebase Auth user.
 * - isAdmin: signed in with email/password and allowed to read `rsvps`.
 * - hasSession: anonymous user that redeemed a code in this tab.
 * `status` is 'loading' until the first auth state is resolved.
 */
export function useAuthUser() {
  const [state, setState] = useState(
    auth ? { status: 'loading', user: null, isAdmin: false, hasSession: false } : SIGNED_OUT,
  )

  useEffect(() => {
    if (!auth) return undefined

    let cancelled = false
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) setState(SIGNED_OUT)
        return
      }
      const isAdmin = user.isAnonymous ? false : await canReadRsvps()
      const hasSession = user.isAnonymous && isSessionRedeemed(user.uid)
      if (!cancelled) setState({ status: 'ready', user, isAdmin, hasSession })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return state
}
