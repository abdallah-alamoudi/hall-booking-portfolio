# Known limitations and next steps

This snapshot is for portfolio review and local demonstration, not production use.

## Booking correctness

- The unconditional unique key on hall/date/daytime also applies to rejected and cancelled bookings. A fresh booking for that exact slot can therefore be rejected by the database even when the service considers it available.
- Receipt re-upload updates the booking and receipt separately and does not reacquire the booking-slot lock or recheck availability.
- Acceptance uses a lock and a state reread, while rejection does not use the same locking strategy. Concurrent decisions need explicit coverage.
- These findings come from code review. The existing MySQL concurrency tests must be run against a disposable MySQL database; their presence alone does not prove correctness.

## Deployment and scope

- Receipt storage, access control for uploaded files, upload validation, login throttling, token lifecycle, and production configuration need further review before handling real customers or financial documents.
- Admin role definitions and screens do not imply a complete administrative product. Recommendations, analytics, and payment integrations are not claimed as completed features.
- Design notes and the OpenAPI description may lag the implemented routes.
- Docker/Nginx files are infrastructure sketches; the documented local setup is the intended review path.
- No production deployment, load test, security certification, or real-user metrics are claimed.
