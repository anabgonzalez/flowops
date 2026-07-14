# FlowOps

FlowOps is a field service management platform for trades businesses (HVAC, plumbing, electrical, roofing, and similar), inspired by ServiceTitan. It covers the job-to-cash workflow — from first customer call through dispatch, completed work, and paid invoice — from both the office (web) and the field (mobile-friendly web).

See [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md) for the full feature breakdown, data model, and build phasing. That doc is the source of truth for scope — start there before adding a feature.

## Tech stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS (`client/`)
- **Backend:** Node.js + Express + TypeScript + Mongoose (`server/`)
- **Database:** MongoDB

## Getting started

### Prerequisites

- Node.js v18+
- A MongoDB connection string (local or Atlas)

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI
npm run dev
```

Runs on `http://localhost:5002`. Health check: `GET /api/health`.

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
└── server/                # Express + TS + Mongoose
    └── src/
        ├── config/
        ├── controllers/
        ├── middleware/
        ├── models/
        └── routes/
```
