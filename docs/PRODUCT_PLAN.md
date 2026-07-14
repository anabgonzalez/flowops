# FlowOps — Product Plan

**Reference document.** This is the source of truth for what FlowOps is and what it's made of. Every build phase should trace back to a module in this doc. Update it when scope changes — don't let it drift out of sync with the actual product.

Inspiration: [ServiceTitan](https://www.servicetitan.com/features), the dominant field service management (FSM) platform for trades businesses (HVAC, plumbing, electrical, roofing). FlowOps targets the same job-to-cash workflow for small-to-mid trades businesses, without the enterprise bloat/price tag.

---

## 1. Product vision

A single system of record that takes a trades business from **first customer call → dispatched job → completed work → paid invoice → repeat business**, usable from both the office (web) and the field (mobile).

## 2. Core entities (data model backbone)

These are the objects every module below reads or writes. Get these right early — most modules are just views/workflows over this graph.

- **Customer** — contact info, type (residential/commercial), tags, balance
- **Location** — a serviceable address, belongs to a Customer (customers can have multiple locations)
- **Job** — the unit of work; belongs to a Location; has a Job Type, status, priority
- **Appointment** — a scheduled visit against a Job; has a time window and assigned Technician(s)
- **Technician / Employee** — user with a role, skills/certifications, home business unit
- **Estimate** — one or more priced options presented to a customer for a Job
- **Invoice** — billed line items generated from completed work
- **Payment** — a transaction against one or more Invoices
- **Pricebook Item** — a service, material, or equipment SKU with cost/price
- **Membership / Agreement** — a recurring service contract tied to a Customer + Location
- **Equipment** — a piece of customer-owned equipment (installed unit) tracked for service history
- **Campaign** — a marketing source, tied to a phone number, tracked for ROI
- **Call** — an inbound/outbound phone event, linked to Customer/Job/Campaign
- **Purchase Order / Vendor** — inventory procurement records
- **Business Unit** — a division/department (e.g., "Residential HVAC," "Commercial Plumbing") used to segment jobs, pricing, and reporting

## 3. User roles

| Role | Primary surface | Core needs |
|---|---|---|
| CSR / Dispatcher | Web (office) | Book calls, manage dispatch board, schedule appointments |
| Technician | Mobile | See daily schedule, navigate to job, log work, sell, collect payment |
| Sales Rep | Mobile/Web | Build estimates, present options, close deals |
| Office Manager / Admin | Web | Pricebook, reporting, payroll, settings, permissions |
| Owner | Web/Mobile | Dashboards, KPIs, multi-business-unit rollups |
| Customer | Mobile web / portal | View invoices, approve estimates, pay, book service |

## 4. Core modules

### 4.1 CRM (Customer & Location Management)
- Customer profiles with contact info, notes, tags, do-not-service flags
- Multiple locations per customer (residential + commercial support)
- Full interaction history: calls, jobs, estimates, invoices, memberships per customer
- Customer balance and account status at a glance
- Duplicate detection/merge

### 4.2 Call Booking / CSR Console
- Screen-pop: caller ID matched to existing customer before pickup
- Guided call-booking flow: call reason → lead classification → job type → booking
- Custom fields per call reason, scriptable prompts
- New vs. existing customer detection during intake
- Booking directly creates Job + Appointment + (optionally) Campaign attribution

### 4.3 Phones
- Virtual/tracking phone numbers assigned per marketing campaign or business unit
- Inbound/outbound call recording, linked to Customer/Job record
- Call routing and forwarding rules
- Missed-call and voicemail handling

### 4.4 Dispatch Board
- Visual, drag-and-drop board of technicians × time
- Real-time technician status (en route, on site, done) reflected on the board
- Unassigned-jobs queue with priority/urgency indicators
- Auto-suggest best technician by skill, proximity, and availability
- Map view of technician locations vs. job sites

### 4.5 Scheduling & Capacity Planning
- Arrival-window booking for customers (e.g., 8am–12pm)
- Technician skill/certification matching to job type
- Capacity view: how many jobs a day/team can absorb before overbooking
- Recurring appointment scheduling (for memberships/agreements)
- Reschedule/cancel workflow with reason tracking

### 4.6 Mobile Technician App
- Daily schedule/route with GPS navigation to next job
- Job details: customer history, equipment on site, notes, photos from prior visits
- Status updates (dispatched → en route → on site → in progress → complete)
- On-site estimate building and Good-Better-Best presentation
- Photo/video capture attached to job
- Digital forms/checklists (safety, inspection, install checklist)
- Collect signature and payment on site
- Access to pricebook for adding line items in real time

### 4.7 Estimates
- Templated estimates by job type, pre-loaded from pricebook
- Good-Better-Best multi-option proposals to increase average ticket
- Customer-facing approval flow (digital signature, accept/decline per option)
- Estimate → Job/Invoice conversion on approval
- Estimate follow-up/reminder tracking for unsold quotes

### 4.8 Pricebook
- Central catalog of services, materials, and equipment SKUs
- Cost, price, margin, and taxability per item
- Categorization/bundling (e.g., "Install Kit" = multiple SKUs)
- Business-unit-specific pricing overrides
- Bulk import/update and versioning

### 4.9 Invoicing & Payments
- Auto-populated invoices from completed job + sold estimate line items
- Send from field or office; customer pays via emailed/texted link
- Multiple payment methods (card, ACH, cash, check) logged against invoice
- Partial payments, deposits, progress invoicing for larger jobs
- Financing option presentation at point of invoice (see 4.13)
- AR aging and outstanding-balance tracking

### 4.10 Memberships & Recurring Service Agreements
- Recurring maintenance plans tied to Customer + Location + Equipment
- Auto-scheduling of recurring visits per membership terms
- Renewal reminders and auto-billing
- Membership-tier perks (priority scheduling, discounts) surfaced to CSR/tech

### 4.11 Marketing
- Campaign creation with attributed phone number and/or tracking link
- Email/SMS/direct-mail campaign sends (automation "autopilot" style)
- Full-funnel ROI: campaign → call → booked job → revenue
- Audience segmentation (e.g., lapsed customers, membership holders)
- Review/reputation tracking tied to completed jobs

### 4.12 Reporting & Business Intelligence
- Real-time dashboards: revenue, jobs booked, close rate, average ticket
- Technician/CSR performance leaderboards
- Marketing ROI by campaign/source
- Custom report builder against core entities
- Business-unit and multi-location rollups

### 4.13 Inventory & Purchase Orders
- Truck stock inventory per technician/vehicle
- Warehouse inventory levels
- Purchase orders to vendors, receiving workflow
- Auto-deduct inventory when pricebook items are used on a job
- Low-stock and reorder alerts

### 4.14 Payroll & Commissions
- Time tracking tied to appointments (clock in/out per job)
- Commission rules by job type, technician, or sale amount
- Payroll export/integration
- Spiff/bonus tracking for upsells

### 4.15 Customer Portal
- Customer-facing web view: invoices, service history, memberships
- Accept/decline estimates online
- Online bill pay
- Self-service appointment requests

### 4.16 Forms
- Configurable digital forms/checklists attached to job types (safety, inspection, install QA)
- Required-field enforcement before job can be marked complete
- Form data feeds into job history and reporting

### 4.17 Financing
- Point-of-sale consumer financing offer presentation on estimates/invoices
- Application status tracking
- Integration with third-party financing providers

### 4.18 Equipment & Service History Tracking
- Installed-equipment registry per location (make/model/serial/install date/warranty)
- Full service history per piece of equipment
- Warranty expiration alerts feeding into membership/marketing follow-up

### 4.19 Accounting Integration
- Sync customers, invoices, payments, and payroll to external accounting (e.g., QuickBooks)
- Chart-of-accounts mapping per pricebook category

### 4.20 Multi-Location / Business Unit Administration
- Business unit segmentation of jobs, techs, pricing, and reporting
- Role-based permissions per business unit/location
- Franchise/multi-branch rollup reporting

---

## 5. Suggested build phasing

Not a commitment — a starting sequence so we build in dependency order rather than all-at-once. Revisit as we go.

**Phase 1 — Core job lifecycle (MVP)**
Customer/Location CRM (4.1) → Job/Appointment scheduling (4.5) → Dispatch board (4.4) → Pricebook (4.8) → Estimates (4.7) → Invoicing & Payments (4.9) → basic mobile technician view (4.6)

**Phase 2 — Field-office loop**
Call booking/CSR (4.2) → Forms (4.16) → Equipment tracking (4.18) → basic Reporting (4.12) → Customer Portal (4.15)

**Phase 3 — Growth & retention**
Memberships (4.10) → Marketing (4.11) → Phones (4.3) → Inventory & POs (4.13)

**Phase 4 — Back office & scale**
Payroll & Commissions (4.14) → Financing (4.17) → Accounting Integration (4.19) → Multi-location administration (4.20)

---

## 6. Current repo state (as of this doc)

- `server/`: Node + Express + TypeScript + Prisma (PostgreSQL), health-check endpoint only
- `client/`: React + Vite + TypeScript + Tailwind CSS
- No auth, no domain entities modeled yet

Database: PostgreSQL via Prisma, not MongoDB/Mongoose — the domain (Customer → Location → Job → Appointment → Estimate → Invoice, plus reporting/aggregation across all of it) is relational, and Prisma's tooling (migrations, relations, type safety) targets Postgres, not Mongo.

Next step: define the Prisma schema for the Phase 1 entities (Customer, Location, Appointment, Estimate, Invoice, PricebookItem), run the first migration, and scaffold the corresponding API routes.
