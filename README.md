# JozethDev — v3

Catálogo de APKs, Addons, Mods y Tutoriales. React + Vite, Firebase, Cloudinary, Archive.org, desplegado en Cloudflare Pages.

## 1. Instalar y correr en local

```bash
npm install
cp .env.example .env
# completa las variables en .env (ver sección 3)
npm run dev
```

## 2. Estructura

```
src/
  components/   # UI reutilizable (catálogo, comentarios, navbar, etc.)
  pages/        # una por ruta
  services/     # Firebase, Cloudinary, Archive.org, posts, social
  context/      # Auth y Theme (dark mode)
functions/api/  # Cloudflare Pages Functions (backend)
firestore.rules            # reglas de seguridad de Firestore
firestore.indexes.json     # índices compuestos requeridos
public/_headers            # headers de seguridad + caché
public/_redirects          # SPA fallback
```

## 3. Variables de entorno

### Frontend (`.env`, y en Cloudflare Pages → Settings → Environment variables → Production/Preview)

Estas SÍ son seguras de exponer — ver por qué en la sección 5.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_CLOUDINARY_CLOUD=
VITE_CLOUDINARY_PRESET=
VITE_ADMIN_EMAIL=tu-correo@ejemplo.com
VITE_API_URL=/api
```

### Backend / Function (Cloudflare Pages → Settings → Environment variables → marca "Encrypt")

Estas NUNCA deben llevar prefijo `VITE_` ni estar en el `.env` del frontend:

```
ARCHIVE_ACCESS_KEY=tu-access-key-de-archive-org
ARCHIVE_SECRET_KEY=tu-secret-key-de-archive-org
FIREBASE_API_KEY=la-misma-api-key-que-VITE_FIREBASE_API_KEY
```

## 4. Despliegue en Cloudflare Pages

1. Sube este proyecto a un repo de GitHub/GitLab.
2. En Cloudflare Dashboard → Workers & Pages → Create → Pages → conecta el repo.
3. Build settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Agrega las variables de entorno (sección 3) — las del backend márcalas como **Encrypted**.
5. Deploy. `functions/api/upload.js` se despliega automáticamente como Pages Function — no necesitas configurar un Worker aparte.

## 5. Por qué esto es seguro

- Las keys `VITE_FIREBASE_*` y `VITE_CLOUDINARY_*` quedan visibles en el navegador de cualquier visitante — así está diseñado. La seguridad real la dan:
  - **Firestore Rules** (`firestore.rules`): nadie puede autoverificarse, autoasignarse rol admin, editar posts ajenos, o manipular contadores desde el cliente sin pasar por las reglas.
  - El **preset de Cloudinary** debe ser *unsigned* con restricciones (carpeta fija, formatos permitidos, sin permiso de borrado) — configúralo así en Cloudinary → Settings → Upload.
- Las keys de **Archive.org** nunca tocan el navegador: viven como secrets en `functions/api/upload.js`, que además verifica el token de Firebase del usuario antes de aceptar cualquier subida — así nadie externo puede usar tu endpoint como proxy gratuito.

## 6. Firestore — primeros pasos

```bash
# Si usas Firebase CLI:
firebase deploy --only firestore:rules,firestore:indexes
```

O sube `firestore.rules` y `firestore.indexes.json` manualmente desde la consola de Firebase.

## 7. Roles y verificado

- El primer usuario que se registre con un correo listado en `VITE_ADMIN_EMAIL` recibe automáticamente `role: admin` y `verified: true`.
- Para verificar a otros usuarios, un admin debe actualizar manualmente su documento en `/users/{uid}` (campo `verified: true`) desde la consola de Firebase, o construir un panel de administración sobre esa colección.

## 8. Categorías

Las 4 categorías (`apks`, `addons`, `mods`, `tutoriales`) están centralizadas en `src/services/posts.js` (`CATEGORIES`). Cambiarlas ahí actualiza automáticamente el filtro, el formulario de subida y las reglas de validación del lado del cliente — recuerda actualizar también la función `validCategory()` en `firestore.rules` si las cambias.
