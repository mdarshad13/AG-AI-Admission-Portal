# Modules and Routes

## Student-facing modules

- `/` — AG AI Admissions landing experience, programme discovery, inquiry entry, and Nemo chat.
- `/about` — Portal overview and demonstration disclaimer.
- `/programmes/ug`, `/programmes/pg`, `/programmes/phd` — Illustrative academic pathways.
- `/scholarships` — Example scholarship guidance; not an official policy.
- `/apply` — Three-step personal, academic, and preference form with validation and reference confirmation.
- `/get-help` — Chat, inquiry, and portal support entry points.

## Counselor modules

- `/counselor/login` — Environment-configured counselor sign-in.
- `/counselor/dashboard` — Application totals, search, course/status filters, counselor review notes, decision actions, and private document downloads.
- `/counselor/enroll` — Counselor-created enrollment; API requires a valid counselor token.

## Reusable frontend components

- `components/header.tsx` and `components/ag-logo.tsx` provide the shared brand and navigation.
- `components/inquiry-form.tsx` captures consented inquiries.
- `components/nemo/` contains the streamed chat UI, loading/error states, message rendering, and controls.
- `components/ui/` contains shared Button, Card, and Input primitives.
- `lib/agent-client.ts` consumes server-sent events; `lib/config.ts` resolves API URLs.

## Backend endpoints

The API and access requirements are listed in the [README API overview](../README.md#backend-api). Applications can be submitted publicly only with `applicationSource: "public_application"`; counselor entries specify `counselor_enrollment` and require a bearer JWT. Public requests cannot approve or reject records.
