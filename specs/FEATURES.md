# FEATURES.md - Build Plan (Granular Tasks)

This file defines the tiny, ordered tasks we will implement one by one.
Follow the repo rules in `specs/INSTRUCTIONS.md` for every task.

## Phase 0: Foundation & Baseline [DONE]
- [x] 1. Create `specs/features/README.md` (naming and sections) <!-- id: 0 -->
- [x] 2. Create `specs/features/F00-repo-baseline/PRD.md` <!-- id: 1 -->
- [x] 3. Define enums and rules in `packages/contracts` <!-- id: 2 -->
- [x] 4. Setup OpenAPI skeleton with base paths and error format <!-- id: 3 -->
- [x] 5. Implement `GET /v1/health` and update docs <!-- id: 4 -->
- [x] 6. Implement JWT utilities and auth middleware <!-- id: 5 -->
- [x] 7. Implement `POST /v1/auth/login` and `POST /v1/auth/register` <!-- id: 6 -->
- [x] 8. Implement `GET /v1/users/me` <!-- id: 7 -->
- [x] 9. Add API tests for auth and users/me <!-- id: 8 -->

## Phase 1: Hall Discovery (Guest Flow) [DONE]
- [x] 10. Create `specs/features/F01-hall-discovery/PRD.md` <!-- id: 9 -->
- [x] 11. DB Schema: migrations for `halls`, `hall_photos`, `hall_services`, `hall_service_map` <!-- id: 10 -->
- [x] 12. API: Implement public `GET /v1/halls` (filter/pagination) <!-- id: 11 -->
- [x] 13. API: Implement public `GET /v1/halls/:hallId` <!-- id: 12 -->
- [x] 14. API: Implement public `GET /v1/services` <!-- id: 13 -->
- [x] 15. API Tests: verify hall discovery endpoints <!-- id: 14 -->
- [x] 16. Mobile: build explore list (UI only) <!-- id: 15 -->
- [x] 17. Mobile: build hall detail screen (UI only) <!-- id: 16 -->

## Phase 2: Owner Management (My Halls) [DONE]
- [x] 18. Update `packages/contracts/openapi.yaml` with owner hall CRUD endpoints <!-- id: 17 -->
- [x] 19. API: Implement `GET /v1/owner/halls` (filtered by active user) <!-- id: 18 -->
- [x] 20. API: Implement `POST /v1/owner/halls` (create with auth) <!-- id: 19 -->
- [x] 21. API: Implement `PATCH /v1/owner/halls/:hallId` (ownership enforced) <!-- id: 20 -->
- [x] 22. API Tests: verify owner create/update/list <!-- id: 21 -->
- [x] 23. Dashboard: setup API client (axios) and Owner Halls List page <!-- id: 22 -->
- [x] 24. API: Implement `DELETE /v1/owner/halls/:hallId` (Soft Delete: status=DELETED) <!-- id: 23 -->
- [x] 25. API: Implement `POST /v1/uploads` for images (Local storage, multipart/form-data) <!-- id: 24 -->
- [x] 26. Dashboard: Hall Create Form - Step 1: Basic Info (Name, Loc, Capacity, Price) <!-- id: 25 -->
- [x] 27. Dashboard: Hall Create Form - Step 2: Image Upload (UI) <!-- id: 26 -->
- [x] 28. Dashboard: Hall Create Form - Step 3: Services & Final Submit <!-- id: 27 -->
- [x] 29. Dashboard: Hall Edit Page (Load data + Pre-fill form) <!-- id: 28 -->
- [x] 30. Dashboard: Hall Delete Action (Soft delete confirmation) <!-- id: 29 -->

