# AG AI-Enabled Student Admission System

AG AI-Enabled Student Admission System is a responsive, AI-assisted student admission portal built with a Next.js frontend and Node.js API. It supports programme discovery, inquiry capture, multi-step applications, private supporting-document submission, AI admissions guidance, and a counselor review workflow.

> **Demonstration notice:** Programme names, fees, scholarship rules, eligibility thresholds, contact information, and sample counselor records are illustrative. Configure and verify real institutional policies before collecting real applicants or making admission decisions. Counselor summaries are rule-based demonstration notes, not AI decisions.

## Objectives

- Give prospective students a clear, accessible route from programme discovery to application submission.
- Provide a Gemini-backed assistant that can answer admissions questions in the language supported by the configured model.
- Give authorized counselors an authenticated queue for reviewing applications and updating admission status.
- Keep the existing JSON storage, optional PostgreSQL, Salesforce, and Twilio integration paths.

## Features

- Responsive landing page, navigation, programme pages, scholarships, support, and about page.
- Three-step application form with client/server validation, duplicate-email protection, confirmation reference, and pending-review status.
- Optional supporting documents: up to three PDF/JPEG/PNG files, 2 MB each; kept outside the public web root and downloaded only by an authenticated counselor.
- Nemo chat proxies requests through the backend and can stream Gemini responses when `GEMINI_API_KEY` is configured. The workflow test verifies the explicit missing-key response; live Gemini behavior is not tested without credentials.
- Counselor sign-in, one-hour signed JWTs, login throttling, protected enrollment listing, review, approval/rejection, and private document downloads.
- Local JSON storage by default; optional PostgreSQL persistence. Salesforce sync and Twilio WhatsApp handoff are optional integrations and are not exercised by the automated tests.
- Server-side CORS allowlist, request-size limits, basic security headers, input checks, and server-only credentials.

## Technologies

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide React.
- **Backend:** Node.js built-in HTTP server, Node `fetch`, and optional `pg` PostgreSQL driver.
- **AI:** Google Gemini `gemini-2.5-flash` streaming API, called only from the backend.
- **Storage:** JSON files by default; PostgreSQL for application records when `DATABASE_URL` is configured.
- **Optional integrations:** Salesforce CRM and Twilio WhatsApp.

## Project structure

```text
Backend/mock-server/       Node API, environment template, smoke checks, local data
Frontend/app/              Next.js routes (student and counselor portals)
Frontend/components/       Shared layout, forms, UI, and Nemo chat components
Frontend/lib/               API clients, application configuration, and course data
Frontend/public/             Static assets
docs/                        Architecture, modules, data, workflow, and test guidance
deploy-scripts/              Optional deployment helper
run-local.ps1                Starts the local API and frontend on Windows
```

The frontend calls the backend using the public base URL in `NEXT_PUBLIC_FORM_SUBMISSION_API`. Nemo uses `NEXT_PUBLIC_AGENT_PROXY_URL`, which points to the same backend by default. Gemini, database, counselor, Salesforce, and Twilio credentials remain in the backend environment.

## Requirements

- Node.js 20 LTS recommended (Next.js 15 requires Node.js 18.18 or newer).
- npm.
- Gemini API key only for live chat.
- PostgreSQL only if using database storage; otherwise the local JSON store is used.

## Environment configuration and local setup (Windows PowerShell)

From the project directory:

```powershell
Copy-Item Backend\mock-server\.env.example Backend\mock-server\.env
Copy-Item Frontend\.env.example Frontend\.env.local
```

Edit `Backend\mock-server\.env`:

- Set a unique `JWT_SECRET` of at least 32 characters, `COUNSELOR_USERNAME`, and `COUNSELOR_PASSWORD` to enable the counselor portal.
- Set `GEMINI_API_KEY` to enable live AI chat. Leave blank to receive an explicit unavailable message.
- Add `DATABASE_URL` only when using PostgreSQL. JSON is the default.
- Set Salesforce/Twilio variables only when those accounts are configured.
- Add the exact frontend origin to `CORS_ORIGINS` when hosting outside localhost.
- Never copy backend secrets into `Frontend/.env.local` or any `NEXT_PUBLIC_*` setting.

