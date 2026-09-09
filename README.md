# Hall Booking Platform

A work-in-progress hall marketplace and booking platform, presented as a software engineering portfolio project. The repository contains an Express API, a React owner dashboard, and a Flutter customer app.

**Backend focus:** relational data modeling, role and ownership checks, booking availability, receipt review, and concurrency handling.

## Implemented in this snapshot

- Registration and login using bcrypt password hashing and JWT access tokens.
- Customer, owner, and admin role definitions, with role checks on protected routes and ownership checks in services.
- Hall listings, owner hall management, photos, amenities, bank-account details, and prices for morning, evening, and full-day slots.
- Owner availability blocks and customer booking requests with receipt uploads.
- Booking review and receipt re-upload flows.
- MySQL named locks around booking creation and acceptance, with transaction-based updates in the acceptance flow.
- Jest/Supertest tests, including concurrent booking and acceptance scenarios.

These are implementation descriptions, not a claim of production readiness or a passing test run. See [known limitations](docs/KNOWN_LIMITATIONS.md).

## Technology

| Area | Stack |
| --- | --- |
| API | JavaScript, Node.js, Express |
| Database | MySQL 8+, Prisma, SQL migrations |
| Authentication | JWT, bcrypt |
| Tests | Jest, Supertest |
| Dashboard | React, Vite, Tailwind CSS |
| Mobile | Flutter, Dart, Riverpod, Dio |

## Start your review here

- [Booking service](services/api/src/modules/bookings/bookings.service.js): slot conflicts, locking, receipt review.
- [Database schema](services/api/prisma/schema.prisma): users, halls, prices, availability, bookings, and receipts.
- [Authentication and role middleware](services/api/src/middleware/auth.js).
- [Concurrent booking tests](services/api/tests/booking.conflicts.test.js).
- [API description](packages/contracts/openapi.yaml): a reference that may lag implementation; routes and tests are authoritative.

## Run locally

Requirements: Node.js 20+, npm 10+, and MySQL 8+. Flutter is optional for reviewing the API and dashboard.

1. Clone this repository and run `npm ci` in its root directory.
2. Create a local MySQL database named `hall_booking` and a local database user with access to it.
3. Copy `services/api/.env.example` to `services/api/.env` and `apps/dashboard/.env.example` to `apps/dashboard/.env`.
4. Set your own `DATABASE_URL`, a strong random `JWT_SECRET`, and a local `SEED_PASSWORD` of at least 12 characters. Do not commit these files.
5. From the repository root, run:

```sh
npm --workspace services/api exec prisma generate
npm --workspace services/api exec prisma migrate deploy
npm --workspace services/api exec prisma db seed
npm run dev
```

API: `http://localhost:4000/v1`  
Dashboard: `http://localhost:5173`

The optional seed creates fictional local accounts:

| Role | Email |
| --- | --- |
| Owner | owner1@example.com |
| Customer | customer1@example.com |
| Admin | admin@example.com |

They use the password you supplied through `SEED_PASSWORD`. The seed is disabled when `NODE_ENV=production`. Demo bank information is fictional and must not be used for payments.

### Mobile app

Use the pinned Flutter SDK through FVM:

```sh
cd apps/mobile
fvm install
fvm flutter pub get
fvm flutter run --dart-define=API_BASE_URL=http://localhost:4000/v1
```

For the Android emulator, use `http://10.0.2.2:4000/v1`. A physical device needs a reachable development-server address. The API URL is configured by `--dart-define`; the mobile `.env.example` is illustrative and is not automatically loaded.

### Tests

**Use a separate disposable database, such as `hall_booking_test`. Tests delete records. Never point them at real or shared data.** Set `DATABASE_URL` to the test database, set `JWT_SECRET` to a local test value, and apply migrations before running:

```sh
npm --workspace services/api exec prisma migrate deploy
npm --workspace services/api test -- --runInBand
```

Run serially because several suites reset shared tables. Restore your development database configuration afterward. Database tests have not been executed as part of preparing this public snapshot.

### Dashboard build

```sh
npm run build
```

## Suggested demonstration

1. Sign in as a demo owner and show hall prices and availability.
2. Use the customer app to request a booking with a synthetic receipt image.
3. Show how a full-day booking conflicts with a morning slot on the same date.
4. Review the booking from the owner dashboard.
5. Explain the concurrency tests and the remaining edge cases listed in the limitations document.

## Repository layout

- `services/api`: API, Prisma schema/migrations, and tests.
- `apps/dashboard`: owner dashboard and role-specific screens.
- `apps/mobile`: Flutter customer application source and platform projects.
- `packages/contracts`: shared enums, rules, and API reference.
- `specs`: design notes; some describe planned functionality.
- `infra`: development infrastructure sketches, not a complete production deployment.

## About this portfolio copy

Prepared from a single project snapshot with no original Git history. Diagnostic output and one-off debugging scripts were omitted. Local environment examples are placeholders; uploaded customer files and database dumps are not included. See [snapshot notes](docs/PORTFOLIO_NOTES.md).

The project is provided for review. No open-source license is granted by this repository unless a license is added by its owner. Third-party dependencies retain their respective licenses.