## Phase 3: Availability & Calendar [DONE]
- [x] 31. DB Schema: create `availability_blocks` table <!-- id: 30 -->
- [x] 32. API: Owner `POST /v1/owner/halls/:id/availability` (create block) <!-- id: 31 -->
- [x] 33. API: Owner `DELETE /v1/owner/availability/:blockId` <!-- id: 32 -->
- [x] 34. API: Public `GET /v1/halls/:id/availability` (merged bookings + blocks) <!-- id: 33 -->
- [x] 35. Dashboard: Add "Availability" tab to Hall Edit page <!-- id: 34 -->
- [x] 36. Dashboard: Implement Calendar View (view blocks) <!-- id: 35 -->
- [x] 37. Dashboard: Implement Add/Remove Block UI <!-- id: 36 -->

## Phase 4: Booking Flow (Core)
- [x] 38. DB Schema: create `bookings` table <!-- id: 37 -->
- [x] 39. API: Customer `POST /v1/bookings` (create PENDING booking) <!-- id: 38 -->
- [x] 40. API: Owner `GET /v1/owner/bookings` (list with filters) <!-- id: 39 -->
- [x] 41. API: Owner `GET /v1/owner/bookings/:id` (detail) <!-- id: 40 -->
- [x] 42. API: Customer `GET /v1/bookings` (my bookings) <!-- id: 41 -->
- [x] 43. Mobile: Implement "Book Now" flow (Select Date -> Confirm -> API) — **Constraint**: Grey out busy dates <!-- id: 42 -->
- [x] 44. Mobile: Implement "My Bookings" list screen <!-- id: 43 -->
- [x] 45. Dashboard: Owner Bookings List UI (Filter by status) <!-- id: 44 -->
- [x] 46. Dashboard: Owner Booking Detail UI (View info only) <!-- id: 45 -->

## Phase 5: Payments & Receipts
- [ ] 47. DB Schema: create `owner_bank_accounts` and `receipts` tables <!-- id: 46 -->
- [ ] 48. API: Owner `GET/POST/DELETE /v1/owner/bank-accounts` <!-- id: 47 -->
- [ ] 49. API: Booking Payment Info (Visible after booking created) -> `GET /v1/bookings/:id/payment-info` <!-- id: 48 -->
- [ ] 50. API: Customer `POST /v1/bookings/:id/receipt` (Upload image) <!-- id: 49 -->
- [ ] 51. API: Owner `PATCH /v1/owner/bookings/:id/status` (Accept/Reject logic + checks) <!-- id: 50 -->
- [ ] 52. Dashboard: Owner Bank Accounts Management UI <!-- id: 51 -->
- [ ] 53. Mobile: Booking Detail "Pay Now" logic (Fetch accounts -> Show info) <!-- id: 52 -->
- [ ] 54. Mobile: Receipt Upload UI (Image picker -> API) <!-- id: 53 -->
- [ ] 55. Dashboard: Booking Detail "Review Receipt" UI (Show image, Accept/Reject buttons) <!-- id: 54 -->
- [ ] 56. Mobile: Handle Re-upload if rejected <!-- id: 55 -->

## Phase 6: Admin Support
- [ ] 57. API: Admin `GET /v1/admin/users` & `PATCH /v1/admin/users/:id/status` <!-- id: 56 -->
- [ ] 58. API: Admin `GET /v1/admin/halls` & `PATCH /v1/admin/halls/:id/status` <!-- id: 57 -->
- [ ] 59. Dashboard: Admin Users List & Moderation UI <!-- id: 58 -->
- [ ] 60. Dashboard: Admin Halls List & Moderation UI <!-- id: 59 -->

## Phase 7: Recommendations & Polish
- [ ] 61. Logic: Implement basic recommendation algorithm <!-- id: 60 -->
- [ ] 62. API: `GET /v1/halls/recommendations` <!-- id: 61 -->
- [ ] 63. Mobile: Add "Recommended" section to Home Screen (Discovery Home) <!-- id: 62 -->
- [ ] 64. Final Polish: Error handling, Empty states, Loading skeletons <!-- id: 63 -->

End of FEATURES.md
