const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match || line.trim().startsWith("#") || process.env[match[1]]) continue;

    let value = match[2] || "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value.trim();
  }
}

const requiredVariables = ["SF_CLIENT_ID", "SF_CLIENT_SECRET"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  console.log(`Salesforce is not configured. Missing: ${missingVariables.join(", ")}`);
  console.log("No credentials were printed, and no network request or record creation was attempted.");
} else {
  console.log("Salesforce credential variables are configured.");
  console.log("This check does not print credentials, make network requests, or create Salesforce records.");
}
