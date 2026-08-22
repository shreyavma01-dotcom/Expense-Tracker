# Deployment Guide

> **Stack note:** This repository is **React/Vite + Node.js (Express) + PostgreSQL**.
> There is no Python backend and no MongoDB in this codebase. The database is accessed via the
> `DATABASE_URL` connection string (Neon managed Postgres recommended) — not `MONGODB_URI`.

## Architecture

```
my-react-app/  →  Vercel  (static SPA built by Vite)
backend/       →  Render  (Node/Express API)
PostgreSQL     →  Neon    (managed Postgres, TLS required)
```

## 1. Database — Neon (PostgreSQL)

1. Create a project at https://neon.com and copy the **pooled** connection string.
   It must end with `?sslmode=require`.
2. Apply the schema from your machine (free Render has no shell):

   ```powershell
   cd backend
   $env:DATABASE_URL = "<neon-pooled-connection-string>"
   npm run migrate      # idempotent; creates users / sessions / transactions
   Remove-Item Env:DATABASE_URL
   ```

3. Do **not** run `npm run seed` in production unless you want public demo accounts
   (`admin@example.com` / `user@example.com`, password `ChangeMe123!`).

Required environment variable on the backend host:

| Variable        | Value                                  |
| --------------- | -------------------------------------- |
| `DATABASE_URL`  | Neon pooled string incl. `?sslmode=require` |

TLS is applied automatically when the URL contains `sslmode=require`
(or set `PGSSL=require` explicitly). No Atlas/network-allowlist work is needed;
Neon accepts connections over the public internet with TLS.

## 2. Backend — Render

| Setting            | Value                                        |
| ------------------ | -------------------------------------------- |
| Repository         | `shreyavma01-dotcom/Expense-Tracker`         |
| Branch             | `main`                                       |
| Root Directory     | `backend`                                    |
| Runtime            | Node                                         |
| Build Command      | `npm install`                                |
| Start Command      | `npm start`  (`node src/server.js`)          |
| Health Check Path  | `/api/health`                                |
| Instance Type      | Free (spins down when idle; first request is slow) |

Environment variables (**all required in production** — the server refuses to start without them):

| Key            | Example / how to generate                                                                 |
| -------------- | ----------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `production`                                                                              |
| `DATABASE_URL` | Neon pooled connection string                                                             |
| `JWT_SECRET`   | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`                |
| `CORS_ORIGIN`  | Exact frontend origin(s), comma-separated, **no trailing slash**: `https://<app>.vercel.app` |

Verify after deploy:

```powershell
Invoke-RestMethod https://<your-render-url>/api/health
# -> {"message":"API Working"}
```

## 3. Frontend — Vercel

| Setting          | Value                                        |
| ---------------- | -------------------------------------------- |
| Repository       | `shreyavma01-dotcom/Expense-Tracker`         |
| Production Branch| `main`                                       |
| Root Directory   | `my-react-app`                               |
| Framework Preset | Vite                                         |
| Build Command    | `npm run build`                              |
| Output Directory | `dist`                                       |

Environment variables (set **before** the first build — baked into the bundle):

| Key            | Scope       | Value                                        |
| -------------- | ----------- | -------------------------------------------- |
| `VITE_API_URL` | Production  | `https://<your-render-url>` (no trailing slash) |

Notes:

* `VITE_API_URL` is a **public** value (the browser calls it directly). Never put
  `JWT_SECRET`, `DATABASE_URL`, or any other secret in Vercel frontend env vars.
* Changing it later requires a redeploy.
* No SPA rewrites are configured because the app uses state-based navigation
  (single `/` entry point, no React Router URLs).
* `vercel.json` supplies security headers and cache rules; `sw.js`,
  `registerSW.js`, and the manifest are always revalidated, hashed `/assets/*`
  are immutable.

## 4. Deployment order

1. Create Neon database → run `npm run migrate` locally against it
2. Create Render backend service → wait for live deploy
3. Verify `GET /api/health` returns `{"message":"API Working"}`
4. Import repo into Vercel with Root Directory `my-react-app`
5. Set `VITE_API_URL` to the Render URL, then deploy
6. Set backend `CORS_ORIGIN` to the final Vercel URL (Render redeploys automatically)
7. Test the production app end-to-end (register → login → CRUD → logout)

## 5. Local development

Backend reads `backend/.env` (copy of `backend/.env.example`): discrete `PGUSER` /
`PGHOST` / `PGDATABASE` / `PGPASSWORD` / `PGPORT` vars against local Postgres,
or `DATABASE_URL`. Frontend falls back to `http://localhost:5001` when
`VITE_API_URL` is unset, so nothing breaks locally.

```powershell
cd backend && npm install && npm run migrate && npm start   # port 5001
cd ..\my-react-app && npm install && npm run dev            # port 5174
```

## Security checklist

* Secrets only ever exist in platform dashboards / local `.env` files (gitignored,
  never committed). `.env.example` files contain placeholders only.
* Passwords bcrypt-hashed; login errors uniform; JWT fail-fast without secret.
* Every transaction query filters by the authenticated user id.
* Login/register rate-limited (20 req / 15 min); general API 300 req / 15 min.
* Helmet security headers on the API; CSP/HSTS/etc. served by `vercel.json`.
