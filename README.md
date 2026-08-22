# Expense Tracker

A full-stack, multi-user expense and income tracking PWA with JWT authentication and strict per-user data isolation, built with React (Vite) and Express backed by PostgreSQL.

## Overview

Users register or sign in, then record income/expense transactions. Every transaction is owned by the authenticated user who created it; all reads, updates, deletes, dashboard totals, analytics charts, and filtered reports operate exclusively on the signed-in user's own data.

## Architecture

```
┌─────────────────────┐        ┌──────────────────────┐       ┌──────────────────────┐
│  Frontend (React)   │  HTTP  │  Backend (Express)   │  SQL  │  PostgreSQL           │
│  my-react-app/      │ ─────► │  backend/            │ ────► │  users                │
│  Vite + PWA         │  JWT   │  REST API on :5001   │  pg   │  sessions             │
│  builds to dist/    │        │                      │       │  transactions (owned) │
└─────────────────────┘        └──────────────────────┘       └──────────────────────┘
```

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19, Vite 8, vite-plugin-pwa, axios, recharts, lucide-react |
| Backend  | Node.js, Express 5, node-postgres (`pg`), bcrypt, jsonwebtoken |
| Database | PostgreSQL (raw SQL — no ORM) |

## Folder Structure

```
backend/
├── db/schema.sql              # Idempotent schema + migration for existing DBs
├── src/
│   ├── server.js              # App entry: CORS, routes, startup checks
│   ├── config/
│   │   ├── db.js              # pg Pool (DATABASE_URL or discrete PG* vars)
│   │   └── env.js             # Env validation; fails fast in production
│   ├── controllers/
│   │   ├── authController.js  # Register / login / logout
│   │   └── transactionController.js  # Per-user CRUD
│   ├── middleware/SessionMiddleware.js # JWT + DB-session verification
│   ├── routes/                # authRoutes, transactionRoutes
│   └── scripts/
│       ├── migrate.js         # Applies db/schema.sql
│       └── seedUsers.js       # Idempotent demo-user seeding
my-react-app/
├── src/
│   ├── api.js                 # API base URL from VITE_API_URL
│   ├── ExpenseTracker.jsx     # Main app shell, auth, data flow
│   └── pages/                 # Dashboard, AddTransaction, Reports
└── vite.config.js             # Dev server + PWA build config
```

## Local Setup

Prerequisites: Node.js ≥ 18, PostgreSQL ≥ 14 running locally.

```bash
# 1. Install dependencies
cd backend && npm install
cd ../my-react-app && npm install

# 2. Configure environment
cp backend/.env.example backend/.env          # fill in local DB creds + JWT_SECRET
cp my-react-app/.env.example my-react-app/.env # optional in dev

# 3. Create schema (idempotent)
cd backend && npm run migrate

# 4. Seed demo users
npm run seed

# 5. Start backend (port 5001)
npm start            # or: npm run dev (nodemon)

# 6. Start frontend dev server (port 5174, separate terminal)
cd ../my-react-app && npm run dev
```

Open http://localhost:5174 and sign in with either demo account (or click **Demo Admin Login**).

## Environment Variables

Backend (`backend/.env`) — see `backend/.env.example`:

| Variable       | Required      | Description |
| -------------- | ------------- | ----------- |
| `NODE_ENV`     | prod          | Set `production` to enforce strict validation (JWT_SECRET/CORS_ORIGIN mandatory, insecure fallbacks refused) |
| `DATABASE_URL` | prod          | Full Postgres connection string (Neon/Supabase/Render). Preferred over discrete vars |
| `PGUSER`/`PGHOST`/`PGDATABASE`/`PGPASSWORD`/`PGPORT` | dev | Discrete local DB settings (defaults: postgres@localhost/expense_tracker) |
| `PGSSL`        | optional      | Set `require` when the provider enforces TLS |
| `JWT_SECRET`   | **prod**      | Secret used to sign JWTs. Missing in production = server refuses to start. In development a random per-process secret is used with a warning (sessions reset on restart) |
| `CORS_ORIGIN`  | **prod**      | Comma-separated allowed origins, e.g. `https://app.example.com`. Missing in production = server refuses to start |
| `PORT`         | optional      | Defaults to `5001`. Hosting platforms usually inject this |
| `DEMO_ADMIN_PASSWORD` / `DEMO_USER_PASSWORD` | optional | Override demo seed passwords |

Frontend (`my-react-app/.env`) — see `my-react-app/.env.example`:

