# ARCHITECTURE.md — Hall Booking System (Monorepo)

This document describes the architecture of the Hall Booking system: components, folder layout, key modules, data flows, and deployment.

---

## 1) System Overview

This project is a marketplace + booking system for event halls.

Clients:
- **Customer mobile app (Flutter)**: hall browsing, booking requests, receipt upload, booking status tracking, AI suggestions display.
- **Owner/Admin dashboard (React JS)**: one web app shared by owners and admins using role-based access.
- **Backend API (Express JS)**: REST API that serves mobile and dashboard, enforces auth/roles, handles booking workflow, receipt upload/review, and recommendations.

Data/storage:
- **Database**: MySQL initially (planned migration to PostgreSQL later); stores users, halls, bookings, payments/receipts, availability, etc.
- **ORM**: Prisma for schema, migrations, and database access (`services/api/prisma/schema.prisma`).
- **File storage**: stores receipt images (local disk for MVP or object storage later).

AI features:
- **Recommendations**: home suggestions + similar halls on hall details.

---

## 2) High-Level Component Diagram (Text)

[Flutter Mobile] ----\
                     \
                      ---> [Express API] ---> [Database]
                     /
[React Dashboard] ---/          |
                                +--> [Receipt Storage: Disk/S3]
                                |
                                +--> [Recommendation Module]

- Both clients call the same API.
- Dashboard and API are deployed separately.
- Mobile app is distributed via app stores, configured with API base URL.

---

## 3) Monorepo Folder Structure

Recommended layout:

`txt`
hall-booking/
  apps/
    dashboard/                 # React JS (Owner + Admin)
    mobile/                    # Flutter (Customer)
  services/
    api/                       # Express JS backend
  packages/
    contracts/                 # shared enums/rules + OpenAPI
    shared-utils/              # optional shared JS helpers
  specs/                       # requirements + flows + feature docs
  infra/                       # nginx/docker/deployment configs
  scripts/                     # dev scripts, db scripts, tooling helpers
  README.md
  package.json                 # npm workspaces + root scripts
Why:
- `apps/` contains user-facing applications (React dashboard + Flutter mobile).
- `services/` contains backend services (Express API).
- `packages/` contains shared code and contracts used by multiple parts of the repo.
- `specs/` contains documentation (requirements, flows, rules) that keeps the team and AI agents consistent.
- `infra/` contains deployment configuration (nginx, docker, server configs).
- `scripts/` contains helper scripts for development and maintenance (seed DB, backups, etc.).

---

## 4) Applications and Responsibilities

### 4.1 Flutter Mobile (Customer)
Main responsibilities:
- browse/search/filter halls
- view hall details + similar halls
- create booking request
- show payment instructions (local deposit)
- upload deposit receipt image
- track booking status (pending/accepted/rejected)
- view profile and booking history

Non-responsibilities:
- receipt verification decisions
- hall management
- user management

### 4.2 React Dashboard (Owner + Admin)
Stack: React 18 + Vite + TailwindCSS + shadcn/ui.
Single web app; different UI and routes based on user role.

Owner responsibilities:
- manage hall listings (create/edit, photos, pricing, services, location)
- manage availability/calendar
- view booking requests
- review receipts and accept/reject bookings

Admin responsibilities:
- manage users (owners/customers)
- manage halls/listings (moderate/approve if enabled)
- view analytics/reporting (optional)

Security rule:
- UI is not security. Backend enforces role and ownership.

### 4.3 Express API (Backend)
Core responsibilities:
- authentication + authorization
- hall CRUD + browsing endpoints
- booking lifecycle management
- payment instructions (deposit accounts)
- receipt upload and review
- availability/calendar rules
- notifications (optional)
- recommendation endpoints (MVP rules)

---

## 5) Roles, Permissions, and Route Guarding

Roles:
- CUSTOMER
- OWNER
- ADMIN

Access enforcement:
1) Backend checks JWT + role + ownership for every protected endpoint.
2) Dashboard uses route guards to hide/block pages, but backend is the final authority.

Recommended dashboard routing:
- `/owner/*` pages for owners
- `/admin/*` pages for admins

---

## 6) Domain Modules (Backend)

Backend is organized by modules to keep features isolated and maintainable.

Suggested modules:
- `auth` — login/register, token issuing
- `users` — user profile, admin user management
- `halls` — hall listing CRUD, photos metadata, tags/services
- `availability` — blocked dates/time slots, maintenance closures
- `bookings` — booking request creation and status transitions
- `payments` — deposit instructions, owner bank accounts
- `receipts` — receipt upload, receipt status, owner review actions
- `recommendations` — home suggestions + similar halls
- `notifications` — push/email/sms (optional)

