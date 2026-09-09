# UX_FLOWS.md — Hall Booking System (Mobile + Dashboard)

This document defines the user experience flows (screens + steps + states) for:

- Customer Mobile App (Flutter)
- Owner/Admin Dashboard (React JS)
- Shared auth/session behaviors

> Notes:
>
> - This is an MVP-first UX spec (clear, buildable).
> - Backend enforces roles and ownership; UI guards are for UX only.
> - Status values must match `packages/contracts` (Roles, BookingStatus, ReceiptStatus).

---

## 0) Terminology

azq

- **Hall**: event venue listing created by an owner.
- **Booking**: a customer booking request for a hall time range.
- **Deposit**: customer pays by depositing money into owner bank account(s) outside the app.
- **Receipt**: customer uploads deposit slip image as proof.
- **BookingStatus** (MVP): `PENDING`, `ACCEPTED`, `REJECTED` (optional later: `CANCELLED`, `CONFIRMED`)
- **ReceiptStatus** (MVP): `UPLOADED`, `VERIFIED`, `REJECTED`

---

## 1) Global UX Rules (All Apps)

### 1.1 Loading / Empty / Error states

Every screen that fetches data must handle:

- Loading state (skeleton/spinner)
- Empty state (friendly message + action)
- Error state (retry button + short error message)

### 1.2 Session + Auth

- If user is unauthenticated and tries to access protected pages:
  - Mobile: redirect to Login screen
  - Dashboard: redirect to `/login`
- Token expiry:
  - show “Session expired” message
  - log out and redirect to login

### 1.3 Date/Time

- Always show local timezone (and store in UTC server-side if possible).
- Prevent invalid ranges (end before start).
- For MVP: choose **either**:
  - A) simple “Date + Time slot” selector, or
  - B) “StartAt/EndAt” selector.
    Keep consistent everywhere.

### 1.4 Toasts / confirmations

- Success: show short toast “Saved”, “Uploaded”, “Booking requested”
- Dangerous actions (delete, reject): confirmation modal

---

## 2) Customer Mobile App (Flutter) — Navigation Map

Recommended bottom tabs:

1. **Home**
2. **Explore / Search**
3. **Bookings**
4. **Profile**

Key screens:

- Auth: Login / Register (optional), OTP (optional)
- Home: Recommendations + quick categories
- Explore: Halls list + filters
- Hall Detail: photos + info + Similar halls + Book button
- Booking Create: choose date/time + confirm
- Payment Instructions: owner bank accounts + how to pay
- Receipt Upload: upload photo + status
- Booking Detail: booking status timeline + receipt status + actions
- Profile: account + logout

---

## 3) Mobile Flows (Customer)

### M01 — First Launch / Auth

**Goal:** user can enter the app and become authenticated.

Steps:

1. App opens
2. If token exists and valid → go to Home
3. Else → show Login screen (with optional Register link)
4. User logs in (phone/email + password OR OTP flow)
5. On success → Home

States:

- Login validation errors
- Wrong credentials → show message and keep fields
- Network error → retry
 - If user taps Register:
   - customer signs up with phone or email + password
   - role defaults to CUSTOMER

---

### M02 — Home Recommendations

**Goal:** show recommended halls quickly.

Screen: Home
Components:

- “Recommended for you” horizontal carousel
- “Popular in <city>” horizontal carousel
- Search bar (goes to Explore)

Steps:

1. Open Home
2. Load recommendations
3. User taps a hall card → Hall Detail

Empty:

- If no recommendations, show “Popular halls” fallback.

---

### M03 — Explore: Browse / Filter / Search

**Goal:** customer can find a hall.

Screen: Explore
Components:

- Search input
- Filters: city, area, capacity range, price range, services/tags
- Sort (optional): price low/high, newest

Steps:

1. Open Explore → loads halls list (paginated)
2. User searches or applies filters
3. List updates
4. User taps hall → Hall Detail

Edge cases:

- No results → “No halls match your filters” + “Clear filters”
- Slow network → show skeleton + allow retry

---

### M04 — Hall Detail + Similar Halls

**Goal:** show full hall info and alternatives.

Screen: Hall Detail
Components:

- Photo gallery
- Basic info: name, city/area/address
- Capacity, services/tags
- Price summary
- “Book Now” button
- “Similar halls” list

Steps:

1. Open hall detail
2. Load hall details + similar halls
3. User scrolls
4. User taps Similar hall → open that detail
5. User taps Book Now → Booking Create

---

### M05 — Create Booking Request

**Goal:** customer requests a booking.

Screen: Booking Create
Inputs:

- Date
- Time range (start/end) or slot
- Guest count (optional)
- Note (optional)

Steps:

