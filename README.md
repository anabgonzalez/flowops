# FlowOps

FlowOps is a field service management platform for trades businesses (HVAC, plumbing, electrical, roofing, and similar), inspired by ServiceTitan. It covers the job-to-cash workflow — from first customer call through dispatch, completed work, and paid invoice — from both the office (web) and the field (mobile-friendly web).

See [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md) for the full feature breakdown, data model, and build phasing. That doc is the source of truth for scope — start there before adding a feature.

## Tech stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** PostgreSQL, via Prisma ORM (chosen over MongoDB/Mongoose — this domain is relational: Customer → Location → Job → Appointment → Estimate → Invoice, with heavy reporting/aggregation needs)

## Getting started

### Prerequisites

- Node.js v18+
- A PostgreSQL database (local or hosted — e.g. local Postgres, Neon, Supabase, Railway, RDS)

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL
npx prisma generate
npx prisma migrate dev # applies migrations, creates the db schema
npm run dev
```

Runs on `http://localhost:5002`. Health check: `GET /api/health` (also verifies the Prisma/Postgres connection).

### Frontend

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## Deployment

Deployed via a [Render Blueprint](https://render.com/docs/infrastructure-as-code) (`render.yaml` at the repo root) — one dashboard connects the repo and stands up both services:

- **flowops-api** — Node web service (free plan; sleeps after 15 min idle, ~30-50s cold start on the next request)
- **flowops-client** — static site (free plan; no sleep, serves the built React app with SPA routing)

Database is external: [Neon](https://neon.tech) Postgres (free plan, no credit card, no expiry). Render's own free Postgres expires after 90 days, so it's not used here.

Setup: create a Neon project, copy its **direct** (non-pooled) connection string, then in Render "New → Blueprint", connect this repo, and paste that connection string in as `DATABASE_URL` when prompted (it's marked `sync: false` in `render.yaml` so it's never committed). The client's `VITE_API_URL` is wired automatically via Render's `fromService` to the API's URL.

## Project structure

```
flowops/
├── docs/
│   └── PRODUCT_PLAN.md    # feature plan, data model, build phasing
├── client/                # React + Vite + TS + Tailwind
└── server/                # Express + TS + Prisma
    ├── prisma/
    │   └── schema.prisma  # data model — grows with each build phase
    └── src/
        ├── lib/            # prisma client singleton
        ├── routes/
        ├── controllers/
        └── middleware/
```