| Variable       | Required | Description |
| -------------- | -------- | ----------- |
| `VITE_API_URL` | prod     | Backend base URL, e.g. `https://api.example.com`. Baked in at build time; falls back to `http://localhost:5001` |

Never commit `.env` files — they are gitignored and were never committed historically. `.env.example` files contain placeholders only.

## Database Setup

Schema lives in [`backend/db/schema.sql`](backend/db/schema.sql):

| Table          | Purpose |
| -------------- | ------- |
| `users`        | id, uuid, name, email (unique), bcrypt password, created_at |
| `sessions`     | issued JWTs per user (logout/expiry invalidation), FK → users CASCADE |
| `transactions` | income/expense records; **`user_id NOT NULL` FK → users CASCADE**; amount > 0 check |

### Migration Command

```bash
cd backend
npm run migrate   # idempotent: safe on fresh AND existing databases
```

The script is a single idempotent SQL file executed via node:

- Fresh databases get all tables with per-user ownership from the start.
- Databases created before user isolation are upgraded in place:
  1. `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id ...`
  2. Legacy rows without an owner are **backfilled to the earliest registered account** (`MIN(users.id)`) rather than deleted.
  3. `NOT NULL` is enforced once every row has an owner.

> ⚠️ If your existing database contains transactions that belong to a specific account other than the first, reassign those `user_id`s manually before running the migration. No data is ever deleted by the migration.

## Seed Command

```bash
cd backend
npm run seed
```

- Idempotent — repeated runs update instead of duplicating (upsert on email).
- Passwords bcrypt-hashed (10 rounds), never stored plaintext.
- Passwords overridable via `DEMO_ADMIN_PASSWORD` / `DEMO_USER_PASSWORD`.
- Never run automatically at server startup — seeding is an explicit manual step.

## Demo Users

| User       | Email                                           | Role                        | Password     |
| ---------- | ----------------------------------------------- | --------------------------- | ------------ |
| Admin Demo | [admin@example.com](mailto:admin@example.com)   | admin (demo admin account)* | ChangeMe123! |
| User Demo  | [user@example.com](mailto:user@example.com)     | user (normal user)**        | ChangeMe123! |

\* This app has no RBAC or role column. "Admin Demo" is the equivalent of the app's original *Demo Admin* login concept; it has no extra privileges.

\** Standard registered user. Functionally identical to Admin Demo.

The login page includes a **Demo Admin Login** button that pre-fills these credentials.

> ⚠️ These credentials exist for **development/demo purposes only**. Change them (or skip `npm run seed`) before any real production use.

## Authentication Architecture

- **Register** — `POST /api/auth/register`: bcrypt-hashes the password (10 rounds), stores user, returns `{id, uuid, name, email}` (never the hash).
- **Login** — `POST /api/auth/login`: constant-shape error (`Invalid credentials`, HTTP 400) for both unknown emails and wrong passwords (prevents user enumeration); issues a 7-day JWT signed with `JWT_SECRET`; persists the token as a session row.
- **Request auth** — `SessionMiddleware`: requires `Authorization: Bearer <jwt>`; verifies signature **and** expiry; additionally confirms the exact token still exists in `sessions` and is not past `expires_at`; attaches `req.user` from verified claims only.
- **Logout** — `POST /api/auth/logout`: deletes the caller's session row → token immediately unusable.
- Production refuses to start without `JWT_SECRET`; there is no hardcoded fallback anywhere.

## Multi-User Data Isolation

Every transaction belongs to exactly one user (`transactions.user_id`, FK → users, ON DELETE CASCADE). Ownership always comes from the verified JWT/session (`req.user.id`) — never from request bodies.

| Operation | Query guarantee |
| --------- | --------------- |
| List      | `WHERE user_id = $authenticatedUser` |
| Create    | Inserted with the authenticated owner automatically |
| Read/Update/Delete by ID | Matched on `id AND user_id`; foreign rows return **404** (no existence leak) |
| Dashboard/analytics/reports/filters | Computed client-side exclusively from the scoped list response |

