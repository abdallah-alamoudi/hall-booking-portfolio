# API.md — Hall Booking System REST API (Express JS)

This API is used by:
- Customer mobile app (Flutter)
- Owner/Admin dashboard (React JS)

**Source of truth for full schemas:** `packages/contracts/openapi.yaml`  
This file is a short, human-friendly overview.

---

## 1) Base URL, Versioning, Formats

- Base URL (dev): `http://localhost:<PORT>`
- Base URL (prod): `https://api.<domain>`
- Version prefix: `/v1` (recommended)

Content types:
- JSON: `application/json`
- Receipt upload: `multipart/form-data`

---

## 2) Authentication

Protected endpoints require:

`Authorization: Bearer <token>`

Token payload minimum:
- `userId`
- `role` (`CUSTOMER` | `OWNER` | `ADMIN`)

---

## 3) Standard Responses

### 3.1 Error format (required)
`json`
```
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Common HTTP codes:
- `400` invalid request
- `401` unauthenticated
- `403` unauthorized
- `404` not found
- `409` conflict (e.g., booking overlap)
- `500` server error

### 3.2 Pagination (for list endpoints)
Query:
- `page` (default 1)
- `limit` (default 20, max 100)

Response:
`json`
```
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

---

## 4) Endpoints Summary

### 4.1 Health (public)
- `GET /v1/health` → `{ ok: true }`

### 4.2 Auth
- `POST /v1/auth/login` (public)
- `POST /v1/auth/register` (public)

Login request/response example:
`json`
```
{
  "identifier": "ali@example.com",
  "password": "StrongPassword123"
}
```

`json`
```
{
  "user": { "id": "u1", "role": "OWNER", "fullName": "Ali Ahmed" },
  "token": "<jwt>"
}
```

Register request/response example:
`json`
```
{
  "fullName": "Ali Ahmed",
  "email": "ali@example.com",
  "password": "StrongPassword123",
  "role": "CUSTOMER"
}
```

`json`
```
{
  "user": { "id": "u1", "role": "CUSTOMER", "fullName": "Ali Ahmed" },
  "token": "<jwt>"
}
```

### 4.3 Current user
- `GET /v1/users/me` (auth)

---

## 5) Halls

### 5.1 Public hall browsing (mobile + dashboard view)
- `GET /v1/halls` (public)

Filters (query params):
- `search` (name/area)
- `city`, `area`
- `minCapacity`, `maxCapacity`
- `minPrice`, `maxPrice`
- `serviceIds=1,2,3`
- `page`, `limit`, `sort=createdAt:desc`

- `GET /v1/halls/:hallId` (public) → full hall details (photos + services)

### 5.2 Owner hall management (OWNER)
- `POST /v1/owner/halls`
- `PATCH /v1/owner/halls/:hallId`
- `DELETE /v1/owner/halls/:hallId` (optional; prefer soft delete)

### 5.3 Services/tags (public)
- `GET /v1/services`

---

## 6) Availability

Public:
- `GET /v1/halls/:hallId/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`

Owner:
- `POST /v1/owner/halls/:hallId/availability`
- `DELETE /v1/owner/availability/:blockId`

Availability block payload:
`json`
```
{
  "startAt": "2026-02-10T10:00:00Z",
  "endAt": "2026-02-10T22:00:00Z",
  "type": "BLOCKED",
  "note": "Maintenance"
}
```

---

## 7) Deposit Accounts (Owner bank accounts)

Public (policy choice: either public or only shown after booking):
- `GET /v1/halls/:hallId/bank-accounts`

Owner:
- `GET /v1/owner/bank-accounts`
- `POST /v1/owner/bank-accounts`
- `PATCH /v1/owner/bank-accounts/:id`
- `DELETE /v1/owner/bank-accounts/:id`

Bank account payload:
`json`
```
{
  "bankName": "Local Bank",
  "accountHolderName": "Owner Name",
  "accountNumber": "1234567890",
  "iban": ""
}
```

---

## 8) Bookings

Customer:
- `POST /v1/bookings` (create booking request; status starts `PENDING`)
- `GET /v1/bookings/me` (list own bookings)
- `GET /v1/bookings/:bookingId` (own booking only)

Booking create payload example:
`json`
```
{
  "hallId": "h1",
  "startAt": "2026-02-20T18:00:00Z",
  "endAt": "2026-02-20T23:00:00Z",
  "guestCount": 400,
  "customerNote": "Need extra chairs"
}
```

Errors:
- `409 BOOKING_CONFLICT` if overlaps with accepted/confirmed bookings or blocked times (policy).

Optional:
- `POST /v1/bookings/:bookingId/cancel` (if pending only)

Owner:
- can view bookings for their halls via a dedicated endpoint:
  - `GET /v1/owner/bookings?status=PENDING&page=1&limit=20`
- `GET /v1/owner/bookings/:bookingId` (must belong to owner hall)

---

## 9) Receipts (Deposit proof)

Customer:
- `POST /v1/bookings/:bookingId/receipt` (multipart/form-data; field name: `receipt`)
- `GET /v1/bookings/:bookingId/receipt`

Upload response example:
`json`
```
{
  "id": "r1",
  "bookingId": "b1",
  "status": "UPLOADED",
  "imageUrl": "https://.../receipts/r1.jpg",
  "createdAt": "2026-02-02T12:10:00Z"
}
```

Owner decision (OWNER; must own hall of the booking):
- `POST /v1/owner/bookings/:bookingId/accept`
- `POST /v1/owner/bookings/:bookingId/reject`

Reject payload:
`json`
```
{ "rejectReason": "Receipt amount does not match" }
```

Decision response (example):
`json`
```
{
  "bookingId": "b1",
  "status": "ACCEPTED",
  "ownerDecisionAt": "2026-02-02T12:20:00Z"
}
```

---

## 10) Recommendations (MVP)

- `GET /v1/recommendations/home?city=Sanaa` (public or customer)
- `GET /v1/halls/:hallId/similar` (public)

MVP logic can be rules-based (same city + similar capacity + similar price + shared services).

---

## 11) Admin (minimal)

Admin-only:
- `GET /v1/admin/users`
- `PATCH /v1/admin/users/:userId` (e.g., deactivate)
- `GET /v1/admin/halls`
- `PATCH /v1/admin/halls/:hallId` (e.g., suspend)

---

## 12) Authorization Matrix (quick)

Public:
- `/health`, `/halls`, `/halls/:id`, `/services`, (optionally) recommendations

CUSTOMER:
- `/bookings`, `/bookings/me`, `/bookings/:id` (own), `/bookings/:id/receipt`

OWNER:
- `/owner/halls/*`, `/owner/availability/*`, `/owner/bank-accounts/*`,
- `/owner/bookings/*` (only for their halls)

ADMIN:
- `/admin/*`

---

## 13) Policies to decide (write and keep consistent)

1) Receipt required before owner decision? (recommended: yes)
2) When owner rejects: reject booking immediately OR allow re-upload?
3) Overlap policy: check at booking creation or at acceptance (recommended: enforce at acceptance)
4) Bank accounts visibility: public OR only after booking creation?

End of API.md
