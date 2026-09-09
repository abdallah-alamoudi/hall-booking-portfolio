# specs/features

Each feature lives in its own folder to keep changes small and traceable.

## Naming
- Folder format: `Fxx-<kebab-case-name>`
- Example: `F01-hall-discovery`

## Required files per feature
- `PRD.md` (required)
  - Problem statement (short)
  - Scope (in/out)
  - Functional requirements
  - Non-functional requirements (if any)
  - Acceptance criteria (MVP)
  - Edge cases / policies (if applicable)

## Optional files (only if needed)
- `API.md` (endpoint details beyond the global API doc)
- `SCHEMA.md` (feature-specific schema notes)
- `UX.md` (screen/flow details if not covered in `specs/UX_FLOWS.md`)
- `TESTS.md` (test checklist)

## Update checklist (must follow repo rules)
When implementing a feature, update in this order:
1. `packages/contracts` (enums/rules/openapi)
2. Backend (`services/api`)
3. Clients (`apps/dashboard`, `apps/mobile`)
4. Docs (`specs/SCHEMA.md`, `specs/API.md` or OpenAPI, `specs/UX_FLOWS.md`)
5. Tests
