# F03 - Booking Flow (Core)

## Problem Statement
Customers need a reliable way to request a hall booking for a specific date, and owners need a workflow to review and manage these requests.

## Scope
In scope:
- `POST /v1/bookings` (Customer: create request)
- `GET /v1/bookings` (Customer: view my bookings)
- `GET /v1/owner/bookings` (Owner: view hall bookings)
- Mobile booking UI with calendar constraints
- Dashboard booking list UI

## Functional Requirements
- Customer picks an available date from the calendar.
- Calendar MUST disable/grey out dates that are already busy (Ref: F02).
- Booking is created with `status = PENDING`.
- Status remains `PENDING` until a receipt is uploaded and verified (Ref: Phase 5).

## UI Requirements
- **Mobile**: Interactive date picker that enforces availability constraints.
- **Dashboard**: List view for owners to see incoming requests.

## Acceptance Criteria
- Customer can only create a booking for an available date.
- Booking status is correctly tracked in the database.
- Mobile UI prevents selection of greyed-out (busy) dates.