Verified by a 21-assertion two-user adversarial test suite (see [Testing](#testingverification)).

## API Overview

| Method | Path                    | Auth   | Description |
| ------ | ----------------------- | ------ | ----------- |
| POST   | `/api/auth/register`    | public | Register user |
| POST   | `/api/auth/login`       | public | Login, returns JWT + user |
| POST   | `/api/auth/logout`      | token  | Invalidate current session |
| GET    | `/api/health`           | public | Health check |
| GET    | `/api/transactions`     | token  | List **own** transactions |
| POST   | `/api/transactions`     | token  | Create (owned by caller) |
| PUT    | `/api/transactions/:id` | token  | Update **own** only |
| DELETE | `/api/transactions/:id` | token  | Delete **own** only |

## Testing/Verification

No automated framework is configured; verification is performed manually/scripted:

```bash
# Backend
cd backend
npm install
npm run lint        # n/a (no eslint configured in backend)
npm run migrate     # idempotent — verified twice consecutively
npm run seed        # idempotent — verified twice consecutively
npm start           # expect: "PostgreSQL Connected" + "Server listening on port 5001"

# Frontend
cd ../my-react-app
npm install
npm run lint        # 0 errors, 0 warnings
npm run build       # PWA service worker generated
```

Multi-user security suite (21 assertions, all passing): both users log in; per-user create/list isolation; cross-user read/update/delete attempts return 404 and leave data untouched; own-resource operations succeed; login responses contain no password material; wrong password and unknown email rejected with identical errors; forged/invalid tokens rejected 401; logout invalidates the session.

Production hardening spot-checks: server refuses to start in `NODE_ENV=production` without `JWT_SECRET` or `CORS_ORIGIN`; production bundle contains the configured `VITE_API_URL`, no dev URLs, and no secrets.

## Production Deployment

Target architecture (matches the existing stack):

```
Frontend (static dist/)  →  Vercel / Netlify / Cloudflare Pages
Backend (Node/Express)   →  Render / Railway
Database                 →  Neon / Supabase managed PostgreSQL
```

> **Status:** Not yet deployed — no hosting accounts/CLIs are connected to this machine. Steps below are the exact deployment procedure. Do not trust any deployment claim until URLs are live and verified.

### 1. Database (Neon/Supabase)

1. Create a Postgres instance; copy the connection string.
2. From `backend/` with `DATABASE_URL=<connection string>` set:
   ```bash
   npm run migrate   # creates schema (fresh DB)
   npm run seed      # OPTIONAL — only if you want demo users in production
   ```
3. TLS: append `?sslmode=require` to `DATABASE_URL` or set `PGSSL=require`.

### 2. Backend (Render/Railway)

| Setting        | Value |
| -------------- | ----- |
| Root directory | `backend` |
| Build command  | *(none required)* |
| Start command  | `npm start` |
| Port           | `process.env.PORT || 5001` — binds `0.0.0.0` by default via Express/listen on host-injected PORT |

Environment variables:

```env
NODE_ENV=production
DATABASE_URL=<managed-postgres-connection-string>
JWT_SECRET=<strong-random-secret>            # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
CORS_ORIGIN=https://<frontend-domain>
```

Without `JWT_SECRET` or `CORS_ORIGIN` the server intentionally refuses to start.

### 3. Frontend (Vercel/Netlify)

| Setting          | Value |
| ---------------- | ----- |
| Root directory   | `my-react-app` |
| Build command    | `npm run build` |
| Output directory | `dist` |

Environment variables (set **before building** — baked into the bundle):

```env
VITE_API_URL=https://<backend-domain>
```

## Security Checklist

- [x] Transactions scoped to authenticated users at the query level
- [x] Cross-user access returns 404 without leaking existence or data
- [x] Ownership derived from verified JWT/session only — never from request bodies
- [x] Passwords bcrypt-hashed; hashes never returned by any endpoint
- [x] Login errors uniform (no user enumeration)
- [x] JWT signature + expiry verified; DB-session revocation honored
- [x] Session expiry timestamp enforced server-side
- [x] Logout invalidates the exact caller's session
- [x] No JWT_SECRET fallback in production — fail-fast startup validation
- [x] CORS restricted via `CORS_ORIGIN`; production requires it
- [x] Database credentials env-only; production refuses insecure defaults
- [x] `.env` gitignored and never committed; `.env.example` placeholders only
- [x] Frontend handles 401 by clearing the local session and returning to login
- [x] Production bundle free of dev URLs and secrets

## Known Limitations

- No automated test framework — verification is scripted/manual.
- No refresh tokens; sessions expire after 7 days and require re-login.
- Token stored in `localStorage` (XSS-sensitive); httpOnly-cookie migration is future work.
- No rate limiting/lockout on login or registration endpoints.
- The legacy-data backfill assigns pre-isolation transactions to the earliest account — reassign manually if inappropriate for your data.
- No RBAC — every authenticated user has identical capabilities.
