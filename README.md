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

## 🏗️ Tech Stack

| Layer      | Technology                                                       |
| ---------- | ---------------------------------------------------------------- |
| Monorepo   | pnpm workspaces                                                  |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL             |
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
- **PostgreSQL** (or use Docker)

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

Start PostgreSQL (via Docker) or use an existing instance, then:

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

Run the entire stack (PostgreSQL + API + Web) with docker-compose:

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
