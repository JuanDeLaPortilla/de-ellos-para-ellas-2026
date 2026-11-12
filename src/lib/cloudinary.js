import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.js'

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const cloudinaryReady = Boolean(cloudName && uploadPreset)

const MAX_SIDE = 1600

/** Downscales an image so its longest side is at most MAX_SIDE px; returns a JPEG blob. */
export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image'))), 'image/jpeg', 0.85)
  })
}

/** Uploads a blob with the unsigned preset and returns `{ url, publicId }`. */
async function uploadToCloudinary(blob) {
  const body = new FormData()
  body.append('file', blob)
  body.append('upload_preset', uploadPreset)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  })
  if (!response.ok) throw new Error('Cloudinary upload failed')
  const data = await response.json()
  return { url: data.secure_url, publicId: data.public_id }
}

/** Resizes, uploads and registers a photo in Firestore. */
export async function uploadPhoto(file, authorName) {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured')
  const blob = await resizeImage(file)
  const { url, publicId } = await uploadToCloudinary(blob)
  await addDoc(collection(db, 'photos'), {
    url,
    publicId,
    authorName,
    createdAt: serverTimestamp(),
  })
}
