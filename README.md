# Habit Tracker

A full-stack habit-tracking application with streaks, statistics, and a clean, responsive dashboard. Built as a pnpm monorepo with a Node.js/Express REST API, a React + TypeScript + Tailwind frontend, and a shared package for types and validation.

## ✨ Features

- **Authentication** — Register, login, logout, refresh tokens, and password reset (email-less, token returned in dev).
- **Habits** — Create, edit, archive, and delete habits with flexible frequencies:
  - Daily
  - Specific days of the week (e.g., Mon/Wed/Fri)
  - Weekly (N times per week)
- **Check-ins** — Mark habits complete for any date, with optional notes.
- **Streaks** — Automatic current and longest streak calculation with proper handling of non-daily frequencies.
- **Statistics** — Per-habit completion rates, GitHub-style heatmaps, and aggregate completion rates.
- **Dashboard** — Today's overview, weekly/monthly completion, and quick check-offs.
- **Categories** — Organize habits with color-coded categories.
- **Dark mode** — Toggleable theme with system preference detection.
- **Responsive** — Mobile-friendly layout.
- **PWA (Progressive Web App)** — Installable on mobile devices with offline support, app icons, and a web manifest.

## 🏗️ Tech Stack

| Layer      | Technology                                                       |
| ---------- | ---------------------------------------------------------------- |
| Monorepo   | pnpm workspaces                                                  |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, SQLite                 |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, React Router, lucide   |
| Shared     | Zod validation schemas + shared TypeScript types                 |
| Testing    | Vitest, Supertest                                                |
| Infra      | Docker, docker-compose, nginx                                    |

## 📁 Project Structure

```
habit-tracker/
├── apps/
│   ├── api/                 # Express REST API
│   │   ├── prisma/          # Schema, migrations, seed
│   │   ├── src/
│   │   │   ├── config/      # Environment config
│   │   │   ├── controllers/ # Route handlers
│   │   │   ├── lib/         # Prisma, logger, errors, dates, tokens
│   │   │   ├── middleware/  # Auth, validation, error handling
│   │   │   ├── routes/      # Express routers
│   │   │   └── services/    # Business logic
│   │   └── tests/           # API tests
│   └── web/                 # React frontend
│       └── src/
│           ├── components/  # Reusable UI
│           ├── context/     # Auth & theme context
│           ├── lib/         # API client
│           └── pages/       # Route pages
├── packages/
│   └── shared/              # Shared types + validation
├── docker-compose.yml
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example env file and adjust values as needed:

```bash
cp apps/api/.env.example apps/api/.env
```

### 3. Set up the database

The app uses **SQLite** for local development — no external database server is required. The database file is created automatically at `apps/api/prisma/dev.db` when you run migrations:

```bash
# Run migrations
pnpm db:migrate

# (Optional) Seed demo data
pnpm db:seed
```

The seed creates a demo user:

```
Email:    demo@habit.app
Password: password123
```

### 4. Run the app

```bash
pnpm dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:4000

The Vite dev server proxies `/api` requests to the API automatically.

## 🐳 Docker (Recommended)

Run the entire stack (API + Web) with docker-compose. The app uses **SQLite**, so no separate database container is required:

```bash
docker compose up --build
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:4000

To apply migrations and seed data inside the running API container:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

## 🚀 Deployment

The app is split into two deployable parts: the **frontend (PWA)** and the **API**.

### Frontend → Vercel

The frontend is a static Vite build with PWA support. Deploy it to Vercel:

1. Push the repo to GitHub (already done: `CustodioVJ/habit-tracker-pwa`).
2. In Vercel, import the repo and set:
   - **Root Directory:** `.` (repo root — required so the `@habit/shared` workspace package is available)
   - **Framework Preset:** `Vite`
   - **Build Command:** `pnpm --filter @habit/web build`
   - **Output Directory:** `apps/web/dist`
   - **Install Command:** `pnpm install`
3. Set the environment variable `VITE_API_URL` to your deployed API URL (e.g. `https://habit-tracker-api.onrender.com/api/v1`).
4. Deploy. Vercel auto-deploys on every push.

The root `vercel.json` handles the monorepo build, SPA rewrites, and PWA caching headers. The web app resolves `@habit/shared` directly from source via `vite.config.ts` and `tsconfig.json`, so no separate shared build step is needed.

### API → Render

The API needs a persistent server (for the database connection). Deploy it to Render:

1. In Render, create a **New Web Service** and connect your GitHub repo.
2. Set **Root Directory** to `apps/api`.
3. Render will use the `render.yaml` blueprint (or configure manually):
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm --filter @habit/shared run build && pnpm --filter @habit/api run build && pnpm --filter @habit/api run db:generate`
   - **Start Command:** `pnpm --filter @habit/api run db:deploy && pnpm --filter @habit/api run start`
4. Add a **PostgreSQL database** (Render's free tier or Neon/Supabase) and set `DATABASE_URL`.
5. Set the other env vars: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (your Vercel URL), `FRONTEND_URL`.

### Database → PostgreSQL

Production uses **PostgreSQL** (the Prisma schema is configured for it). For local dev you can still use SQLite by setting `DATABASE_URL="file:./dev.db"` in `apps/api/.env`, but the schema provider is `postgresql`. To run locally with PostgreSQL, set `DATABASE_URL` to a local or hosted Postgres instance and run `pnpm db:migrate`.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter @habit/api test
```

## 🛠️ Useful Scripts

| Command                          | Description                          |
| -------------------------------- | ------------------------------------ |
| `pnpm dev`                       | Run API + web in watch mode          |
| `pnpm build`                     | Build shared, API, and web           |
| `pnpm test`                      | Run API tests                        |
| `pnpm lint`                      | Lint all packages                    |
| `pnpm format`                    | Format code with Prettier            |
| `pnpm db:migrate`                | Run Prisma migrations                |
| `pnpm db:seed`                   | Seed demo data                       |
| `pnpm --filter @habit/api db:studio` | Open Prisma Studio               |

## 🔌 API Overview

Base URL: `/api/v1`

| Method | Endpoint                          | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| POST   | `/auth/register`                  | Register a new user             |
| POST   | `/auth/login`                     | Log in                          |
| POST   | `/auth/logout`                    | Log out                         |
| GET    | `/auth/me`                        | Get current user                |
| POST   | `/auth/forgot-password`           | Request password reset          |
| POST   | `/auth/reset-password`            | Reset password                  |
| GET    | `/dashboard`                      | Dashboard data                  |
| GET    | `/habits`                         | List habits                     |
| POST   | `/habits`                         | Create a habit                  |
| GET    | `/habits/:id`                     | Get a habit                     |
| PATCH  | `/habits/:id`                     | Update a habit                  |
| DELETE | `/habits/:id`                     | Delete a habit                  |
| POST   | `/habits/:id/archive`             | Archive a habit                 |
| POST   | `/habits/:id/unarchive`           | Unarchive a habit               |
| PUT    | `/habits/:id/check-ins`           | Create/update a check-in        |
| GET    | `/habits/:id/stats?period=week`   | Habit statistics                |
| GET    | `/habits/:id/heatmap`             | Year heatmap                    |
| GET    | `/categories`                     | List categories                 |
| POST   | `/categories`                     | Create a category               |
| PATCH  | `/categories/:id`                 | Update a category               |
| DELETE | `/categories/:id`                 | Delete a category               |

## 📄 License

MIT