The backend template documents every setting: `PORT`, `CORS_ORIGINS`, `DATA_DIR`, `GEMINI_API_KEY`, `DATABASE_URL`, the optional Salesforce and Twilio credentials, and counselor login/JWT settings. The frontend template contains only `NEXT_PUBLIC_AGENT_PROXY_URL` and `NEXT_PUBLIC_FORM_SUBMISSION_API`; set those URLs if the backend is hosted somewhere other than `http://localhost:8080`. Keep real credentials in ignored local `.env` files or a hosting secret manager.

Install and start the backend in one terminal:

```powershell
Set-Location Backend\mock-server
npm ci
npm start
```

Install and start the frontend in a second terminal:

```powershell
Set-Location Frontend
npm ci
npm run dev
```

Visit `http://localhost:3000`. To start both servers through the existing Windows helper, run `./run-local.ps1` from the repository root after installing both dependency sets.

## Frontend commands

- `npm run dev` — local development server.
- `npm run typecheck` — TypeScript validation.
- `npm run build` — production build.
- `npm start` — serve a production build.

## Backend API

Base URL: `http://localhost:8080` by default.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | Public | Programme catalogue and illustrative thresholds |
| `POST` | `/createFormLead` | Public, consent required | Store an inquiry and optionally sync Salesforce |
| `POST` | `/` | Public, Gemini configured | Nemo SSE chat proxy |
| `POST` | `/api/enrollments` | Public application or counselor JWT | Submit an application; counselor-created entries require JWT |
| `POST` | `/api/counselor/login` | Public, configured credentials | Issue a one-hour counselor JWT |
| `GET` | `/api/enrollments` | Counselor JWT | List applications and counselor-visible applicant details |
| `GET` | `/api/enrollments/ai-insights?id=...` | Counselor JWT | Rule-based sample review notes; not an AI decision |
| `GET` | `/api/enrollments/:id/documents/:filename` | Counselor JWT | Download a private submitted document |
| `POST` | `/api/enrollments/action` | Counselor JWT | Approve or reject an application |

Run `npm run test:api` against the API on port 8080 for the existing route/auth checks. `npm run test:workflows` starts a separate API process with temporary storage and disposable credentials to verify application creation, duplicate protection, counselor review, document privacy/download, CORS, and missing-Gemini behavior. Neither test sends data to external integrations. Do not use real applicant information in demo data or public demonstrations.

## AI integration

Nemo sends chat prompts from the browser to the Node API, which calls Gemini using the server-side `GEMINI_API_KEY` and streams events to the chat UI. Conversation context is held in the running backend process and is not durable across backend restarts. Gemini may respond in a student's language when the configured model supports it. No frontend API key is used. Live Gemini, Salesforce, and Twilio behavior requires credentials and is not exercised by the automated tests; Salesforce and Twilio are not required for local chat or inquiry storage.

## Data and security notes

- Real values belong in ignored `.env` files or a hosting secret manager. The repository keeps `.env.example` templates only.
- Local inquiries and applications live under `Backend/mock-server/data/`; uploaded documents live under its private `private-documents/` subfolder. These files are local demo storage and must be backed up and protected appropriately.
- PostgreSQL stores application records and applicant detail metadata; uploaded binary files remain in the backend's private data directory. Use private object storage and a retention policy for a deployed system.
- Counselor JWTs are stored in browser `sessionStorage` for this demonstration. Production deployments should use secure, HttpOnly cookies, password hashing/identity management, HTTPS, distributed rate limiting, audit logs, and tested backup/retention policies.
- This sample is not a substitute for privacy, accessibility, admissions, or security review before real-world use.

## Documentation and retained references

See [docs/architecture.md](docs/architecture.md), [docs/modules.md](docs/modules.md), [docs/database.md](docs/database.md), [docs/workflow.md](docs/workflow.md), and [docs/testing.md](docs/testing.md). The repository's original PDF reference files and MIT license are retained as source artifacts; older PDFs may carry upstream-era branding, so this README and the Markdown guides are the current project documentation.

## Screenshots

Screenshots are not included yet. To add them, capture the running demo without real applicant data or credentials, save the images under `docs/screenshots/`, and link them here using repository-relative paths. For example:

```markdown
![AG admissions landing page](docs/screenshots/landing-page.png)
```

## Contributors

Add each project contributor's name, role, and (optionally) GitHub profile link here before publishing. Do not list people without their consent.
