# F00 - Repo Baseline

## Problem Statement
We need a consistent baseline for the repo so all future features are built on stable contracts, docs, and structure.

## Scope
In scope:
- Feature folder structure and documentation rules
- Contracts baseline (roles, statuses, upload limits)
- OpenAPI baseline (error format, auth header, health endpoint)
- Minimal health endpoint for API

Out of scope:
- Any business feature (halls, bookings, receipts, etc.)
- UI work in dashboard or mobile (beyond baseline wiring)

## Functional Requirements
- Provide a standard template for feature PRDs
- Ensure contracts exist for roles and statuses
- Ensure OpenAPI contains base information and health endpoint
- Ensure `GET /v1/health` returns `{ ok: true }`

## Non-Functional Requirements
- Keep docs authoritative and in sync
- Avoid breaking changes to shared contracts

## Acceptance Criteria (MVP)
- `specs/features/README.md` exists with required sections
- `packages/contracts` includes roles + statuses + upload rules
- `packages/contracts/openapi.yaml` includes base info, auth header, error format, and health endpoint
- API exposes `GET /v1/health` and returns `{ ok: true }`
- Docs updated if any of the above change

## Edge Cases / Policies
- None
