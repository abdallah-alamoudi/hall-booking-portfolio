# F01 - Hall Discovery (Browse + Search + Detail)

## Problem Statement
Customers need to discover halls based on their location, capacity, and price. They also need to see detailed information and photos of a hall before requesting a booking.

## Scope
In scope:
- `GET /v1/halls` (public list with filters and pagination)
- `GET /v1/halls/:hallId` (public detail with photos and services)
- `GET /v1/services` (public list of available service tags)
- Search by hall name or area
- Filters: city, capacity range, price range, service tags
- Basic sorting: `createdAt:desc`, `basePrice:asc/desc`

Out of scope:
- Booking creation (F03)
- Availability calendar (F02)
- Similar halls recommendations (F07)
- Owner management of halls (F01 Dashboard task)

## Functional Requirements
- List halls with pagination (default 20 per page)
- Filter by `city` (exact match)
- Filter by `minCapacity` and `maxCapacity`
- Filter by `minPrice` and `maxPrice`
- Filter by multiple `serviceIds` (OR or AND logic - MVP: OR is simpler)
- Search by `name` or `area` (partial match)
- Detail page returns photo array and service tags array

## Non-Functional Requirements
- Efficient database queries for filters
- Public endpoints (no auth required)
- Standard error responses

## Acceptance Criteria
- `GET /v1/halls` returns data and pagination meta
- `GET /v1/halls/:hallId` returns 404 if hall not found or inactive
- Search and filters work as expected
- Schema matches `specs/SCHEMA.md`

## Data Model Changes
- `Hall` model
- `HallPhoto` model
- `HallService` model
- `HallServiceMap` model (many-to-many)
