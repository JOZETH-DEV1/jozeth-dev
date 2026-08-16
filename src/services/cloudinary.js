// src/services/cloudinary.js
// Sube imágenes directo desde el navegador usando un "unsigned upload preset".
// Esto es seguro de hacer en frontend: el preset no lleva permisos de borrado
// ni acceso a tu cuenta, solo permite subir a una carpeta predefinida.
// Configura el preset en Cloudinary con restricciones (formato, tamaño máx, carpeta).

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD
const PRESET     = import.meta.env.VITE_CLOUDINARY_PRESET

export function validateImageFile(file) {
  if (!file) throw new Error('No se seleccionó imagen')
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) throw new Error('Formato no soportado (usa JPG, PNG, WEBP o GIF)')
  if (file.size > 10 * 1024 * 1024) throw new Error('La imagen pesa más de 10MB')
  return true
}

export async function uploadImage(file, folder = 'posts') {
  if (!CLOUD_NAME || !PRESET) throw new Error('Cloudinary no está configurado.')
  validateImageFile(file)

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)
  form.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Error al subir la imagen')
  }
  const data = await res.json()
  return {
    url:      data.secure_url,
    publicId: data.public_id,
    width:    data.width,
    height:   data.height,
  }
}

// Genera una URL con transformación (thumbnail optimizado) sin llamar a la API
export function cloudinaryThumb(url, { w = 400, h = 400, crop = 'fill' } = {}) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/w_${w},h_${h},c_${crop},q_auto,f_auto/`)
}
