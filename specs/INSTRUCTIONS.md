# INSTRUCTIONS.md — Hall Booking Monorepo Rules (AI + Dev)

This repository is a monorepo for a Hall Booking system:

- Customer mobile app: Flutter (Dart)
- Owner/Admin dashboard: React (JavaScript) — single dashboard app with role-based access
- Backend API: Node.js + Express (JavaScript)
- Shared contracts: enums/rules/OpenAPI under `packages/contracts`

These instructions are mandatory for any AI coding agent or contributor.

---

## 1) Core Principles

### 1.1 Single Source of Truth

- Business rules and statuses must be defined once in `packages/contracts`.
- API contract must be documented in `packages/contracts/openapi.yaml`.
- If a change is needed, update in this order:
  1. contracts (enums/rules/openapi)
  2. backend implementation
  3. dashboard/mobile clients

### 1.2 Feature-first development

- Work feature-by-feature.
- Each feature has a folder under `specs/features/Fxx-<name>/`.
- Do not implement unrelated features in the same change.

### 1.3 No breaking changes without a migration plan

- Prefer additive changes (add fields/endpoints) over breaking changes.
- If a field/enum value must change:
  - document it in specs
  - implement a migration strategy
  - keep backward compatibility if possible

---

## 2) Repository Layout (Must Follow)

Top-level folders:

- `apps/dashboard` — React JS owner/admin dashboard
- `apps/mobile` — Flutter customer app
- `services/api` — Express JS backend
- `packages/contracts` — shared enums/rules + OpenAPI
- `specs` — docs and feature PRDs
- `infra` — deployment configs (nginx/docker)
- `scripts` — helper scripts

Do not place backend code in `apps/` or UI code in `services/`.

---

## 3) Roles and Permissions

### 3.1 Roles

Roles are:

- `CUSTOMER`
- `OWNER`
- `ADMIN`

Roles must come from `packages/contracts/src/enums.js`.

### 3.2 Authorization Rules (High level)

CUSTOMER:

- browse halls
- create booking requests
- upload receipt for their booking
- view their bookings/status

OWNER:

- CRUD their own halls
- manage availability/calendar for their halls
- view booking requests for their halls
- verify receipt and accept/reject bookings

ADMIN:

- manage users (owners/customers)
- manage halls/listings (moderation/approval if enabled)
- analytics/reporting (optional)

Dashboard is one app. Admin/Owner access is enforced by:

- backend authorization checks
- dashboard route guards

Never rely on UI checks alone.

---

## 4) Statuses (Must Be Consistent Everywhere)

### 4.1 BookingStatus

Common flow:

- `PENDING` → `ACCEPTED` or `REJECTED`

Optional:

- `CANCELLED` (customer cancels)
- `CONFIRMED` (if you separate accepted vs confirmed)

### 4.2 ReceiptStatus

Common flow:

- `UPLOADED` → `VERIFIED` or `REJECTED`

All status values must be taken from `packages/contracts`.

---

## 5) Backend (Express) Rules

### 5.1 Structure

Backend must be organized by modules:
`services/api/src/modules/<moduleName>/...`

Each module should contain:

- `*.routes.js`
- `*.controller.js`
- `*.service.js`
- `*.validation.js` (optional)
- `*.policy.js` (optional)

### 5.1.1 ORM (Prisma)

- Use Prisma for database access and migrations.
- Prisma schema lives at `services/api/prisma/schema.prisma`.

### 5.2 API conventions

- Use REST endpoints.
- Use JSON.
- Use a consistent error format:

`json`
{
"error": {
"code": "SOME_CODE",
"message": "Human readable message",
"details": {}
}
}

### 5.3 Authentication

- Prefer JWT in the header: `Authorization: Bearer <token>`.
- Token payload must include at least:
  - `userId`
  - `role` (one of `CUSTOMER`, `OWNER`, `ADMIN`)
- Auth middleware must:
  - verify token signature and expiry
  - attach `req.user = { userId, role }`
- Authorization must be enforced in backend controllers/services:
  - do not rely on frontend route guards for security

### 5.4 Validation and ownership

- Validate input in controllers or middleware (or a dedicated validation layer).
- Never trust client input.
- Enforce ownership checks in the backend:
  - Owners can only access their own halls/bookings/receipts.
  - Customers can only access their own bookings/receipts.
- Use clear “policy checks” before data access (e.g., `ensureOwnerOwnsHall(ownerId, hallId)`).

### 5.5 File uploads (receipts)

