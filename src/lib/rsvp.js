import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// No 0, O, 1 or I so codes are easy to read aloud and type.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export function generateCode() {
  // The alphabet has 32 symbols and 256 is a multiple of 32, so `byte % 32` is unbiased.
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')
}

/**
 * Saves an RSVP keyed by the normalized email.
 * Returns `{ created: true, code }` when the document is new, or
 * `{ created: false }` when an existing RSVP was updated (code untouched).
 */
export async function saveRsvp({ firstName, lastName, age, email, attending }) {
  const normalizedEmail = normalizeEmail(email)
  const ref = doc(db, 'rsvps', normalizedEmail)
  const code = generateCode()
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
      code,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { created: true, code, email: normalizedEmail }
  } catch (error) {
    // The rules reject a create when the document already exists: fall back to an update.
    if (error.code !== 'permission-denied') throw error
    await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() })
    return { created: false, email: normalizedEmail }
  }
}
