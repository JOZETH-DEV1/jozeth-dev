// src/services/archive.js
// La subida de archivos pesados (APK/mods) pasa por nuestro Worker/Function,
// que reenvía el archivo a Archive.org usando credenciales guardadas como
// secrets de Cloudflare. El navegador nunca ve esas credenciales — solo
// habla con nuestro propio dominio, así que no hay CORS y la key nunca
// puede filtrarse por el bundle de JS.

const API_URL = import.meta.env.VITE_API_URL || '/api'

export function validateApkFile(file) {
  if (!file) throw new Error('No se seleccionó archivo')
  const MAX = 4 * 1024 * 1024 * 1024 // 4GB — límite práctico razonable
  if (file.size > MAX) throw new Error(`El archivo pesa ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB — máximo 4GB`)
  const allowed = ['apk', 'zip', 'rar', '7z', 'apks', 'xapk', 'tar', 'gz', 'mcpack', 'mcworld', 'mcaddon']
  const ext = file.name.split('.').pop().toLowerCase()
  if (!allowed.includes(ext)) throw new Error(`Formato .${ext} no soportado`)
  return true
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

// Sube el archivo al Worker (que a su vez lo manda a Archive.org).
// onProgress(pct, label) reporta el avance real de la subida al Worker.
export async function uploadToArchive(file, idToken, onProgress) {
  validateApkFile(file)
  onProgress?.(5, `📦 Preparando subida de ${formatBytes(file.size)}...`)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable) return
      const pct = Math.round((e.loaded / e.total) * 90) + 5
      onProgress?.(pct, `📦 Subiendo ${formatBytes(e.loaded)} / ${formatBytes(e.total)}...`)
    })

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
          onProgress?.(100, '✅ ¡Subida completa!')
          resolve({ url: data.url, identifier: data.identifier })
        } else {
          reject(new Error(data.error || `Error del servidor (${xhr.status})`))
        }
      } catch {
        reject(new Error('Respuesta inválida del servidor'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Error de red al subir el archivo')))

    xhr.open('POST', `${API_URL}/upload`)
    if (idToken) xhr.setRequestHeader('Authorization', `Bearer ${idToken}`)
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name))
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}
