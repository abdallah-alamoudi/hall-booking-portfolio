# SCHEMA.md — Hall Booking System Data Model (MVP)

This document defines the MVP data schema for the Hall Booking system (Flutter customer app, React owner/admin dashboard, Express API). It focuses on the entities needed for: halls browsing, booking requests, deposit payment instructions, receipt upload, and owner verification.

> Notes:
> - Field types are described in a DB-agnostic way (works for PostgreSQL/MySQL).  
> - Use migrations as the real source of truth once implemented.
> - Enum values must match `packages/contracts`.
> - ORM: Prisma. Schema file lives at `services/api/prisma/schema.prisma`.

---

## 1) Shared Enums (from contracts)

### 1.1 Roles
- `CUSTOMER`
- `OWNER`
- `ADMIN`

### 1.2 BookingStatus
MVP required:
- `PENDING`
- `ACCEPTED`
- `REJECTED`

Optional (recommended):
- `CANCELLED`
- `CONFIRMED` (if you separate accepted vs confirmed)

### 1.3 ReceiptStatus
MVP required:
- `UPLOADED`
- `VERIFIED`
- `REJECTED`

---

## 2) Tables / Collections

## 2.1 users
Stores customers, owners, and admins.

**Fields**
- `id` (PK, uuid/int)
- `role` (enum Roles, indexed)
- `fullName` (string)
- `phone` (string, unique, nullable if using email)
- `email` (string, unique, nullable if using phone)
- `passwordHash` (string) *(if local auth)*
- `isActive` (boolean, default true)
- `createdAt` (datetime)
- `updatedAt` (datetime)

**Notes**
- You may add `lastLoginAt`.
- If using OTP login, passwordHash can be nullable.
 - Prisma implementation uses `cuid()` for ids by default.
 - Passwords are stored as bcrypt hashes (never plaintext).

---

## 2.2 halls
Represents an event hall listing.

**Fields**
- `id` (PK)
- `ownerId` (FK → users.id, required, indexed) *(role should be OWNER)*
- `name` (string, required)
- `description` (text, optional)
- `city` (string, indexed)
- `area` (string, optional)
- `address` (string, optional)
- `latitude` (decimal, optional)
- `longitude` (decimal, optional)

- `capacity` (int, required)
- `basePrice` (decimal, required) *(starting price or package price)*
- `currency` (string, default local currency code)
- `pricingType` (string, optional) *(e.g., PER_DAY / PER_HOUR / PACKAGE)*

- `status` (string, default "ACTIVE") *(ACTIVE/SUSPENDED/DELETED or enum later)*
- `createdAt` (datetime)
- `updatedAt` (datetime)

**Notes**
- Keep it simple for MVP: `basePrice` + `pricingType`.
- Add advanced pricing later if needed.

---

## 2.3 hall_photos
Stores photo metadata for a hall (URLs/paths). Actual images stored on disk/object storage.

**Fields**
- `id` (PK)
- `hallId` (FK → halls.id, indexed)
- `url` (string, required)
- `isCover` (boolean, default false)
- `sortOrder` (int, default 0)
- `createdAt` (datetime)

**Notes**
- You can store `storageKey` if using S3/R2.

---

## 2.4 hall_services
Optional tags/services for filtering (parking, catering, stage, AC, etc.).

**Fields**
- `id` (PK)
- `name` (string, unique) *(e.g., "Parking", "Catering")*

---

## 2.5 hall_service_map
Many-to-many relationship between halls and services.

**Fields**
- `hallId` (FK → halls.id)
- `serviceId` (FK → hall_services.id)

**Indexes**
- (hallId, serviceId) unique

---

## 2.6 availability_blocks
Stores availability blocks (owner blocks dates/time ranges). This helps prevent accepting bookings in blocked times.

**Fields**
- `id` (PK)
- `hallId` (FK → halls.id, indexed)
- `startAt` (datetime, required)
- `endAt` (datetime, required)
- `type` (string, required) *(BLOCKED / MAINTENANCE / BOOKED)*
- `note` (string, optional)
- `createdAt` (datetime)
- `updatedAt` (datetime)

**Notes**
- You can create `BOOKED` blocks automatically when booking is accepted/confirmed.

---

## 2.7 owner_bank_accounts
Owners can provide multiple bank accounts for deposits.