1. User selects date/time
2. App validates (end > start)
3. User submits booking
4. API creates booking with `status=PENDING`
5. Navigate to Booking Detail (or Payment Instructions)

Error handling:

- If overlap policy blocks at creation → show “Time not available” and suggest picking another time.
- If server error → allow retry.

---

### M06 — Payment Instructions (Deposit)

**Goal:** show owner bank account(s) and instructions.

Screen: Payment Instructions
Content:

- List of owner bank accounts:
  - bank name, account holder, account number, IBAN (if any)
- Instruction text:
  - “Deposit the required amount to one of the accounts.”
  - “After deposit, upload the receipt.”

Steps:

1. App fetches bank accounts for the hall/owner
2. User copies account number (copy button)
3. User proceeds to Receipt Upload

Policy choice:

- Bank accounts can be visible:
  - A) always for a hall
  - B) only after user creates a booking
    Choose one and keep consistent.

---

### M07 — Upload Deposit Receipt

**Goal:** user uploads receipt proof.

Screen: Receipt Upload
Inputs:

- Photo picker/camera (accessible via plain upload button)
- Image preview list (allows picking cover and deleting)
- Submit upload

Steps:

1. User chooses a booking (or comes from Booking Detail)
2. User selects image
3. Upload starts (multipart)
4. On success:
   - Receipt created/updated with `status=UPLOADED`
   - Show “Uploaded successfully”
5. Navigate back to Booking Detail

States:

- Uploading progress
- Invalid file type/too large → show message
- Network fail → allow retry

---

### M08 — Booking Detail + Status Tracking

**Goal:** customer sees current status and what to do next.

Screen: Booking Detail
Content:

- Hall summary
- Booking date/time
- BookingStatus badge
- ReceiptStatus badge (if receipt exists)
- Timeline (optional): Requested → Receipt uploaded → Accepted/Rejected
- Actions:
  - If `PENDING` and no receipt: “Upload receipt”
  - If `PENDING` and receipt uploaded: “Waiting for owner review”
  - If `ACCEPTED`: show confirmation and contact info (optional)
  - If `REJECTED`: show reason

Steps:

1. Customer opens Bookings tab
2. Taps booking
3. Views current status
4. Acts accordingly (upload receipt, etc.)

Optional:

- Cancel booking if still pending (policy).

---

### M09 — Bookings List

**Goal:** customer sees all bookings and can filter.

Screen: Bookings
Content:

- Tabs/filters: All / Pending / Accepted / Rejected
- Each card: hall name, date/time, status

Steps:

1. Open Bookings
2. Load list (paginated)
3. Tap a booking → Booking Detail

---

### M10 — Profile

**Goal:** account and app settings.

Screen: Profile
Content:

- User info (name, phone/email)
- Logout
- (Optional) language, theme

---

## 4) Dashboard (React) — Navigation Map

Dashboard is one app with role-based routes.

### Owner routes

- `/owner/overview`
- `/owner/halls`
- `/owner/halls/new`
- `/owner/halls/:id/edit`
- `/owner/availability` (or per-hall availability)
- `/owner/bookings`
- `/owner/bookings/:id`
- `/owner/bank-accounts`

### Admin routes

- `/admin/overview`
- `/admin/users`
- `/admin/halls`
- `/admin/bookings` (optional MVP)
- `/admin/settings` (optional)

Shared:

- `/login`
- `/logout` (optional)

---

## 5) Dashboard Flows (Owner)

### O01 — Owner Login

Steps:

1. Owner opens dashboard URL
2. If not authenticated → `/login`
3. Owner logs in (or uses Register to create an OWNER account)
4. Redirect to `/owner/overview`

Errors:

- invalid credentials
- inactive account

---

### O02 — Owner Overview (Dashboard Home)

Goal: quick view of business status.

Widgets (MVP):

- Pending bookings count
- Upcoming accepted bookings count
- Quick link: “Add new hall”
- Quick link: “Review pending receipts”

---

### O03 — Manage Halls (CRUD)

Screens:

- Halls List
- Create Hall
- Edit Hall

Halls List:

1. Load owner’s halls
2. Actions: View, Edit, (optional) Deactivate/Delete

Create/Edit Hall form fields (MVP):

- name, description
- city, area, address
- capacity
- base price + pricing type
- services/tags
- photos (upload via plain button with preview grid, not pop-up)
- services/tags:

Steps:

1. Owner fills form
2. Save
3. Show success toast
4. Return to list or hall detail

Validation:

- required fields
- positive capacity and price

---

### O04 — Manage Availability (Block Dates/Slots)

Goal: owner blocks unavailable times to avoid conflicts.

Screen:

- Calendar or list of blocks
- Add block modal/form

