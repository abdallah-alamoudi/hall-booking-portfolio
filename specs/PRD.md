# PRD.md — Hall Booking System (Customer Mobile + Owner/Admin Dashboard + API)

## 1) Product Summary

Hall Booking is a marketplace and reservation system for event halls. Customers can discover halls, compare options, and request bookings through a mobile app. Hall owners manage listings and booking requests through a web dashboard. Payments are handled via **local bank deposit** (not online cards), and customers upload a **deposit receipt** that owners verify manually to accept or reject bookings. The system also provides **AI-based recommendations** (suggest halls on home screen and show similar halls on hall details).

---

## 2) Goals and Success Criteria

### 2.1 Goals

- Make it easy for customers to find and book a hall without calling multiple owners.
- Provide owners with a simple workflow to manage halls, availability, and booking requests.
- Support local payment reality: deposits to owner’s bank accounts + receipt verification.
- Improve discovery with recommendations (home suggestions + similar halls).
- Keep system reliable, role-secure, and scalable for more halls and users.

### 2.2 Success Criteria (MVP)

- Customers can browse halls, request a booking, and upload a receipt.
- Owners can review receipt and accept/reject booking.
- Customers can see live booking status changes.
- Admin can manage users/halls (at minimum: view/list, optionally moderate).
- Recommendations show on home screen and hall detail page.
- Core flows work end-to-end without manual database edits.

---

## 3) Target Users and Personas

### 3.1 Customer (Mobile App)

Needs:

- Fast search/browse with filters
- Clear hall details (photos, capacity, services, location)
- Simple booking request flow
- Clear payment instructions and receipt upload
- Status tracking (pending/accepted/rejected)

### 3.2 Hall Owner (Dashboard)

Needs:

- Create/manage hall listing and pricing
- Manage availability calendar
- Receive booking requests and review receipt images
- Accept/reject bookings with clear reasons and timestamps
- See upcoming confirmed bookings

### 3.3 Admin (Dashboard)

Needs:

- Manage users (owners/customers)
- Manage halls (approve, suspend, edit if needed)
- Monitor platform activity and basic analytics (optional in MVP)

---

## 4) Problem Statement

Customers in local markets often book halls through phone calls and messaging, which is time-consuming and unorganized. Owners lose track of requests, availability, and payment confirmations. Online payment options may not be available, so the product must support local deposit payments with proof verification.

---

## 5) Scope

### 5.1 In Scope (MVP)

Customer:

- browse/search/filter halls
- view hall details
- view recommended halls on home screen
- view similar halls on hall details
- create booking request (select date/time)
- see deposit instructions (owner bank accounts)
- upload deposit receipt image
- track booking status and history

Owner:

- login
- create/edit hall listing (basic fields + photos upload via plain button)
- manage availability (block dates/slots)
- view booking requests
- open booking request and view receipt
- accept/reject booking (with reason on rejection)

Admin:

- login
- view/manage users (at least list + deactivate)
- view/manage halls (at least list + deactivate; approval optional)

System:

- role-based authorization (CUSTOMER/OWNER/ADMIN)
- file upload handling for receipts
- consistent status handling and audit timestamps

### 5.2 Out of Scope (MVP)

- Online payment gateway integration (Visa/Mastercard)
- Automated fraud detection for receipts
- Advanced ML model training pipeline
- Full dispute resolution workflow (can be added later)
- Multi-language UI (optional later)
- Complex dynamic pricing engine (optional later)

---

## 6) Key Features (Functional Requirements)

### F01 — Hall Discovery (Customer)

- Customer can browse halls and see:
  - name, location, main photo, starting price, capacity, rating (optional)
- Customer can filter:
  - city/area, capacity range, price range, services/tags (parking, catering, stage, etc.)
- Customer can search by hall name or area.

Acceptance (MVP):

- Halls list loads quickly and supports pagination or infinite scroll.

---

### F02 — Hall Detail Page (Customer)

- Show:
  - photos gallery
  - description
  - location map link
  - capacity
  - services/tags
  - pricing summary
  - availability summary (optional)
- Show “Similar halls” section.

Acceptance (MVP):

- Customer can open hall detail and view similar halls suggestions.

---

### F03 — Booking Request (Customer)

