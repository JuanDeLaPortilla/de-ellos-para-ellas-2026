# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"De ellos para ellas": event invitation, RSVP form and photo wall for the event on 2026-11-21. Static React 19 + Vite + Tailwind 4 SPA (JavaScript, no TypeScript) deployed to GitHub Pages. There is no server of our own: Firebase (Firestore + Auth), Cloudinary (unsigned uploads) and EmailJS act as the backend. UI text is in Spanish. See `README.md` for the full third-party setup (Firebase, Cloudinary, EmailJS, Pages).

## Commands

- `npm run dev`: Vite dev server (needs `.env.local` copied from `.env.example`).
- `npm run lint`: ESLint with `--max-warnings 0` (any warning fails).
- `npm run build`: runs lint first, then `vite build`.
- `npm run preview`: serve the production build.
- There is no test suite.

## Architecture

- **Routing**: `src/App.jsx` uses react-router with a shared `Layout`. Routes: `/` (Invitation), `/confirmar`, `/mural`, `/admin`; unknown paths render Invitation. GitHub Pages SPA fallback is handled by `public/404.html` (`pathSegmentsToKeep`). `VITE_BASE` sets the Vite base path (computed by the deploy workflow from the repo name).
- **Event data** lives in `src/config/event.config.js`; change the date or venue there only.
- **Backend glue** is in `src/lib/` (`firebase.js`, `rsvp.js`, `email.js`, `cloudinary.js`, `useAuthUser.js`). All config comes from `VITE_*` env vars.
- **All security is enforced by `firestore.rules`**, since the client is public. The data model spans the rules and several files:
  - `rsvps/{normalizedEmail}`: the document ID is the lowercased email. `saveRsvp` tries `setDoc` (create) and, if the rules reject it with `permission-denied` because the document exists, falls back to `updateDoc`. Updates cannot change `code` or `email`. Only admins can read.
  - The 8-char `code` is generated client-side (`generateCode`, unambiguous alphabet) and emailed by EmailJS.
  - `sessions/{uid}`: an anonymous-auth user redeems a code by creating a session whose `email` and `code` match an attending RSVP (checked in the rules via `get()`). Holding a session is what allows uploading to the photo wall.
  - `photos`: public read; create requires a session or admin and a `https://res.cloudinary.com/` URL. Images are uploaded to Cloudinary first, then the metadata is written to Firestore. Never update or delete from the client.
  - `admins/{uid}`: created by hand in the Firebase console; the admin is an email/password Auth user whose UID has a document here.
- When adding or changing fields on `rsvps` or `photos`, update both the client code and the `hasOnly` key lists and validators in `firestore.rules`. The rules must then be redeployed manually with `npx firebase-tools deploy --only firestore:rules` (`firebase.json` and `.firebaserc` are versioned); they are not deployed by CI.

## Gotchas

- The repo is public and every `VITE_*` value ends up in the published JS. Never add the Cloudinary API secret or any admin password.
- `main` is the production branch and the repo default: only pushes to `main` deploy via `.github/workflows/deploy.yml` (the `github-pages` environment only admits `main`). `develop` is the development branch and does not deploy; publish by merging `develop` into `main` and pushing. The `VITE_*` values come from GitHub Actions *Variables*, not secrets.
- Background music (`public/audio/background-loop.mp3`) is intentionally not committed yet; see `public/audio/CREDITS.txt`.
