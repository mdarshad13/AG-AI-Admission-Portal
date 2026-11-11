const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error("Test API process exited before it became ready.");
    try {
      const response = await fetch(`${baseUrl}/api/courses`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the isolated test API.");
}

async function expectStatus(response, expected, message) {
  assert.equal(response.status, expected, `${message}: expected HTTP ${expected}, got ${response.status}`);
}

async function runWorkflowChecks() {
  const port = await getAvailablePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ag-ai-admissions-test-"));
  const baseUrl = `http://127.0.0.1:${port}`;
  const testEnv = {
    ...process.env,
    PORT: String(port),
    DATA_DIR: dataDir,
    CORS_ORIGINS: "http://localhost:3000",
    JWT_SECRET: "isolated-test-secret-with-at-least-32-characters",
    COUNSELOR_USERNAME: "workflow-test-counselor",
    COUNSELOR_PASSWORD: "workflow-test-password-only",
    GEMINI_API_KEY: "",
    DATABASE_URL: "",
  };
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    env: testEnv,
    stdio: "ignore",
  });

  try {
    await waitForServer(baseUrl, child);

    const unauthorized = await fetch(`${baseUrl}/api/enrollments`);
    await expectStatus(unauthorized, 401, "Counselor list must require authentication");
    console.log("PASS: unauthenticated counselor access is denied.");

    const loginResponse = await fetch(`${baseUrl}/api/counselor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: testEnv.COUNSELOR_USERNAME, password: testEnv.COUNSELOR_PASSWORD }),
    });
    await expectStatus(loginResponse, 200, "Configured test counselor should sign in");
    const { token } = await loginResponse.json();
    assert.ok(token, "Login response should include a JWT.");

    const pdfBytes = Buffer.from("%PDF-1.4\nAG workflow test fixture");
    const application = {
      applicationSource: "public_application",
      fullName: "Workflow Test Applicant",
      email: `workflow-${Date.now()}@example.test`,
      phone: "+15551234567",
      dateOfBirth: "2000-01-01",
      gender: "Other",
      nationality: "Test",
      parentName: "Workflow Test Guardian",
      parentPhone: "+15557654321",
      address: "Test-only address",
      tenthMarks: "90%",
      twelfthMarks: "88%",
      expectedStartDate: "2030-01-01",
      entranceExam: "EAPCET",
      rollNumber: "WORKFLOW-123",
      rankScore: "1",
      choiceOption1: "cse",
      choiceOption2: "it",
      category: "OC",
      qualifyingExam: "10+2 / Intermediate",
      scholarshipCategory: "none",
      dataAuthorization: true,
      documents: [{ name: "results.pdf", type: "application/pdf", data: pdfBytes.toString("base64") }],
    };
    const submit = () => fetch(`${baseUrl}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(application),
    });
    const applicationResponse = await submit();
    await expectStatus(applicationResponse, 201, "Valid test application should be stored");
    const record = await applicationResponse.json();
    assert.equal(record.approvalStatus, "Pending");
    assert.equal(record.applicantDetails.documents.length, 1);
    console.log("PASS: application is validated, saved as Pending, and document metadata is stored.");

    const duplicateResponse = await submit();
    await expectStatus(duplicateResponse, 409, "Duplicate email should be rejected");
    console.log("PASS: duplicate application is rejected.");

    const document = record.applicantDetails.documents[0];
    const documentUrl = `${baseUrl}/api/enrollments/${record.id}/documents/${encodeURIComponent(document.storageName)}`;
    const deniedDownload = await fetch(documentUrl);
    await expectStatus(deniedDownload, 401, "Private document must require counselor authentication");
    const download = await fetch(documentUrl, { headers: { Authorization: `Bearer ${token}` } });
    await expectStatus(download, 200, "Counselor should download submitted document");
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdfBytes);
    console.log("PASS: submitted document is private and counselor-downloadable.");

    const approvalResponse = await fetch(`${baseUrl}/api/enrollments/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: record.id, action: "approve" }),
    });
    await expectStatus(approvalResponse, 200, "Counselor approval should succeed");
    assert.equal((await approvalResponse.json()).approvalStatus, "Approved");
    const invalidAction = await fetch(`${baseUrl}/api/enrollments/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: record.id, action: "delete" }),
    });
    await expectStatus(invalidAction, 400, "Unsupported counselor action should be rejected");
    console.log("PASS: counselor can approve and unsupported status actions are rejected.");

    const blockedOrigin = await fetch(`${baseUrl}/api/courses`, { headers: { Origin: "https://untrusted.example" } });
    await expectStatus(blockedOrigin, 403, "Unlisted browser origin should be rejected");
    const chatResponse = await fetch(`${baseUrl}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runtimeSessionId: "workflow-test-session", payload: { prompt: "Hello" } }),
    });
    await expectStatus(chatResponse, 503, "Missing Gemini configuration should be explicit");
    console.log("PASS: CORS allowlist is enforced and missing Gemini credentials return HTTP 503.");
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => {
        child.once("exit", resolve);
        child.kill();
      });
    }
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

runWorkflowChecks().catch((error) => {
  console.error("Admission workflow verification failed:", error.message);
  process.exitCode = 1;
});