- Customer selects:
  - date (using a calendar UI)
  - time slot (or start/end)
  - optional notes and guest count
- **Constraint**: The calendar UI MUST disable (grey out) any dates that are already booked or blocked by the owner.
- System creates booking with `status = PENDING`.

Acceptance (MVP):

- Booking created and appears in customer booking list as PENDING.
- **Mobile UI**: Customer cannot select a date that is already busy (visual feedback provided).

---

### F04 — Payment via Deposit + Receipt Upload (Customer)

- Hall owner has saved bank accounts (one or more).
- Customer sees deposit instructions:
  - bank name, account number, account holder
- Customer uploads receipt image linked to booking:
  - receiptStatus = `UPLOADED`

Acceptance (MVP):

- Customer can upload receipt successfully and see upload status.

---

### F05 — Owner Receipt Verification (Owner)

- Owner sees all booking requests for their halls.
- Owner opens a booking:
  - sees receipt image
  - sees booking details (date/time, customer info, expected price)
- Owner actions:
  - Accept booking → booking status becomes `ACCEPTED` (or `CONFIRMED`)
  - Reject booking → booking status becomes `REJECTED`, store rejection reason

Acceptance (MVP):

- Owner decision updates booking status visible to customer.

---

### F06 — Admin Management (Admin)

Minimum:

- view list of users and halls
- deactivate/suspend a user or hall (optional but recommended)

Acceptance (MVP):

- Admin can prevent a hall from appearing by suspending it.

---

### F07 — Recommendations (MVP)

Home screen recommendations:

- show top halls using simple ranking:
  - popularity, rating (if exists), location match, price/capacity match
    Similar halls:
- show alternatives based on:
  - same city
  - similar capacity bucket
  - similar price range
  - overlapping services/tags

Acceptance (MVP):

- Customer sees recommendations carousels on home screen and similar halls on hall detail.

---

## 7) Non-Functional Requirements

### 7.1 Security

- JWT authentication
- Role-based authorization on backend
- Owners restricted to their own data
- Validate uploads (type, size) and prevent path traversal
- Store secrets in env vars only

### 7.2 Performance

- Halls list must be paginated
- Images should be optimized on client side (thumbnails)
- API responses should be consistent and avoid overfetching

### 7.3 Reliability

- Booking and receipt operations must be transactional (as much as possible)
- Avoid double-booking by checking availability before accepting booking

### 7.4 Observability

- Logging for key actions (booking created, receipt uploaded, booking accepted/rejected)
- Health endpoint `/health`

---

## 8) Core User Journeys

### Journey A — Customer books a hall using deposit receipt

1. Open mobile → see recommended halls
2. Browse/filter/search halls
3. Open hall detail → see similar halls
4. Select date/time → create booking request (PENDING)
5. See deposit instructions → deposit externally
6. Upload receipt → receiptStatus UPLOADED
7. Wait for owner decision
8. Booking becomes ACCEPTED or REJECTED

### Journey B — Owner verifies receipt and confirms booking

1. Owner logs in dashboard
2. Sees booking requests
3. Opens booking → views receipt and details
4. Accepts or rejects with reason
5. Customer receives status update

### Journey C — Admin moderates platform (basic)

1. Admin logs in
2. Views users/halls list
3. Suspends a hall/user if needed

---

## 9) Assumptions and Constraints

- Payment is done externally via bank deposit; system stores only receipt proof and status.
- Receipt verification is manual by the hall owner (MVP).
- Mobile is customer-only; owners/admin use the dashboard.
- Internet connectivity may be unstable; clients should handle retry and show clear status messages.

---

## 10) Risks and Mitigations

- Fake receipts:
  - Mitigation: manual verification + audit trail + optional admin review later
- Double-booking:
  - Mitigation: enforce availability checks and status locking during acceptance
- Mismatched statuses across apps:
  - Mitigation: shared contracts + OpenAPI spec

---

## 11) MVP Release Checklist

- Auth + roles working end-to-end
- Halls browsing and details working
- Booking request creation working
- Deposit instructions visible
- Receipt upload working
- Owner accept/reject working
- Customer status tracking working
- Admin basic management working
- Recommendations displayed (MVP logic)
- Deployment plan verified for API + dashboard, and mobile build configuration set

End of PRD.
