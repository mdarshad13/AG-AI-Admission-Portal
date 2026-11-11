# Admission Workflow

## Student application

1. A student reviews programme, scholarship, and support information.
2. The student completes personal/contact details, academic and entrance-exam information, course preferences, and consent.
3. Optional PDF/JPEG/PNG files are checked in the browser, then independently validated by the API (up to three files, 2 MB per file).
4. The backend validates required data and course IDs, rejects duplicate email addresses, recalculates illustrative public scholarship discounts, stores the application, and returns a reference ID.
5. New applications remain pending counselor review. The portal displays a submission confirmation and reference.

## Counselor review

1. Counselor credentials and a 32-character-or-longer `JWT_SECRET` are configured in the backend environment.
2. A successful login returns a one-hour JWT. The browser route guard controls display, while the API enforces authorization on protected routes.
3. The counselor searches and filters the application queue, inspects permitted applicant details and document files, and reviews clearly labeled rule-based notes.
4. An authorized counselor approves or rejects the record. The API validates the action and persists the resulting status.
5. Logout clears the browser session token.

## AI assistant

Nemo passes the student's question and the in-memory chat history to Gemini through the backend. Gemini is instructed to distinguish illustrative content from confirmed policy and to reply in the student's language when supported by the configured model. Missing Gemini credentials produce an explicit unavailable error; no canned answer is used as a substitute.
