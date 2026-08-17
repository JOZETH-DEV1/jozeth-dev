// functions/api/upload.js
//
// Cloudflare Pages Function — recibe el archivo del navegador y lo sube como
// "release asset" a un repositorio de GitHub dedicado a hosting de archivos.
// El token de GitHub se guarda como variable secreta del proyecto en
// Cloudflare (Settings → Environment variables → Encrypt) y nunca llega al
// navegador.
//
// Requiere, en el proyecto de Cloudflare Pages, las variables:
//   GITHUB_TOKEN          (secret) — fine-grained PAT con permiso Contents: Read & write
//   GITHUB_OWNER           (texto) — tu usuario u organización de GitHub
//   GITHUB_REPO            (texto) — nombre del repo dedicado a archivos, ej. jozeth-dev-files
//   FIREBASE_API_KEY       (texto) — la misma que VITE_FIREBASE_API_KEY, para validar el token del usuario
//
// Límite práctico: 2GB por archivo (límite de GitHub Release Assets).
// El archivo se lee completo en memoria antes de subirlo (la API de GitHub
// requiere Content-Length de antemano, no soporta cuerpo en streaming como
// S3), así que respeta el límite de memoria del plan de Cloudflare Pages
// Functions — para catálogos con archivos muy pesados de forma constante,
// considera Backblaze B2 u otro backend con soporte de streaming real.

function sanitizeFilename(filename) {
  // GitHub no permite espacios ni ciertos caracteres en nombres de asset
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_')
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
async function verifyFirebaseToken(idToken, apiKey) {
  if (!idToken) return { uid: null, reason: 'Falta el token de sesión' }
  if (!apiKey) return { uid: null, reason: 'Falta configurar FIREBASE_API_KEY en el servidor' }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
    )
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { uid: null, reason: errData?.error?.message || `Token inválido (${res.status})` }
    }
    const data = await res.json()
    const uid = data?.users?.[0]?.localId || null
    return { uid, reason: uid ? null : 'Token no reconocido' }
  } catch (err) {
    return { uid: null, reason: 'Error al verificar el token: ' + err.message }
  }
}

async function githubApi(path, env, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'jozethdev-worker',
      ...options.headers,
    },
  })
  return res
}

// Crea un release único para este archivo. Un release por archivo evita
// colisiones de nombres (GitHub no permite dos assets con el mismo nombre
// en el mismo release) y mantiene cada descarga como una URL estable propia.
async function createRelease(env, tagName, title) {
  const res = await githubApi(`/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases`, env, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: tagName,
      name: title,
      body: `Archivo subido automáticamente por JozethDev.`,
      draft: false,
      prerelease: false,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `No se pudo crear el release (${res.status})`)
  }
  return res.json()
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
  const { uid, reason } = await verifyFirebaseToken(idToken, env.FIREBASE_API_KEY)
  if (!uid) {
    return new Response(JSON.stringify({ ok: false, error: `No autenticado: ${reason}` }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
    return new Response(JSON.stringify({ ok: false, error: 'GitHub no está configurado en el servidor' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  const rawName = request.headers.get('X-File-Name') || 'archivo.bin'
  const filename = sanitizeFilename(decodeURIComponent(rawName))
  const contentLength = request.headers.get('Content-Length')
  const MAX_BYTES = 2 * 1024 * 1024 * 1024 // 2GB — límite de GitHub Release Assets
  if (contentLength && Number(contentLength) > MAX_BYTES) {
    return new Response(JSON.stringify({ ok: false, error: 'Archivo demasiado grande (máx. 2GB en GitHub)' }), {
      status: 413, headers: { 'Content-Type': 'application/json', ...cors },
    })
  }

  try {
    // 1) Leer el archivo completo — la API de assets de GitHub necesita
    //    Content-Length conocido, no admite cuerpo en streaming.
    const fileBuffer = await request.arrayBuffer()

    // 2) Crear un release único (tag basado en timestamp + nombre) que
    //    servirá como contenedor de este archivo.
    const tagName = `file-${Date.now()}`
    const release = await createRelease(env, tagName, filename.replace(/\.[^.]+$/, ''))

    // 3) Subir el archivo como asset del release. El endpoint de upload usa
    //    un host distinto (uploads.github.com) y requiere el asset name en
    //    la query string.
    const uploadUrl = `https://uploads.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/${release.id}/assets?name=${encodeURIComponent(filename)}`
    const assetRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'jozethdev-worker',
        'Content-Type': getContentType(filename, request.headers.get('Content-Type')),
        'Content-Length': String(fileBuffer.byteLength),
      },
      body: fileBuffer,
    })

    if (!assetRes.ok) {
      const errText = await assetRes.text().catch(() => '')
      // El release ya se creó — si el asset falla, lo borramos para no dejar releases vacíos huérfanos.
      await githubApi(`/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/${release.id}`, env, { method: 'DELETE' }).catch(() => {})
      throw new Error(`Error al subir el archivo a GitHub (${assetRes.status}): ${errText.slice(0, 300)}`)
    }

    const asset = await assetRes.json()

    return new Response(JSON.stringify({
      ok: true,
      url: asset.browser_download_url,
      identifier: tagName,
    }), { headers: { 'Content-Type': 'application/json', ...cors } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: `Error al subir el archivo: ${err.message}` }), {
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
