# Database and Storage Design

## Storage modes

- **Local mode (default):** `Backend/mock-server/data/enrollments.json` and `leads.json`. Uploaded binaries are under `data/private-documents/`.
- **PostgreSQL (optional):** Set `DATABASE_URL`. The backend creates or additively migrates the `enrollments` table and keeps a JSON cache/backup. It does not delete existing records.

## Enrollment record

The existing relational columns continue to hold the application identifier, contact fields, course choices, fee illustration, scholarship category, academic exam information, approval status, and timestamps. An additive `applicantDetails JSONB` column stores date of birth, gender, nationality, guardian details, postal address, prior academic results, and document metadata. Existing rows without this field load as an empty object.

Application status is initialized as **Pending** / **Submitted for Review**; approval or rejection is a counselor action. The rule-based sample review does not determine eligibility or admissions decisions. Public scholarship discounts are recalculated by the API using sample rules rather than trusting a browser-supplied amount.

Document metadata includes original display name, MIME type, size, and a generated storage name. Binary files are not stored in PostgreSQL or exposed as static assets. A production deployment should use a private object store, authorization-scoped download links, malware scanning, encryption, and a retention schedule.

## Inquiry record

Consented inquiry submissions are saved to the local `leads.json` store. Salesforce sync is optional and happens after the local record is stored, so a CRM outage does not erase the local inquiry.

## Operational cautions

The demo has duplicate-email checks against loaded application records, but a production multi-instance deployment needs a database uniqueness constraint and transaction-level conflict handling. Do not treat demo fees, cutoffs, or scholarship values as institutional policy. Limit access to local storage and avoid real personal data in demonstrations.
