const API_URL = process.env.API_URL || "http://localhost:8080";

async function verifyPublicEndpoints() {
  const coursesResponse = await fetch(`${API_URL}/api/courses`);
  const courses = await coursesResponse.json();
  if (!coursesResponse.ok || !Array.isArray(courses) || courses.length === 0) {
    throw new Error(`Course endpoint check failed (${coursesResponse.status}).`);
  }
  console.log(`PASS: GET /api/courses returned ${courses.length} sample programmes.`);

  const invalidInquiryResponse = await fetch(`${API_URL}/createFormLead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (invalidInquiryResponse.status !== 400) {
    throw new Error(`Invalid inquiry should return 400, got ${invalidInquiryResponse.status}.`);
  }
  console.log("PASS: POST /createFormLead rejects invalid input without storing a record.");
}

verifyPublicEndpoints().catch((error) => {
  console.error("Public endpoint verification failed:", error.message);
  process.exitCode = 1;
});