Steps:

1. Owner opens Availability
2. Sees existing blocks (and optionally booked slots)
3. Click “Add block”
4. Select start/end date/time + type (BLOCKED/MAINTENANCE)
5. Save
6. Block appears immediately

Error:

- end before start
- overlaps with existing accepted booking (policy: allow or prevent)

---

### O05 — Booking Inbox (Pending Requests)

Goal: owner sees booking requests and receipt status.

Screen: Owner Bookings List
Filters:

- Status: Pending/Accepted/Rejected
- Date range
- Hall

Card shows:

- booking date/time
- customer name/contact (policy)
- BookingStatus
- ReceiptStatus (if uploaded)

Steps:

1. Owner opens Bookings list
2. Click a booking → Booking Review page

---

### O06 — Booking Review + Receipt Verification

Goal: owner verifies receipt and decides.

Screen: Booking Review
Content:

- Hall info + booking date/time
- Customer info (limited)
- Receipt image preview (if exists)
- Buttons:
  - Accept booking
  - Reject booking (requires reason)

Steps:

1. Owner opens booking
2. If no receipt:
   - show “Waiting for receipt upload” (disable accept/reject if receipt required)
3. If receipt uploaded:
   - owner views image
   - clicks Accept or Reject
4. On Accept:
   - booking status becomes `ACCEPTED`
   - (optional) receipt status becomes `VERIFIED`
   - show success toast
5. On Reject:
   - open modal “Reject reason”
   - booking status becomes `REJECTED`
   - receipt status becomes `REJECTED` (recommended)
   - show success toast

Conflict handling:

- If time overlaps with another accepted booking:
  - backend returns `409 BOOKING_CONFLICT`
  - UI shows “Cannot accept: time is no longer available”

---

### O07 — Manage Bank Accounts (Deposit)

Goal: owner manages bank accounts shown to customers.

Screen: Bank Accounts
Fields:

- bank name
- account holder
- account number
- IBAN (optional)
- active toggle (optional)

Steps:

1. Owner opens Bank Accounts
2. Add account
3. Edit account
4. Disable/delete account

---

## 6) Dashboard Flows (Admin)

### A01 — Admin Login

Same as Owner login, redirect to `/admin/overview`.

---

### A02 — Admin Overview

Widgets (MVP):

- total users
- total halls
- recent bookings (optional)
- quick actions: manage halls / manage users

---

### A03 — Manage Users

Screen: Users list
Functions (MVP):

- view users
- deactivate/activate user
- filter by role (CUSTOMER/OWNER/ADMIN)

Steps:

1. Admin opens Users list
2. Select user
3. Toggle active state
4. Confirm action
5. Toast success

---

### A04 — Manage Halls (Moderation)

Screen: Halls list
Functions (MVP):

- view all halls
- suspend/activate hall
- (optional) approve flow if you add `PENDING_APPROVAL`

Steps:

1. Admin opens Halls list
2. Select hall
3. Suspend/activate
4. Toast success

---

### A05 — Admin Booking Oversight (optional MVP)

Screen: Bookings list (read-only)

- filter by status, hall, owner
- open booking details for audit

---

## 7) Notifications (Optional UX)

MVP can rely on manual refresh. If adding notifications later:

- Customer gets notification when booking accepted/rejected
- Owner gets notification when receipt uploaded

Channels:

- in-app (badge)
- push notification (mobile)
- email/whatsapp/sms (optional)

---

## 8) Edge Cases & UX Policies (Decided)

1. **Receipt required before owner decision?**

- **Yes.** Disable accept/reject until receipt uploaded.

2. **Allow re-upload receipt after rejection?**

- **Yes.** If owner rejects the receipt, the booking remains `PENDING`. The customer can upload a new receipt. The owner sees the new receipt and can review again. Use a specific rejection reason to guide the customer.

3. **Bank accounts visibility**

- **Visible only after booking request is created.** This prevents spam and ensures the customer has committed to a slot before paying.

4. **Availability conflicts**

- **Enforce at acceptance time.** Multiple customers can request the same slot. The first one accepted wins; others overlapping are completely blocked from being accepted (or auto-rejected).

5. **Hall Deletion**

- **Soft Delete.** Halls are marked as `DELETED` (or similar status) and hidden from public lists, but strictly retained in the database for history.

---

## 9) Acceptance Checklist (UX)

Customer:

- can browse halls and open hall details
- can request booking
- can see payment instructions
- can upload receipt
- can track booking status changes

Owner:

- can create/edit halls
- can set availability blocks
- can review bookings
- can accept/reject after viewing receipt

Admin:

- can list and manage users/halls (at least suspend/activate)

End of UX_FLOWS.md
