const API_URL = process.env.API_URL || "http://localhost:8080";

async function verifyCounselorProtection() {
  const response = await fetch(`${API_URL}/api/enrollments`);
  if (response.status === 503) {
    const body = await response.json();
    if (!String(body.error || "").toLowerCase().includes("not configured")) {
      throw new Error("Unconfigured counselor routes returned an unexpected response.");
    }
    console.log("PASS: Counselor routes remain disabled until server credentials are configured.");
    return;
  }
  if (response.status !== 401) {
    throw new Error(`Unauthenticated counselor access should return 401 or an unconfigured 503, got ${response.status}.`);
  }
  console.log("PASS: GET /api/enrollments denies unauthenticated access.");
}

verifyCounselorProtection().catch((error) => {
  console.error("Counselor endpoint verification failed:", error.message);
  process.exitCode = 1;
});