Module internal pattern (example):
- `*.routes.js` — Express router
- `*.controller.js` — request parsing + response formatting
- `*.service.js` — business logic
- `*.validation.js` — request validation rules
- `*.policy.js` — authorization helpers (optional)

---

## 7) Data Model (High Level)

Core entities (conceptual):

- User
  - id, name, phone/email, role (CUSTOMER/OWNER/ADMIN)

- Hall
  - id, ownerId, name, location, capacity, services, price rules, photos

- Availability
  - id, hallId, date/time range, type (blocked/booked/maintenance)

- Booking
  - id, hallId, customerId, date/time, status, totalPrice, notes

- OwnerBankAccount
  - id, ownerId, bankName, accountNumber, accountHolderName

- Receipt
  - id, bookingId, imageUrl/path, receiptStatus, reviewedBy, reviewedAt, rejectReason

Optional:
- Review/Rating
- Notifications
- BrowsingHistory (for recommendations)

---

## 8) Booking + Payment + Receipt Flow

### 8.1 Customer booking
1) Customer selects hall and date/time.
2) API creates booking with status `PENDING`.
3) Customer sees deposit instructions (owner bank accounts).
4) Customer deposits money externally.
5) Customer uploads receipt image; receiptStatus becomes `UPLOADED`.

### 8.2 Owner verification
1) Owner dashboard lists pending bookings for their halls.
2) Owner opens booking and views receipt image.
3) Owner verifies manually:
   - Accept: booking status → `ACCEPTED` (or `CONFIRMED` if you separate)
   - Reject: booking status → `REJECTED`, receiptStatus → `REJECTED`

### 8.3 Customer tracking
Customer sees booking status updates in the mobile app.

---

## 9) Recommendation (AI) Architecture (MVP)

MVP recommendations can start as simple logic inside backend:
- Home suggestions:
  - popular halls in city
  - halls with high rating
  - halls similar to user’s browsing history
- Similar halls:
  - same city
  - similar capacity bucket
  - similar price range
  - overlapping tags/services

Implementation guideline:
- Start with deterministic ranking (rules + weights).
- Later upgrade to ML-based ranking if needed.

Data inputs (optional):
- browsing history events
- booking conversion rates
- hall engagement metrics

---

## 10) API Contract (OpenAPI + Contracts)

Single source of truth:
- `packages/contracts/openapi.yaml`

Shared enums/rules:
- `packages/contracts/src/enums.js`
- `packages/contracts/src/rules.js`

Contract rules:
- Status values must be consistent in DB, API responses, and UI logic.
- Any endpoint changes must update OpenAPI and then code.

---

## 11) Environment Configuration

Each component has its own env settings.

API:
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `UPLOAD_DIR`

Dashboard:
- `VITE_API_BASE_URL`

Mobile:
- API base URL configurable via flavors or `--dart-define`

---

## 12) Deployment Architecture

### 12.1 URLs (recommended)
- API: `https://api.<domain>`
- Dashboard: `https://dashboard.<domain>`
- Mobile: app stores (calls API domain)

### 12.2 Deployment responsibilities
- Dashboard: build static files and deploy `apps/dashboard/dist/` to a static host or Nginx.
- API: deploy Express app on a server (Node/PM2 or Docker) behind Nginx + SSL.
- Database: hosted separately (managed DB or same VPS).
- Receipt storage:
  - MVP: server disk + backups
  - Scale: object storage (S3/R2/B2)

### 12.3 Nginx behavior
- Dashboard (SPA): must fallback to `index.html` for client routes.
- API: reverse proxy to Node service.

---

## 13) Observability and Logs (Recommended)
- API uses structured logs (route, status code, latency, userId when available).
- Basic health endpoint: `GET /health`.
- Centralized error handler middleware.

---

## 14) Non-Goals (Early Phases)
- Full online payment gateway integration (not used; deposits are external).
- Complex ML model training pipeline (start with rules-based ranking).
- Multi-tenant enterprise features (keep it simple for MVP).

---

## 15) Implementation Order (Recommended)
1) Auth + roles
2) Halls CRUD + hall browsing endpoints
3) Availability/calendar
4) Booking request creation
5) Payment instructions + receipt upload
6) Owner receipt review + accept/reject
7) Notifications (optional)
8) Recommendations (home + similar)