**Fields**
- `id` (PK)
- `ownerId` (FK → users.id, indexed)
- `bankName` (string, required)
- `accountHolderName` (string, required)
- `accountNumber` (string, required) *(string to preserve formatting)*
- `iban` (string, optional)
- `isActive` (boolean, default true)
- `createdAt` (datetime)
- `updatedAt` (datetime)

**Notes**
- This data is shown to customers during the payment step.

---

## 2.8 bookings
Stores customer booking requests and their lifecycle.

**Fields**
- `id` (PK)
- `hallId` (FK → halls.id, indexed)
- `customerId` (FK → users.id, indexed) *(role CUSTOMER)*
- `status` (enum BookingStatus, indexed, default PENDING)

- `startAt` (datetime, required)
- `endAt` (datetime, required)
- `guestCount` (int, optional)
- `customerNote` (text, optional)

- `totalPrice` (decimal, optional) *(can be calculated later)*
- `currency` (string, default local currency code)

- `ownerDecisionAt` (datetime, optional)
- `ownerDecisionBy` (FK → users.id, optional) *(owner who accepted/rejected)*
- `rejectReason` (string/text, optional)

- `createdAt` (datetime)
- `updatedAt` (datetime)

**Important Constraints**
- Prevent overlapping accepted bookings for the same hall and time range.
- For MVP, enforce overlap check at acceptance time.

**Indexes**
- (hallId, startAt, endAt)
- (customerId, status)
- (status, createdAt)

---

## 2.9 receipts
Represents deposit receipt uploaded by customer for a booking.

**Fields**
- `id` (PK)
- `bookingId` (FK → bookings.id, unique, indexed) *(MVP: one receipt per booking)*
- `uploadedBy` (FK → users.id, indexed) *(customer)*

- `imageUrl` (string, required) *(or `imagePath` for local storage)*
- `status` (enum ReceiptStatus, indexed, default UPLOADED)

- `reviewedBy` (FK → users.id, optional) *(owner or admin)*
- `reviewedAt` (datetime, optional)
- `rejectReason` (string/text, optional)

- `createdAt` (datetime)
- `updatedAt` (datetime)

**Notes**
- If you want multiple receipt attempts later, remove unique constraint on bookingId and add `attemptNumber`.

---

## 2.10 recommendations_events (optional, for better AI later)
Stores browsing events to improve recommendations.

**Fields**
- `id` (PK)
- `userId` (FK → users.id, indexed)
- `eventType` (string) *(VIEW_HALL / SEARCH / BOOKING_STARTED / BOOKING_COMPLETED)*
- `hallId` (FK → halls.id, nullable)
- `metadata` (json, optional) *(filters used, etc.)*
- `createdAt` (datetime)

**Notes**
- This is optional for MVP; recommendations can start rule-based without it.

---

## 3) Relationships Summary
- users(OWNER) 1—N halls
- halls 1—N hall_photos
- halls N—M hall_services via hall_service_map
- halls 1—N availability_blocks
- users(OWNER) 1—N owner_bank_accounts
- users(CUSTOMER) 1—N bookings
- halls 1—N bookings
- bookings 1—0..1 receipts (MVP)

---

## 4) Data Integrity Rules (Must Enforce)

### 4.1 Ownership
- Owners can only modify:
  - their own halls
  - availability for their halls
  - bank accounts for their profile
  - bookings for their halls (accept/reject)
  - receipts for bookings of their halls (review)

### 4.2 Booking overlap
- A hall must not have two ACCEPTED/CONFIRMED bookings overlapping in time.
- On acceptance:
  - check overlap against existing accepted/confirmed bookings and blocked maintenance blocks
  - if conflict, reject acceptance with error

### 4.3 Receipt lifecycle
- Receipt `UPLOADED` is created by customer.
- Receipt becomes `VERIFIED` or `REJECTED` only by owner/admin.
- When receipt is rejected, booking may remain `PENDING` (allow re-upload) OR booking becomes `REJECTED` depending on your policy.
  - MVP recommended: owner decision rejects booking = booking status `REJECTED`.

---

## 5) Minimal Audit Fields
All tables should have:
- `createdAt`
- `updatedAt`

Additionally recommended:
- for bookings: `ownerDecisionAt`, `ownerDecisionBy`
- for receipts: `reviewedAt`, `reviewedBy`

---

## 6) MVP Schema Checklist
MVP requires at minimum:
- users
- halls
- hall_photos (optional but recommended)
- owner_bank_accounts
- bookings
- receipts
- availability_blocks (recommended early to prevent conflicts)

End of schema.
