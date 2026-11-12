# De ellos para ellas

Invitación web, confirmación de asistencia y mural de fotos para el evento del **sábado 21 de noviembre de 2026**.
Es un sitio estático (React + Vite + Tailwind) publicado en GitHub Pages; Firebase, Cloudinary y EmailJS hacen de backend.

> El repositorio es público. Todas las variables `VITE_*` acaban en el JavaScript publicado, así que **nunca** pongas aquí
> el API secret de Cloudinary ni la contraseña del admin.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y rellena los valores (ver abajo)
npm run dev
```

`npm run build` ejecuta ESLint y compila. `.env.local` y `node_modules/` están ignorados por git.

## 1. Firebase

1. Crea un proyecto en <https://console.firebase.google.com> (plan Spark, gratis).
2. **Firestore Database** → crear base de datos en modo producción.
3. **Authentication** → *Sign-in method*: activa **Anónimo** y **Correo/contraseña**.
4. **Configuración del proyecto → Tus apps → Web**: registra una app y copia los valores a `VITE_FIREBASE_*`.
5. **Reglas**: se despliegan con Firebase CLI (`firebase.json` y `.firebaserc` ya están en el repo):
   `npx firebase-tools login` (una vez) y luego `npx firebase-tools deploy --only firestore:rules`.
   No se despliegan desde CI: repite el comando cada vez que cambies `firestore.rules`.
6. **Crear el usuario admin** (paso obligatorio):
   1. Authentication → *Users* → *Add user*: correo y una contraseña larga y única.
   2. Copia el **UID** de ese usuario.
   3. Firestore → *Start collection* `admins` → ID del documento = ese UID → añade un campo `createdAt` (timestamp).
   Sin este documento el usuario inicia sesión pero `/admin` no muestra datos.
7. **Authentication → Settings → Authorized domains**: añade `<usuario>.github.io`.

Para cambiar la contraseña del admin, hazlo en la consola de Firebase; no hay que tocar código.

## 2. Cloudinary

1. Crea una cuenta gratuita en <https://cloudinary.com> y copia el *cloud name* a `VITE_CLOUDINARY_CLOUD_NAME`.
2. *Settings → Upload → Upload presets → Add*: modo **Unsigned**, carpeta `wall`, formatos permitidos `jpg,png,webp,heic`,
   tamaño máximo de archivo limitado (por ejemplo 5 MB). Copia el nombre del preset a `VITE_CLOUDINARY_UPLOAD_PRESET`.
3. No copies el API secret en ningún sitio del proyecto.

## 3. EmailJS

1. Crea una cuenta en <https://www.emailjs.com> (plan gratuito: **200 correos al mes**; cada confirmación envía un correo).
2. *Email Services*: conecta una cuenta de correo y copia el *Service ID* a `VITE_EMAILJS_SERVICE_ID`.
3. *Email Templates*: crea una plantilla con **To email** = `{{to_email}}` y usa estas variables en el cuerpo:
   `{{to_name}}`, `{{code}}`, `{{event_name}}`, `{{event_date}}`. Copia el *Template ID* a `VITE_EMAILJS_TEMPLATE_ID`.
4. *Account → API keys*: copia la *Public key* a `VITE_EMAILJS_PUBLIC_KEY`.

## 4. Música de fondo

Falta añadir la pista: sigue las instrucciones de `public/audio/CREDITS.txt` y guarda el archivo como
`public/audio/background-loop.mp3` (máximo 3 MB, instrumental, con licencia libre). La música nunca suena sola.

## 5. Publicar en GitHub Pages

1. En GitHub: *Settings → Pages → Source*: **GitHub Actions**.
2. *Settings → Secrets and variables → Actions → Variables*: crea una variable por cada `VITE_*` de `.env.example`
   (excepto `VITE_BASE`, que el workflow calcula desde el nombre del repo).
3. Trabaja en `develop` (no publica nada). Para publicar, fusiona `develop` en `main` y haz push a `main`: el workflow
   `.github/workflows/deploy.yml` compila y publica. `main` es la rama de producción y la única admitida por el entorno `github-pages`.
4. Abre `https://<usuario>.github.io/<repo>/mural` y recarga: debe seguir abriendo (gracias a `404.html`).

Si usas un dominio propio en la raíz, cambia `pathSegmentsToKeep` a `0` en `public/404.html` y usa `VITE_BASE=/`.

## Rutas

| Ruta         | Contenido                                           |
| ------------ | --------------------------------------------------- |
| `/`          | Invitación, cuenta regresiva y lugar                |
| `/mural`     | Galería en vivo; subida con código o como admin (se comparte por URL directa, no hay barra de navegación) |
| `/admin`     | Login, lista de confirmaciones y totales            |

## Moderación

No hay moderación previa. Para quitar una foto, bórrala desde la consola de Firebase (colección `photos`).
