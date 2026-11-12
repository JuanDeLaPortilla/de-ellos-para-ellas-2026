import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

/**
 * Saves an RSVP keyed by the normalized email.
 * Returns `{ created: true }` when the document is new, or
 * `{ created: false }` when an existing RSVP was updated.
 */
export async function saveRsvp({ firstName, lastName, age, email, attending }) {
  const normalizedEmail = normalizeEmail(email)
  const ref = doc(db, 'rsvps', normalizedEmail)
  const fields = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    age,
    attending,
  }

  try {
    await setDoc(ref, {
      ...fields,
      email: normalizedEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { created: true, email: normalizedEmail }
  } catch (error) {
    // The rules reject a create when the document already exists: fall back to an update.
    if (error.code !== 'permission-denied') throw error
    await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() })
    return { created: false, email: normalizedEmail }
  }
}
