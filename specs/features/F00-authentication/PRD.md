# F00 - Authentication (Login + Register)

## Problem Statement
Users need a secure way to create accounts and authenticate in the system. This includes customer signup from mobile and owner signup from the dashboard.

## Scope
In scope:
- `POST /v1/auth/register` (email or phone + password)
- `POST /v1/auth/login` (identifier + password)
- JWT issuance and auth middleware
- Password hashing and credential validation

Out of scope:
- OTP login
- Password reset
- Email/phone verification
- Admin-managed approvals

## Functional Requirements
- Register with email or phone (at least one required)
- Password minimum length 8
- Role defaults to CUSTOMER; OWNER allowed; ADMIN not allowed
- Login with email or phone and password
- Invalid credentials return 401

## Non-Functional Requirements
- Passwords stored as hashes only
- Error responses use standard format

## Acceptance Criteria (MVP)
- Users can register and login successfully
- Login returns token + user payload
- `/users/me` returns current user from token
- Tests cover register/login failure cases

## Edge Cases / Policies
- Duplicate email/phone is rejected with 409
- Inactive user cannot login
