# F02 - Availability & Calendar Management

## Problem Statement
Owners need to manage their hall's availability to prevent booking conflicts. Customers need to know which dates are available before requesting a booking.

## Scope
In scope:
- `POST /v1/owner/halls/:id/availability` (Owner: block a date)
- `DELETE /v1/owner/availability/:id` (Owner: remove block)
- `GET /v1/halls/:id/availability` (Public: list all busy periods)
- Dashboard availability management UI
- API validations to prevent double-blocking or blocking past dates

## Functional Requirements
- Owner can select a date and add a "Block" reason.
- System validates that blocked dates do not overlap with existing blocks or confirmed bookings.
- System validates that historical dates cannot be blocked.
- Public endpoint returns a merged list of all busy periods (Blocks + Confirmed Bookings).

## UI Requirements
- **Dashboard**: Interactive calendar highlighting busy days. Disable/grey out past dates.
- **Mobile**: Hall detail page should show availability, and the booking calendar MUST grey out/disable unavailable dates.

## Acceptance Criteria
- Owners can successfully block/unblock dates.
- Attempting to block a busy date returns a Conflict (409) error.
- Public API correctly identifies busy periods.
- **Mobile UI**: Visual feedback (greying out) for busy dates in the booking calendar.
