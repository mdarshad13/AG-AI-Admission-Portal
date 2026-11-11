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

if (process.env.GEMINI_API_KEY) {
  console.log("Nemo Gemini credentials are configured. No API request was made.");
} else {
  console.log("Nemo Gemini is not configured. No API request was made.");
}
console.log("Live chat and handoff tests are intentionally not run here because they can contact external services.");
