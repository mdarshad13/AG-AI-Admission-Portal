# Testing and Verification

## Automated checks

Run the frontend commands from `Frontend/`:

```powershell
npm ci
npm run typecheck
npm run build
```

Run the backend smoke checks while the API server is running:

```powershell
Set-Location Backend\mock-server
npm ci
npm run test:api
```

The API checks verify the public course endpoint, invalid inquiry rejection, and unauthenticated counselor access. They do not create application records or contact Gemini, Salesforce, or Twilio.

For isolated workflow coverage, run `npm run test:workflows`. It starts a separate local API with temporary credentials and a disposable operating-system temp directory, then removes only that directory after testing. It checks valid and duplicate application submissions, counselor authentication and approval, private document access, CORS rejection, and the explicit missing-Gemini error.

## Manual acceptance checklist

- Open `/`, `/about`, all three programme routes, `/scholarships`, `/apply`, and `/get-help` at desktop and mobile widths.
- Submit an application using test-only values; check validation, reference confirmation, and that a second submission with the same email is rejected.
- Select a small valid PDF/JPEG/PNG test fixture and confirm a counselor can download it after login. Confirm unsupported or oversized files are rejected.
- Without counselor credentials, verify dashboard APIs deny access. With configured test credentials, verify login, dashboard search/filtering, status decisions, logout, and re-login.
- Without `GEMINI_API_KEY`, verify Nemo clearly reports chat is unavailable. With an authorized test key, verify streaming and multilingual responses. Avoid sending real personal data to an external model.
- Test PostgreSQL and Salesforce/Twilio only in dedicated non-production test accounts with disposable data.

## Known verification boundaries

External integrations require valid accounts and credentials and are not exercised by local smoke checks. Browser-based visual testing and live Gemini tests require the developer to launch the services and provide authorized test configuration. Do not claim those integrations are verified unless those exact tests were run.
