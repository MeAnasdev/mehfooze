/**
 * Client-side photo upload for pollution reports.
 * Compresses the image in-browser (max 1280px, JPEG 0.7) before uploading to
 * Firebase Storage, then returns the public download URL for the backend.
 *
 * Keeps uploads small (Firebase free tier: 5 GB) and fast on mobile networks.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.7

/** Compress a File/Blob to a JPEG Blob within MAX_DIMENSION. */
export async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  let { width, height } = img
  if (width > height && width > MAX_DIMENSION) {
    height = Math.round((height * MAX_DIMENSION) / width)
    width = MAX_DIMENSION
  } else if (height > MAX_DIMENSION) {
    width = Math.round((width * MAX_DIMENSION) / height)
    height = MAX_DIMENSION
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

/**
 * Upload a pollution report photo to Firebase Storage.
 * Returns the download URL, or null if upload fails (report can still submit
 * without a photo).
 */
export async function uploadReportPhoto(file: File, userId: string): Promise<string | null> {
  try {
    const compressed = await compressImage(file)
    const filename = `reports/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const storageRef = ref(storage, filename)
    await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' })
    return await getDownloadURL(storageRef)
  } catch (err) {
    console.error('Report photo upload failed:', err)
    return null
  }
}
