// functions/api/upload.js
//
// Cloudflare Pages Function — recibe el archivo del navegador (streaming, sin
// cargarlo entero en memoria) y lo reenvía a Archive.org usando las
// credenciales guardadas como variables secretas del proyecto en Cloudflare
// (Settings → Environment variables → Encrypt). Nunca llegan al navegador.
//
// Requiere, en el proyecto de Cloudflare Pages, las variables:
//   ARCHIVE_ACCESS_KEY   (secret)
//   ARCHIVE_SECRET_KEY   (secret)
//   FIREBASE_PROJECT_ID  (texto plano, para validar el token del usuario)

function generateIdentifier(filename) {
  const normalized = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const clean = normalized.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const safe = clean.length >= 3 ? clean : 'app'
  return `jozethdev-${safe}-${Date.now()}`
}

function getContentType(filename, fallback) {
  const ext = filename.split('.').pop().toLowerCase()
  const types = {
    apk: 'application/vnd.android.package-archive',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  }
  return types[ext] || fallback || 'application/octet-stream'
}

// Verifica el ID token de Firebase Auth contra el endpoint público de Google.
// Evita que alguien anónimo use este endpoint como proxy gratuito de subida.
async function verifyFirebaseToken(idToken, projectId) {
  if (!idToken) return null
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${projectId}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
    )
    // La verificación completa de firma JWT no es viable sin librerías crypto
    // pesadas en el edge; en su lugar delegamos en el endpoint de Google,
    // que solo responde 200 si el token es válido y no ha expirado.
    if (!res.ok) return null
    const data = await res.json()
    return data?.users?.[0]?.localId || null
  } catch {
    return null
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name',
  }

  const authHeader = request.headers.get('Authorization') || ''
  const idToken = authHeader.replace(/^Bearer\s+/i, '')
  const uid = await verifyFirebaseToken(idToken, env.FIREBASE_PROJECT_ID)
  if (!uid) {
    return new Response(JSON.stringify({ ok: false, error: 'No autenticado' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  if (!env.ARCHIVE_ACCESS_KEY || !env.ARCHIVE_SECRET_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Archive.org no está configurado en el servidor' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  const rawName = request.headers.get('X-File-Name') || 'archivo.bin'
  const filename = decodeURIComponent(rawName)
  const contentLength = request.headers.get('Content-Length')
  const MAX_BYTES = 4 * 1024 * 1024 * 1024 // 4GB
  if (contentLength && Number(contentLength) > MAX_BYTES) {
    return new Response(JSON.stringify({ ok: false, error: 'Archivo demasiado grande (máx. 4GB)' }), {
      status: 413, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  const identifier = generateIdentifier(filename)
  const encodedName = encodeURIComponent(filename)
  const uploadUrl = `https://s3.us.archive.org/${identifier}/${encodedName}`

  try {
    const archiveRes = await fetch(uploadUrl, {
      method: 'PUT',
      // Reenvía el body como stream — no se carga el archivo completo en memoria del Worker.
      body: request.body,
      duplex: 'half',
      headers: {
        'Authorization': `LOW ${env.ARCHIVE_ACCESS_KEY}:${env.ARCHIVE_SECRET_KEY}`,
        'x-archive-auto-make-bucket': '1',
        'x-archive-ignore-preexisting-bucket': '1',
        'x-archive-meta-mediatype': 'software',
        'x-archive-meta-title': filename.replace(/\.[^.]+$/, ''),
        'x-archive-meta-subject': 'APK;Android;Mod;JozethDev',
        'x-archive-meta-creator': 'JozethDev',
        'Content-Type': getContentType(filename, request.headers.get('Content-Type')),
      },
    })

    if (!archiveRes.ok) {
      let msg = `Archive.org error ${archiveRes.status}`
      if (archiveRes.status === 401 || archiveRes.status === 403) msg = 'Credenciales de Archive.org inválidas'
      if (archiveRes.status === 503) msg = 'Archive.org no disponible, intenta de nuevo en unos minutos'
      return new Response(JSON.stringify({ ok: false, error: msg }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...cors },
      })
    }

    return new Response(JSON.stringify({
      ok: true,
      url: `https://archive.org/download/${identifier}/${encodedName}`,
      identifier,
    }), { headers: { 'Content-Type': 'application/json', ...cors } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Error al subir a Archive.org: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name',
    },
  })
}
