# RAYA Frontend — Backup Bundle

This ZIP is a **complete, unmodified snapshot** of the RAYA (رعاية) frontend
as it currently runs on the live site. Nothing in the UI, logo, colors,
typography, or component structure has been changed.

## What's inside

- `src/` — all React source (App, components, pages, styles)
- `public/` — index.html, logo, static assets
- `plugins/` — CRACO plugin(s)
- `package.json`, `yarn.lock` — dependency manifest & lockfile
- `tailwind.config.js`, `postcss.config.js`, `craco.config.js` — build config
- `components.json`, `jsconfig.json` — Shadcn / editor config
- `.env.example` — template for the one env var the app needs
- `README.md`, `.gitignore`

## What's NOT inside (intentional)

- `node_modules/` — reinstall with `yarn install`
- `build/` — generated on `yarn build`
- `.env` — real environment file (excluded for security; use `.env.example`)
- `.git/` — repository metadata

## How to run in another workspace

```bash
# 1. Unzip
unzip raya-frontend-backup.zip -d raya-frontend
cd raya-frontend

# 2. Create env
cp .env.example .env
# then edit .env and set REACT_APP_BACKEND_URL to your proxy backend URL

# 3. Install & run
yarn install
yarn start          # dev server on :3000
# or
yarn build          # production build in ./build
```

## Backend requirement

The frontend calls a FastAPI proxy at `${REACT_APP_BACKEND_URL}/api/analyze`,
`/api/wake`, and `/api/health`. That proxy forwards video uploads to the
external ML inference service (`mobiphysio.onrender.com/predict`). This ZIP
contains **only the frontend** as requested — the proxy is not included.
