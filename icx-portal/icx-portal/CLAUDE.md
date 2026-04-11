# ICX Portal

## Project Overview

Full-stack data center and GPU marketplace portal with role-based access (superadmin, admin, supplier, broker, customer, reader, viewer, subordinate). OTP-based authentication (no passwords).

## Tech Stack

- **Client:** React 19 + Vite 6 + Tailwind CSS 4 + React Router 7 + Axios + Recharts + Lucide icons
- **Server:** Express 4 + Mongoose 8 + MongoDB 7 + Zod validation + JWT + Resend (email) + MinIO/S3
- **Infra:** Docker Compose (MongoDB, MinIO, Mongo Express, server, client via nginx)

## Running the Project

```bash
# Full stack via Docker
docker compose up -d --build

# Seed the database (inside container)
docker compose exec server node src/scripts/seed.js

# Local dev (requires MongoDB + MinIO running)
cd server && npm run dev    # port 5000
cd client && npm run dev    # port 3000 (proxies /api to 5000)
```

**Services (Docker):**
- Client: http://localhost (nginx)
- Server: http://localhost:5000
- Mongo Express: http://localhost:8081
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

## Project Structure

```
client/src/
  components/ui/        # Reusable: Button, Card, Input, Modal, Toast, etc.
  components/layout/    # DashboardLayout, PublicLayout, Sidebar, Topbar
  components/auth/      # OtpRequestForm, OtpVerifyForm, ProtectedRoute
  config/               # constants.js (API_URL, ROLES, enums)
  context/              # AuthContext (user state, login/logout)
  hooks/                # useAuth, useApi, useAutoSave, useWizard
  lib/                  # api.js (axios instance with JWT interceptor), validators.js
  pages/{admin,supplier,customer,reader,public}/

server/src/
  config/               # db.js, resend.js
  controllers/          # *.controller.js — business logic
  middleware/            # auth, errorHandler, rateLimiter, roles, upload, validate
  models/               # Mongoose schemas (PascalCase: User.js, Organization.js)
  routes/               # *.routes.js — Express routers
  services/             # jwt, otp, email, s3, queue, audit
  scripts/              # seed.js
  utils/                # fieldFilter.js, pagination.js
```

## Code Conventions

- **Components:** PascalCase `.jsx`, default exports, functional components
- **Hooks:** camelCase `use*.js`
- **Server files:** camelCase with suffix (`.controller.js`, `.routes.js`, `.service.js`)
- **Models:** PascalCase `.js`
- **Styling:** Tailwind classes + CSS custom properties (`--color-primary`, `--radius-md`, etc.)
- **API routes:** RESTful `/api/{feature}/{id}`, middleware chain: `rateLimiter → authenticate → validate(schema) → controller`
- **State:** React Context + localStorage (`icx_token`, `icx_user`), no Redux
- **Toast usage:** `const { addToast } = useToast();` then `addToast({ type: 'success', message: '...' })`

## API Pattern (Frontend)

```js
// Uses hooks/useApi.js which wraps lib/api.js (axios)
const { get, post, put, del, loading, error } = useApi();
const data = await get('/admin/suppliers');
```

Axios interceptors auto-attach JWT from localStorage and redirect to `/login` on 401.

## Environment Variables (.env)

Key vars: `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CLIENT_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `MAX_FILE_SIZE_MB`

## Auth Flow

1. `POST /api/auth/otp/request` — sends OTP to email
2. `POST /api/auth/otp/verify` — returns JWT
3. In dev mode, any 6-digit OTP works

## Important Notes

- No test framework configured — manual testing only
- No linter/formatter configured
- Dockerfiles use `npm install` (not `npm ci`) — no lockfiles in repo
- Server Dockerfile installs production deps only (`--only=production`); `dotenv` is a dev dep so seed.js has a try/catch for it
- Nginx handles SPA routing (`try_files → /index.html`) and proxies `/api/` to backend
- Express `trust proxy` is not set — causes a validation warning from `express-rate-limit` behind nginx