- Accept receipt image uploads:
  - size limit defined in contracts rules
  - allowlist mime types (jpeg/png)
- Store on disk for MVP or object storage later.
- Save only references (path or URL) in DB (do not store raw file blobs in DB for MVP).
- Security requirements:
  - generate server-side filenames (never trust user-provided filenames)
  - validate mime type AND file extension
  - limit upload size and reject oversized files
  - store uploads outside of source code folders
  - never allow path traversal in upload paths

---

## 6) Dashboard (React JS) Rules

### 6.1 Structure

- Use feature-based structure:
  `apps/dashboard/src/features/<featureName>/...`
- Shared code:
  `apps/dashboard/src/shared/...`

### 6.2 Role-based routing

Routes must be guarded:

- `/owner/*` requires `OWNER`
- `/admin/*` requires `ADMIN`

### 6.3 API access

- All API calls go through a single API client wrapper:
  `apps/dashboard/src/shared/api/...`
- API base URL must come from env: `VITE_API_BASE_URL`.
- Handle auth centrally:
  - attach `Authorization` header in one place
  - handle 401/403 consistently

---

### 6.4 Styling

- Use **TailwindCSS** for all styling.
- Use **shadcn/ui** for UI components.
- Do not write custom CSS unless absolutely necessary.
- Follow the design system tokens.

---

## 7) Mobile (Flutter) Rules

### 7.1 Scope

Mobile is for customers only:

- browse halls
- booking request
- receipt upload
- booking status tracking
- AI suggestions display

### 7.2 API base URL

Must be configurable per environment (dev/staging/prod).

---

## 8) Contracts Package Rules

### 8.1 What belongs in contracts

- enums (Roles, BookingStatus, ReceiptStatus)
- shared constants (max file size, allowed mime types)
- OpenAPI spec (`openapi.yaml`)

### 8.2 What does not belong in contracts

- database models
- UI components
- business logic implementation
- secrets

---

## 9) Specs and Documentation Rules

### 9.1 Keep specs updated

When implementing or changing a feature:

- update `specs/features/Fxx-.../PRD.md`
- update `packages/contracts/openapi.yaml`
- update schema notes if needed

### 9.2 Naming consistency

- Feature folders: `F01-<kebab-case-name>`
- Use consistent terms across the repo:
  - “hall” not “venue”
  - “receipt” not “invoice”

---

## 10) Testing (Minimum Expectations)

- Backend: basic tests for critical flows (auth, booking status transitions)
- Dashboard: smoke tests for routing and guards
- Never merge changes that break `npm run dev` or `npm run build`.

---

## 11) Environment Variables

Do not commit real secrets. Each app/service must have a `.env.example`.

Minimum:
API:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `UPLOAD_DIR`

Dashboard:

- `VITE_API_BASE_URL`

---

## 12) Deployment Notes (High Level)

- Dashboard: build to static files and deploy `dist/`
- Backend: run Node server (PM2/Docker) behind Nginx/SSL
- Contracts: not deployed alone; included as dependency/build input

---

## 13) Working Agreement for AI Agents

When asked to implement something:

1. Read `specs/` and `packages/contracts/openapi.yaml` first.
2. Propose changes before breaking existing API/status values.
3. Implement minimal, incremental changes.
4. Update docs + contracts + code together.
5. Stop after completing the requested feature. Do not expand scope.

### 13.1 Dependency Management (CRITICAL)

- **Don't reinvent the wheel**: If an open-source library or package exists to achieve a goal or task, prefer it over custom code.
- **Before adding ANY new npm package or library**:
  - Research all available options.
  - List the pros/cons of each (size, popularity, maintenance, ease of use).
  - **Ask the USER for permission** and wait for them to choose an option before proceeding with installation.
  - Never install a package silently.

## 14) Documentation + Contracts Update Rule

Any time you change behavior, fields, statuses, or endpoints, you MUST update in the same change:

1. `packages/contracts` (enums/rules and `openapi.yaml` if affected)
2. `specs/SCHEMA.md` if DB/entities changed
3. `specs/API.md` or `openapi.yaml` if API changed
4. `specs/UX_FLOWS.md` if user flow/screens changed

If you do not update these, the change is considered incomplete.

## 15) Definition of Done (DoD)
A feature is done only if:
- Code works (API + dashboard + mobile scope as agreed)
- Contracts/OpenAPI updated
- Schema doc updated if needed
- Feature specs updated
- Tests updated/added (at least basic smoke)
