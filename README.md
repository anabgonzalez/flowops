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
