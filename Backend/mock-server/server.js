const http = require("http");
const fs = require("fs");
const path = require("path");

const COURSES = [
    { id: "cse", name: "Computer Science & Engineering (CSE)", code: "CSE", fee: 125000, cutoffEapcet: 8000, cutoffEcet: 800 },
    { id: "cse-aiml", name: "CSE (Artificial Intelligence & Machine Learning)", code: "CSE-AI&ML", fee: 125000, cutoffEapcet: 10000, cutoffEcet: 1000 },
    { id: "cse-ds", name: "CSE (Data Science)", code: "CSE-DS", fee: 125000, cutoffEapcet: 12000, cutoffEcet: 1200 },
    { id: "it", name: "Information Technology (IT)", code: "IT", fee: 115000, cutoffEapcet: 15000, cutoffEcet: 1500 },
    { id: "ece", name: "Electronics & Communication Engineering (ECE)", code: "ECE", fee: 105000, cutoffEapcet: 25000, cutoffEcet: 2500 },
    { id: "csbs", name: "Computer Science and Business Systems", code: "CSBS", fee: 115000, cutoffEapcet: 18000, cutoffEcet: 1800 },
    { id: "eee", name: "Electrical & Electronics Engineering (EEE)", code: "EEE", fee: 100000, cutoffEapcet: 45000, cutoffEcet: 4500 },
    { id: "mech", name: "Mechanical Engineering (ME)", code: "ME", fee: 95000, cutoffEapcet: 60000, cutoffEcet: 6000 },
    { id: "civil", name: "Civil Engineering (CE)", code: "CE", fee: 95000, cutoffEapcet: 80000, cutoffEcet: 8000 }
];

const crypto = require("crypto");

// Zero-dependency .env parser helper
try {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
        for (const line of lines) {
            if (line.trim().startsWith("#")) continue;
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let val = match[2] || "";
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                if (typeof process.env[key] === "undefined") {
                    process.env[key] = val.trim();
                }
            }
        }
    }
} catch (err) {
    console.error("[ENV PARSER] Error reading .env file:", err);
}

const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(__dirname, "data");
const enrollments = [];
const DB_FILE = path.join(DATA_DIR, "enrollments.json");
const leads = [];
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

// Security settings
const JWT_SECRET = process.env.JWT_SECRET;
const COUNSELOR_USER = process.env.COUNSELOR_USERNAME;
const COUNSELOR_PASS = process.env.COUNSELOR_PASSWORD;
const loginAttempts = new Map();
const requestRateLimits = new Map();

function allowRequest(req, route, limit, windowMs) {
    const key = `${route}:${req.socket.remoteAddress || "unknown"}`;
    const now = Date.now();
    const current = requestRateLimits.get(key);
    if (requestRateLimits.size >= 5000) {
        for (const [entryKey, entry] of requestRateLimits) {
            if (now - entry.startedAt >= 10 * 60 * 1000) requestRateLimits.delete(entryKey);
        }
        if (!requestRateLimits.has(key) && requestRateLimits.size >= 5000) return false;
    }
    if (!current || now - current.startedAt >= windowMs) {
        requestRateLimits.set(key, { count: 1, startedAt: now });
        return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
}

function signJwt(payload, secret) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token, secret) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [headerPart, payloadPart, signaturePart] = parts;
        const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf-8"));
        if (header.alg !== "HS256" || header.typ !== "JWT") return null;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${headerPart}.${payloadPart}`)
            .digest("base64url");
        const receivedSignature = Buffer.from(signaturePart);
        const expected = Buffer.from(expectedSignature);
        if (receivedSignature.length !== expected.length || !crypto.timingSafeEqual(receivedSignature, expected)) return null;

        const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf-8"));
        if (!Number.isFinite(payload.exp) || Date.now() >= payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

// Database Layer
let pgClient = null;
let useDatabase = false;

async function initPostgres() {
    if (!process.env.DATABASE_URL) {
        console.log("[MOCK DB] DATABASE_URL not set in .env. Using local json store.");
        loadDb();
        return;
    }

    let connectionString = process.env.DATABASE_URL;
    const { Client } = require("pg");

    try {
        let client = new Client({
            connectionString,
            ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
                ? false
                : { rejectUnauthorized: true }
        });

        try {
            await client.connect();
        } catch (connErr) {
            // Postgres error code '3D000' means the target database does not exist
            if (connErr.code === '3D000') {
                console.log(`📡 [MOCK DB] Database does not exist. Attempting to create database dynamically.`);
                const urlMatch = connectionString.match(/\/([a-zA-Z0-9_-]+)(?:\?.*)?$/);
                const targetDbName = urlMatch ? urlMatch[1] : null;

                if (targetDbName) {
                    // Connect to default 'postgres' database to create the new database
                    const defaultConnString = connectionString.replace(/\/([a-zA-Z0-9_-]+)(?:\?.*)?$/, "/postgres");
                    const adminClient = new Client({
                            connectionString: defaultConnString,
                        ssl: defaultConnString.includes("localhost") || defaultConnString.includes("127.0.0.1")
                            ? false
                                : { rejectUnauthorized: true }
                    });
                    await adminClient.connect();
                    await adminClient.query(`CREATE DATABASE "${targetDbName}"`);
                    await adminClient.end();
                    console.log(`📡 [MOCK DB] Created database '${targetDbName}' successfully.`);

                    // Reconnect to newly created database
                    client = new Client({
                        connectionString,
                        ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
                            ? false
                            : { rejectUnauthorized: true }
                    });
                    await client.connect();
                } else {
                    throw connErr;
                }
            } else {
                throw connErr;
            }
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id VARCHAR(50) PRIMARY KEY,
                fullName VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(30) NOT NULL,
                expectedStartDate VARCHAR(20) NOT NULL,
                choiceOption1 VARCHAR(50) NOT NULL,
                courseName VARCHAR(200) NOT NULL,
                courseCategory VARCHAR(55),
                courseFee INTEGER,
                discountPercentage NUMERIC,
                finalPayableAmount NUMERIC,
                enrollmentStatus VARCHAR(50) DEFAULT 'Draft',
                approvalStatus VARCHAR(50) DEFAULT 'Pending',
                aiPriorityScore INTEGER,
                riskLevel VARCHAR(30),
                createdDate VARCHAR(50),
                entranceExam VARCHAR(60),
                rollNumber VARCHAR(100),
                rankScore VARCHAR(30),
                choiceOption2 VARCHAR(50),
                category VARCHAR(20),
                qualifyingExam VARCHAR(100),
                scholarshipCategory VARCHAR(50),
                dataAuthorization BOOLEAN,
                applicantDetails JSONB
            );
        `);
        await client.query(`
            ALTER TABLE enrollments
            ADD COLUMN IF NOT EXISTS entranceExam VARCHAR(60),
            ADD COLUMN IF NOT EXISTS rollNumber VARCHAR(100),
            ADD COLUMN IF NOT EXISTS rankScore VARCHAR(30),
            ADD COLUMN IF NOT EXISTS choiceOption2 VARCHAR(50),
            ADD COLUMN IF NOT EXISTS category VARCHAR(20),
            ADD COLUMN IF NOT EXISTS qualifyingExam VARCHAR(100),
            ADD COLUMN IF NOT EXISTS scholarshipCategory VARCHAR(50),
            ADD COLUMN IF NOT EXISTS dataAuthorization BOOLEAN,
            ADD COLUMN IF NOT EXISTS applicantDetails JSONB
        `);
        pgClient = client;
        useDatabase = true;
        console.log("🐘 [MOCK DB] Connected to PostgreSQL. Initialized table.");

        const res = await pgClient.query("SELECT * FROM enrollments ORDER BY createdDate DESC");
        enrollments.length = 0;
        for (const row of res.rows) {
            enrollments.push({
                id: row.id,
                fullName: row.fullname,
                email: row.email,
                phone: row.phone,
                expectedStartDate: row.expectedstartdate,
                choiceOption1: row.choiceoption1,
                courseName: row.coursename,
                courseCategory: row.coursecategory,
                courseFee: parseInt(row.coursefee) || 0,
                discountPercentage: parseFloat(row.discountpercentage) || 0,
                finalPayableAmount: parseFloat(row.finalpayableamount) || 0,
                enrollmentStatus: row.enrollmentstatus,
                approvalStatus: row.approvalstatus,
                aiPriorityScore: parseInt(row.aipriorityscore) || 0,
                riskLevel: row.risklevel,
                createdDate: row.createddate,
                entranceExam: row.entranceexam,
                rollNumber: row.rollnumber,
                rankScore: row.rankscore,
                choiceOption2: row.choiceoption2,
                category: row.category,
                qualifyingExam: row.qualifyingexam,
                scholarshipCategory: row.scholarshipcategory,
                dataAuthorization: row.dataauthorization,
                applicantDetails: row.applicantdetails || {}
            });
        }
        console.log(`🐘 [MOCK DB] Loaded ${enrollments.length} records dynamically from Postgres table query.`);
    } catch (err) {
        console.error("🐘 [MOCK DB] PostgreSQL initialization failed:", err.message);
        console.log("[MOCK DB] Gracefully falling back to local JSON database caching.");
        loadDb();
    }
}

function saveDb() {
    try {
        const dir = path.dirname(DB_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(enrollments, null, 2), { encoding: "utf8", mode: 0o600 });
        fs.chmodSync(DB_FILE, 0o600);
        console.log(`[MOCK DB] Saved ${enrollments.length} records to local cache backup: ${DB_FILE}`);
    } catch (err) {
        console.error("[MOCK DB] Error writing database backup:", err);
    }
}

async function saveEnrollmentDb(record) {
    if (useDatabase && pgClient) {
        try {
            await pgClient.query(`
                INSERT INTO enrollments (
                    id, fullName, email, phone, expectedStartDate, choiceOption1, 
                    courseName, courseCategory, courseFee, discountPercentage, 
                    finalPayableAmount, enrollmentStatus, approvalStatus, aiPriorityScore, riskLevel, createdDate,
                    entranceExam, rollNumber, rankScore, choiceOption2, category, qualifyingExam, scholarshipCategory, dataAuthorization, applicantDetails
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
                ON CONFLICT (id) DO UPDATE SET
                    fullName = EXCLUDED.fullName,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    expectedStartDate = EXCLUDED.expectedStartDate,
                    choiceOption1 = EXCLUDED.choiceOption1,
                    courseName = EXCLUDED.courseName,
                    courseCategory = EXCLUDED.courseCategory,
                    courseFee = EXCLUDED.courseFee,
                    discountPercentage = EXCLUDED.discountPercentage,
                    finalPayableAmount = EXCLUDED.finalPayableAmount,
                    enrollmentStatus = EXCLUDED.enrollmentStatus,
                    approvalStatus = EXCLUDED.approvalStatus,
                    aiPriorityScore = EXCLUDED.aiPriorityScore,
                    riskLevel = EXCLUDED.riskLevel,
                    createdDate = EXCLUDED.createdDate,
                    entranceExam = EXCLUDED.entranceExam,
                    rollNumber = EXCLUDED.rollNumber,
                    rankScore = EXCLUDED.rankScore,
                    choiceOption2 = EXCLUDED.choiceOption2,
                    category = EXCLUDED.category,
                    qualifyingExam = EXCLUDED.qualifyingExam,
                    scholarshipCategory = EXCLUDED.scholarshipCategory,
                    dataAuthorization = EXCLUDED.dataAuthorization,
                    applicantDetails = EXCLUDED.applicantDetails
            `, [
                record.id, record.fullName, record.email, record.phone, record.expectedStartDate, record.choiceOption1,
                record.courseName, record.courseCategory, record.courseFee, record.discountPercentage,
                record.finalPayableAmount, record.enrollmentStatus, record.approvalStatus, record.aiPriorityScore, record.riskLevel, record.createdDate,
                record.entranceExam || null, record.rollNumber || null, record.rankScore || null, record.choiceOption2 || null,
                record.category || null, record.qualifyingExam || null, record.scholarshipCategory || null, record.dataAuthorization || false,
                JSON.stringify(record.applicantDetails || {})
            ]);
            console.log(`🐘 [MOCK DB] Synchronized record ${record.id} in PostgreSQL backend database.`);
        } catch (err) {
            console.error(`🐘 [MOCK DB] Failed to sync record ${record.id} in Postgres:`, err.message);
        }
    }
    saveDb();
}

function loadDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                enrollments.length = 0;
                enrollments.push(...parsed);
                console.log(`[MOCK DB] Loaded ${enrollments.length} records from local cache fallback: ${DB_FILE}`);
            }
        }
    } catch (err) {
        console.error("[MOCK DB] Error loading database cache fallback:", err);
    }
}

function loadLeads() {
    try {
        if (fs.existsSync(LEADS_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
            if (Array.isArray(parsed)) leads.push(...parsed);
        }
    } catch (err) {
        console.error("[LOCAL LEADS] Unable to load local inquiry records:", err.message);
    }
}

function saveLead(record) {
    const dir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    leads.push(record);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), { encoding: "utf8", mode: 0o600 });
    fs.chmodSync(LEADS_FILE, 0o600);
}

function storePrivateDocuments(documents, enrollmentId) {
    if (documents === undefined) return [];
    if (!Array.isArray(documents) || documents.length > 3) {
        throw new Error("Upload no more than 3 supporting documents.");
    }

    const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
    const privateDir = path.join(DATA_DIR, "private-documents");
    fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
    let totalBytes = 0;

    return documents.map((document, index) => {
        if (!document || !allowedTypes.has(document.type) || typeof document.data !== "string") {
            throw new Error("Documents must be PDF, JPEG, or PNG files.");
        }
        const bytes = Buffer.from(document.data, "base64");
        if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024 || bytes.toString("base64") !== document.data) {
            throw new Error("Each document must be a valid file no larger than 2 MB.");
        }
        totalBytes += bytes.length;
        if (totalBytes > 6 * 1024 * 1024) throw new Error("The combined document upload limit is 6 MB.");

        const validSignature = document.type === "application/pdf"
            ? bytes.subarray(0, 5).toString("ascii") === "%PDF-"
            : document.type === "image/png"
                ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
                : bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        if (!validSignature) throw new Error("A document's file contents do not match its declared type.");

        const extension = document.type === "application/pdf" ? "pdf" : document.type === "image/png" ? "png" : "jpg";
        const storageName = `${enrollmentId}-${index + 1}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
        fs.writeFileSync(path.join(privateDir, storageName), bytes, { mode: 0o600, flag: "wx" });
        return {
            name: String(document.name || `document-${index + 1}`).replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 120),
            type: document.type,
            size: bytes.length,
            storageName,
        };
    });
}

// Initialize datastore
initPostgres();
loadLeads();

// Setup CORS headers
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsHeaders = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Max-Age": 2592000, // 30 days
};

// Session store for multi-turn conversations
// Key: sessionId, Value: Array of Gemini message objects: { role: 'user'|'model', parts: [{ text: '...' }] }
const sessions = new Map();

// Salesforce OAuth 2.0 token caching and helper
let cachedToken = null;
let tokenExpiry = 0;
let cachedInstanceUrl = "";

async function getSalesforceConnection() {
    if (cachedToken && Date.now() < tokenExpiry - 300000) {
        return { accessToken: cachedToken, instanceUrl: cachedInstanceUrl };
    }

    console.log("[SALESFORCE] Authenticating with Salesforce using Client Credentials Flow...");
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    let myDomain = process.env.SF_MY_DOMAIN || "";

    if (myDomain && !myDomain.startsWith("http")) {
        myDomain = "https://" + myDomain;
    }
    if (myDomain && myDomain.endsWith("/")) {
        myDomain = myDomain.slice(0, -1);
    }

    const tokenUrl = myDomain
        ? `${myDomain}/services/oauth2/token`
        : "https://login.salesforce.com/services/oauth2/token";

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    });

    const tokenData = await response.json();
    if (!response.ok) {
        throw new Error("Salesforce authentication failed: " + JSON.stringify(tokenData));
    }

    cachedToken = tokenData.access_token;
    cachedInstanceUrl = tokenData.instance_url;
    tokenExpiry = Date.now() + 7200000; // 2 hours cached validity

    console.log("[SALESFORCE] Authentication successful. Token cached.");
    return { accessToken: cachedToken, instanceUrl: cachedInstanceUrl };
}

async function sendTwilioWhatsApp(toPhone, messageBody) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || "+14155238886";

    if (!accountSid || !authToken) {
        console.warn("[TWILIO API] Warning: Twilio credentials not configured in .env. Skipping message.");
        return;
    }

    console.log("[TWILIO API] Sending outbound WhatsApp notification.");

    const formatFrom = fromPhone.startsWith("whatsapp:") ? fromPhone : `whatsapp:${fromPhone}`;
    const formatTo = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;

    const authString = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append("From", formatFrom);
    params.append("To", formatTo);
    params.append("Body", messageBody);

    try {
        const res = await fetch(twilioUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
        });

        const data = await res.json();
        if (res.ok) {
            console.log(`[TWILIO API] Message sent successfully. SID: ${data.sid}`);
        } else {
            console.error("[TWILIO API] Failed to send message:", data);
        }
    } catch (err) {
        console.error("[TWILIO API] Error hitting Twilio REST API:", err);
    }
}



// Sample institution facts supplied to Gemini; this is prompt context, not a live knowledge base.
const AG_SAMPLE_CONTEXT = `
AG AI Admissions is a demonstration student-admissions portal, not an institution.
The demonstration includes example undergraduate engineering, postgraduate engineering, and Ph.D. pathways.
All displayed fees, intake figures, scholarship rules, eligibility criteria, dates, locations, and contact details are illustrative only.
No accreditation, affiliation, ranking, placement result, real campus, or real admissions policy is claimed.
For information not explicitly shown in the demo, say that the institution must publish and confirm it.
`;

const NEMO_SYSTEM_PROMPT = `
You are Nemo, the friendly AI admissions assistant for AG AI Admissions. The configured Gemini service generates your responses. Welcome visitors to AG AI Admissions and answer questions using the sample information. Be transparent that the portal is a demonstration system, not an institution.

${AG_SAMPLE_CONTEXT}

Be warm, clear, and concise. Help visitors explore sample programmes and application steps. Do not invent dates, fees, contacts, policies, or institutional credentials. Do not describe sample counselor estimates as AI decisions or official admission decisions. Do not promise that anyone will contact the visitor; follow-up integrations are optional and may not be configured.

If a visitor explicitly requests counselor follow-up, ask for consent and a preferred contact time. Request a phone number only when needed and explain that follow-up depends on configured integrations. Do not claim that a request has been delivered. Only after the visitor has provided a phone number and explicitly selected a contact time, prefix the reply with:
[TRIGGER_ADVISOR_HANDOFF]
Then explain that this is a sample handoff request and delivery is not guaranteed. Never output the handoff marker without consent, a phone number, and the selected contact time.
`;

// Helper to write JSON responses
const sendJson = (res, statusCode, data) => {
    res.writeHead(statusCode, {
        ...corsHeaders,
        "Content-Type": "application/json",
    });
    res.end(JSON.stringify(data));
};

const server = http.createServer((req, res) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
        sendJson(res, 403, { error: "This origin is not allowed to access the admissions API." });
        return;
    }
    if (requestOrigin) {
        res.setHeader("Access-Control-Allow-Origin", requestOrigin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");

    let requestBytes = 0;
    let requestTooLarge = false;
    const requestLimit = req.url === "/api/enrollments" ? 10 * 1024 * 1024 : 1024 * 1024;
    req.on("data", (chunk) => {
        requestBytes += chunk.length;
        if (requestBytes > requestLimit && !requestTooLarge) {
            requestTooLarge = true;
            sendJson(res, 413, { error: `Request exceeds the ${requestLimit / (1024 * 1024)} MB size limit.` });
        }
    });

    // Handle CORS Preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    // Salesforce Contact/Lead Submission Route
    if (req.method === "POST" && req.url === "/createFormLead") {
        if (!allowRequest(req, "inquiry", 10, 10 * 60 * 1000)) {
            sendJson(res, 429, { error: "Too many inquiry submissions. Please try again later." });
            return;
        }
        let body = "";
        req.on("data", (chunk) => {
            if (!requestTooLarge) body += chunk.toString();
        });

        req.on("end", async () => {
            if (requestTooLarge) return;
            let record = null;
            let savedLocally = false;
            try {
                const payload = JSON.parse(body);
                const required = ["firstName", "lastName", "email", "cellPhone", "headquarters", "programType"];
                if (required.some((key) => typeof payload[key] !== "string" || !payload[key].trim())) {
                    sendJson(res, 400, { error: "Please provide a name, valid contact details, and programme interest." });
                    return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) {
                    sendJson(res, 400, { error: "Please provide a valid email address." });
                    return;
                }
                const phoneDigits = String(payload.cellPhone).replace(/\D/g, "");
                if (payload.firstName.length > 80 || payload.lastName.length > 80 || phoneDigits.length < 10 || phoneDigits.length > 15 || payload.dataAuthorization !== true) {
                    sendJson(res, 400, { error: "Please provide valid contact details and authorize processing before submitting." });
                    return;
                }

                record = {
                    id: `AG-LEAD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
                    firstName: payload.firstName.trim(),
                    lastName: payload.lastName.trim(),
                    email: payload.email.trim(),
                    cellPhone: payload.cellPhone.trim(),
                    homePhone: typeof payload.homePhone === "string" ? payload.homePhone.trim() : "",
                    headquarters: payload.headquarters.trim(),
                    programType: payload.programType.trim(),
                    dataAuthorization: payload.dataAuthorization === true,
                    createdAt: new Date().toISOString(),
                };
                saveLead(record);
                savedLocally = true;

                if (!process.env.SF_CLIENT_ID || !process.env.SF_CLIENT_SECRET) {
                    sendJson(res, 201, {
                        statusCode: 201,
                        message: "Inquiry saved to the local admissions store.",
                        data: { leadId: record.id, crmSyncStatus: "not_configured" },
                    });
                    return;
                }

                const sfConn = await getSalesforceConnection();
                const leadPayload = {
                    FirstName: payload.firstName || "",
                    LastName: payload.lastName || "Unknown",
                    Company: "AG AI Admissions (sample)",
                    Email: payload.email || "",
                    Phone: payload.cellPhone || "",
                    Description: `Campus Location: ${payload.headquarters || ""}\nProgram Interest: ${payload.programType || ""}\nHome Phone: ${payload.homePhone || ""}\nData Authorization: ${payload.dataAuthorization || false}`
                };

                const leadResponse = await fetch(`${sfConn.instanceUrl}/services/data/v58.0/sobjects/Lead`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${sfConn.accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(leadPayload)
                });

                const leadResult = await leadResponse.json();
                if (!leadResponse.ok) {
                    console.error("[SALESFORCE API] Lead creation failed:", leadResult);
                    throw new Error("Salesforce Lead insertion error: " + JSON.stringify(leadResult));
                }

                console.log(`[SALESFORCE API] Lead created successfully with ID: ${leadResult.id}`);

                sendJson(res, 200, {
                    statusCode: 200,
                    message: "Lead created successfully",
                    data: {
                        leadId: leadResult.id,
                        localLeadId: record.id,
                        crmSyncStatus: "synced",
                    },
                });
            } catch (err) {
                if (savedLocally) {
                    console.error("[SALESFORCE] Optional lead sync failed:", err.message);
                    sendJson(res, 201, {
                        statusCode: 201,
                        message: "Inquiry saved locally; optional Salesforce sync failed.",
                        data: { leadId: record.id, crmSyncStatus: "failed" },
                    });
                    return;
                }
                if (err instanceof SyntaxError) {
                    sendJson(res, 400, { error: "Invalid JSON request body." });
                    return;
                }
                console.error("[INQUIRY] Could not store inquiry:", err);
                sendJson(res, 500, { error: "Unable to save the inquiry. Please try again." });
            }
        });
        return;
    }


    // Google Gemini API Proxy SSE Stream
    if (req.method === "POST" && req.url === "/") {
        if (!allowRequest(req, "chat", 30, 5 * 60 * 1000)) {
            sendJson(res, 429, { error: "Too many chat requests. Please wait a moment before trying again." });
            return;
        }
        let body = "";
        req.on("data", (chunk) => {
            if (!requestTooLarge) body += chunk.toString();
        });

        req.on("end", async () => {
            if (requestTooLarge) return;
            try {
                const requestData = JSON.parse(body);
                const runtimeSessionId = requestData.runtimeSessionId;
                const payload = requestData.payload || {};
                const prompt = payload.prompt || "";
                const phoneNumber = payload.phone_number || "anonymous";

                if (typeof runtimeSessionId !== "string" || runtimeSessionId.length < 8 || runtimeSessionId.length > 128 ||
                    typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000) {
                    sendJson(res, 400, { error: "Provide a valid chat session and a message up to 4,000 characters." });
                    return;
                }

                console.log(`\n[GEMINI PROXY] Message Request - Session ID: ${runtimeSessionId}`);
                console.log(`[GEMINI PROXY] Received message (${prompt.length} characters).`);

                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                    console.error("[GEMINI PROXY] Missing GEMINI_API_KEY in .env");
                    sendJson(res, 503, { error: "AI chat is unavailable because the Gemini service is not configured on the backend." });
                    return;
                }

                // Set Headers for SSE streaming output to client
                res.writeHead(200, {
                    ...corsHeaders,
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                });

                // 1. Send simulated tool status before getting Gemini response
                res.write(`data: ${JSON.stringify({ thinking: "Checking AG admissions information..." })}\n\n`);
                await new Promise((resolve) => setTimeout(resolve, 500));

                // 2. Fetch history for this session
                if (!sessions.has(runtimeSessionId)) {
                    if (sessions.size >= 500) sessions.delete(sessions.keys().next().value);
                    sessions.set(runtimeSessionId, []);
                }
                const sessionHistory = sessions.get(runtimeSessionId);
                if (sessionHistory.length >= 40) sessionHistory.splice(0, sessionHistory.length - 39);

                // Append user prompt to history
                sessionHistory.push({
                    role: "user",
                    parts: [{ text: prompt }],
                });

                // 3. Request Google Gemini streamGenerateContent API
                const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
                const geminiPayload = {
                    contents: sessionHistory,
                    systemInstruction: {
                        parts: [{ text: NEMO_SYSTEM_PROMPT }],
                    },
                };

                const geminiResponse = await fetch(geminiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                    },
                    body: JSON.stringify(geminiPayload),
                });

                if (!geminiResponse.ok) {
                    const errText = await geminiResponse.text();
                    console.error("[GEMINI PROXY] API request failed:", geminiResponse.status, errText);
                    res.write(`data: ${JSON.stringify({ error: `Gemini API Error: ${geminiResponse.statusText}` })}\n\n`);
                    res.end();
                    return;
                }

                const reader = geminiResponse.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let fullReply = "";
                let isHandoffTriggered = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop(); // Keep unfinished line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine.startsWith("data: ")) continue;

                        const jsonStr = trimmedLine.slice(6).trim();
                        if (!jsonStr) continue;

                        try {
                            const chunkData = JSON.parse(jsonStr);
                            let textChunk = chunkData.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (textChunk) {
                                fullReply += textChunk;

                                // Check for Handoff Trigger tag
                                if (fullReply.includes("[TRIGGER_ADVISOR_HANDOFF]")) {
                                    isHandoffTriggered = true;
                                    textChunk = textChunk.replace("[TRIGGER_ADVISOR_HANDOFF]", "");
                                }

                                // If handoff is triggered, clean up textChunk of the tag
                                if (isHandoffTriggered) {
                                    textChunk = textChunk.replace(/\[TRIGGER_ADVISOR_HANDOFF\]/gi, "");
                                }

                                if (textChunk) {
                                    // Forward content chunk to client
                                    res.write(`data: ${JSON.stringify({ response: textChunk })}\n\n`);
                                }
                            }
                        } catch (pErr) {
                            console.error("[GEMINI PROXY] Chunk parse error:", pErr);
                        }
                    }
                }

                // Clean final reply text for history storage
                const cleanedReply = fullReply.replace(/\[TRIGGER_ADVISOR_HANDOFF\]/gi, "").trim();

                // 4. Handle Advisor Handoff actions
                if (isHandoffTriggered) {
                    console.log("\n------------------ REAL-AI HANDOFF DETECTED ------------------");
                    let targetPhone = phoneNumber;
                    try {
                        const sfConn = await getSalesforceConnection();
                        let leadId = null;

                        // Resolve Target Phone from Context or History
                        if (targetPhone === "anonymous" || !targetPhone) {
                            // Match phone numbers like +91 9392532859, +15555022388, etc.
                            const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\+?\d{10,12}/g;
                            for (let i = sessionHistory.length - 1; i >= 0; i--) {
                                const text = sessionHistory[i].parts?.[0]?.text || "";
                                const matches = text.match(phoneRegex);
                                if (matches && matches.length > 0) {
                                    targetPhone = matches[0].trim();
                                    break;
                                }
                            }
                        }

                        if (targetPhone === "anonymous" || !targetPhone) {
                            console.warn("[ADVISOR HANDOFF] A handoff was requested without a verified phone number; no message was sent.");
                            res.write(`data: ${JSON.stringify({ tool_result: "No phone number was provided, so no counselor message was sent." })}\n\n`);
                            targetPhone = null;
                        }

                        if (!targetPhone) {
                            res.write(`data: ${JSON.stringify({ final_result: cleanedReply })}\n\n`);
                            res.end();
                            return;
                        }

                        // Look up lead by phone
                        const escapedPhone = targetPhone.replace(/'/g, "\\'");
                        const queryUrl = `${sfConn.instanceUrl}/services/data/v58.0/query?q=SELECT+Id+FROM+Lead+WHERE+Phone='${encodeURIComponent(escapedPhone)}'+OR+MobilePhone='${encodeURIComponent(escapedPhone)}'+ORDER+BY+CreatedDate+DESC+LIMIT+1`;

                        const queryRes = await fetch(queryUrl, {
                            method: "GET",
                            headers: {
                                "Authorization": `Bearer ${sfConn.accessToken}`
                            }
                        });

                        if (queryRes.ok) {
                            const queryData = await queryRes.json();
                            if (queryData.records && queryData.records.length > 0) {
                                leadId = queryData.records[0].Id;
                                console.log(`[SALESFORCE API] Found existing lead with ID: ${leadId}`);
                            }
                        }

                        if (leadId) {
                            // Update Lead Status to 'Working - Contacted'
                            console.log(`[SALESFORCE API] Updating lead status to 'Working - Contacted'...`);
                            await fetch(`${sfConn.instanceUrl}/services/data/v58.0/sobjects/Lead/${leadId}`, {
                                method: "PATCH",
                                headers: {
                                    "Authorization": `Bearer ${sfConn.accessToken}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ Status: "Working - Contacted" })
                            });
                        } else {
                            // Create a new lead for handoff
                            console.log(`[SALESFORCE API] Lead not found. Creating new handoff lead...`);
                            const newLeadBody = {
                                FirstName: "Chat Handoff",
                                LastName: "Admissions Prospect",
                                Company: "AG AI Admissions (sample)",
                                Phone: targetPhone,
                                Description: "Lead created automatically by Nemo AI chatbot on advisor handoff.",
                                Status: "Working - Contacted"
                            };
                            const createLeadRes = await fetch(`${sfConn.instanceUrl}/services/data/v58.0/sobjects/Lead`, {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${sfConn.accessToken}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(newLeadBody)
                            });
                            const createLeadData = await createLeadRes.json();
                            if (createLeadRes.ok) {
                                leadId = createLeadData.id;
                                console.log(`[SALESFORCE API] Handoff lead created successfully with ID: ${leadId}`);
                            }
                        }

                        if (leadId) {
                            // Create follow-up Task
                            console.log(`[SALESFORCE API] Creating Task associated with Lead ${leadId}...`);
                            const taskBody = {
                                Subject: "Admissions Advisor Handoff - AI Chat Summary",
                                WhoId: leadId,
                                Description: `AI Advisor Handoff Requested for student with phone number ${targetPhone}.\n\nChat Transcript Summary:\n${cleanedReply}`,
                                Status: "Not Started",
                                Priority: "High"
                            };
                            const createTaskRes = await fetch(`${sfConn.instanceUrl}/services/data/v58.0/sobjects/Task`, {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${sfConn.accessToken}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(taskBody)
                            });
                            const createTaskData = await createTaskRes.json();
                            if (createTaskRes.ok) {
                                console.log(`[SALESFORCE API] High-Priority Task created: ${createTaskData.id}`);
                            } else {
                                console.error("[SALESFORCE API] Task creation failed:", createTaskData);
                            }
                        }
                    } catch (sfErr) {
                        console.error("[SALESFORCE API] Error during live Salesforce handoff operations:", sfErr);
                    }
                    const twilioMsg = `This is an automated sample notification from AG AI Admissions. This demo cannot guarantee counselor follow-up.`;
                    await sendTwilioWhatsApp(targetPhone, twilioMsg);
                    console.log("----------------------------------------------------------------\n");

                    // Write a small helper SSE indicator to UI if helpful
                    res.write(`data: ${JSON.stringify({ tool_result: "Sample counselor handoff attempted. Delivery depends on configured integrations." })}\n\n`);
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }


                // Append assistant reply to history
                sessionHistory.push({
                    role: "model",
                    parts: [{ text: cleanedReply }],
                });

                // 5. Send final outcome to client
                res.write(`data: ${JSON.stringify({ final_result: cleanedReply })}\n\n`);
                res.end();

            } catch (err) {
                console.error("[GEMINI PROXY] Error processing request:", err);
                res.write(`data: ${JSON.stringify({ error: err.message || "Proxy exception occurred." })}\n\n`);
                res.end();
            }
        });
        return;
    }

    // Helper to query authorization header check
    function checkAuthorized(req, res) {
        if (!JWT_SECRET || JWT_SECRET.length < 32) {
            sendJson(res, 503, { error: "Counselor authentication is not configured on this server." });
            return null;
        }
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            sendJson(res, 401, { error: "Unauthorized access: Missing session token" });
            return null;
        }
        const token = authHeader.substring(7);
        const verified = verifyJwt(token, JWT_SECRET);
        if (!verified || verified.role !== "counselor" || verified.sub !== COUNSELOR_USER) {
            sendJson(res, 401, { error: "Unauthorized access: Session expired or invalid signature" });
            return null;
        }
        return verified;
    }

    // Counselor Authenticated Login Route
    if (req.method === "POST" && req.url === "/api/counselor/login") {
        let body = "";
        req.on("data", (chunk) => {
            if (!requestTooLarge) body += chunk.toString();
        });

        req.on("end", () => {
            if (requestTooLarge) return;
            try {
                if (!JWT_SECRET || JWT_SECRET.length < 32 || !COUNSELOR_USER || !COUNSELOR_PASS) {
                    sendJson(res, 503, { success: false, error: "Counselor authentication is not configured on this server." });
                    return;
                }
                const payload = JSON.parse(body);
                const { username, password } = payload;
                const clientIp = req.socket.remoteAddress || "unknown";
                const now = Date.now();
                const previousAttempts = loginAttempts.get(clientIp);
                if (previousAttempts && now - previousAttempts.startedAt < 15 * 60 * 1000 && previousAttempts.count >= 5) {
                    sendJson(res, 429, { success: false, error: "Too many sign-in attempts. Try again in 15 minutes." });
                    return;
                }
                const safeCompare = (provided, expected) => {
                    const providedBytes = Buffer.from(String(provided || ""));
                    const expectedBytes = Buffer.from(String(expected || ""));
                    return providedBytes.length === expectedBytes.length && crypto.timingSafeEqual(providedBytes, expectedBytes);
                };
                if (safeCompare(username, COUNSELOR_USER) && safeCompare(password, COUNSELOR_PASS)) {
                    loginAttempts.delete(clientIp);
                    const token = signJwt(
                        { sub: COUNSELOR_USER, role: "counselor", exp: Date.now() + 3600000 }, // 1 hour token
                        JWT_SECRET
                    );
                    sendJson(res, 200, { success: true, token });
                } else {
                    const attempts = previousAttempts && now - previousAttempts.startedAt < 15 * 60 * 1000
                        ? previousAttempts
                        : { count: 0, startedAt: now };
                    attempts.count += 1;
                    loginAttempts.set(clientIp, attempts);
                    sendJson(res, 401, { success: false, error: "Invalid username or password credentials" });
                }
            } catch (err) {
                console.error("[AUTH] Counselor login error:", err);
                sendJson(res, 400, { error: "Invalid request payload" });
            }
        });
        return;
    }

    // -------------------------------------------------------------
    // NEW PORTAL ENHANCEMENT ENDPOINTS
    // -------------------------------------------------------------

    // 1. GET /api/courses
    if (req.method === "GET" && req.url === "/api/courses") {
        sendJson(res, 200, COURSES);
        return;
    }

    const documentRequest = req.url.match(/^\/api\/enrollments\/([^/?]+)\/documents\/([^/?]+)$/);
    if (req.method === "GET" && documentRequest) {
        if (!checkAuthorized(req, res)) return;
        const [, enrollmentId, storageName] = documentRequest;
        const enrollment = enrollments.find((record) => record.id === enrollmentId);
        const document = enrollment?.applicantDetails?.documents?.find((item) => item.storageName === storageName);
        if (!document || !/^[a-zA-Z0-9-]+\.(pdf|jpg|png)$/.test(storageName)) {
            sendJson(res, 404, { error: "Document not found." });
            return;
        }
        const filePath = path.join(DATA_DIR, "private-documents", storageName);
        fs.readFile(filePath, (error, contents) => {
            if (error) {
                sendJson(res, 404, { error: "The private document is unavailable." });
                return;
            }
            res.writeHead(200, {
                ...corsHeaders,
                "Content-Type": "application/octet-stream",
                "Content-Length": contents.length,
                "Content-Disposition": `attachment; filename="${document.name.replace(/["\\\\\r\n]/g, "_")}"`,
                "Cache-Control": "private, no-store",
            });
            res.end(contents);
        });
        return;
    }

    // 2. GET /api/enrollments
    if (req.method === "GET" && req.url === "/api/enrollments") {
        if (!checkAuthorized(req, res)) return;
        sendJson(res, 200, enrollments);
        return;
    }

    // 3. GET /api/enrollments/ai-insights (rule-based sample summary for the counselor demo)
    if (req.method === "GET" && req.url.startsWith("/api/enrollments/ai-insights")) {
        if (!checkAuthorized(req, res)) return;
        const queryParams = new URLSearchParams(req.url.split("?")[1] || "");
        const enrollmentId = queryParams.get("id");
        const found = enrollments.find(e => e.id === enrollmentId);

        if (!found) {
            sendJson(res, 404, { error: "Enrollment not found" });
            return;
        }

        const studentName = found.fullName || "Unknown Student";
        const courseName = found.courseName || "Unknown Course";
        const courseFee = found.courseFee || 0;
        const discount = found.discountPercentage || 0;
        const finalPayable = found.finalPayableAmount || 0;
        const status = found.enrollmentStatus || "Draft";
        const aiScore = found.aiPriorityScore || 50;
        const riskLevel = found.riskLevel || "Low";

        // Simulated AI Prompt outputs:
        const studentApplicationSummary = `Sample Student Application Summary:
* Applicant Name: ${studentName}
* Choice Course: ${courseName} (Standard fee: ₹${courseFee.toLocaleString('en-IN')})
* Financial Structure: Applied discount of ${discount}% resulting in a Final Payable Amount of ₹${finalPayable.toLocaleString('en-IN')}.
* Admission Status: The application is currently flagged as "${status}".
* Demonstration review score: ${aiScore}/100 (sample rule-based value; not an AI decision).
* Review flag: ${discount > 30 ? "High discount requires manual review." : "No high-discount review flag."}`;

        const admissionRiskAnalysis = `Sample Counselor Review:
1. Review category: ${riskLevel}.
2. Discount review: ${discount > 30 ? "Manual review recommended for this sample discount." : "No high-discount flag in this sample workflow."}
3. This output is generated from demo rules. It is not an AI assessment, admission probability, or official decision.
4. Verify all applicant details and published policies before taking action.`;

        sendJson(res, 200, {
            id: enrollmentId,
            studentApplicationSummary,
            admissionRiskAnalysis
        });
        return;
    }

    // 4. POST /api/enrollments
    if (req.method === "POST" && req.url === "/api/enrollments") {
        if (!allowRequest(req, "application", 10, 10 * 60 * 1000)) {
            sendJson(res, 429, { error: "Too many application submissions. Please try again later." });
            return;
        }
        let body = "";
        req.on("data", (chunk) => {
            if (!requestTooLarge) body += chunk.toString();
        });
        req.on("end", async () => {
            if (requestTooLarge) return;
            try {
                const payload = JSON.parse(body);
                const isCounselorEntry = payload.applicationSource === "counselor_enrollment";
                if (isCounselorEntry && !checkAuthorized(req, res)) return;
                if (!isCounselorEntry && payload.applicationSource !== "public_application") {
                    sendJson(res, 400, { error: "Specify a supported application source." });
                    return;
                }
                const required = ["fullName", "email", "phone", "choiceOption1"];
                if (required.some((key) => typeof payload[key] !== "string" || !payload[key].trim())) {
                    sendJson(res, 400, { error: "Student name, valid contact details, and a preferred branch are required." });
                    return;
                }
                const fieldLimits = {
                    fullName: 100, email: 254, phone: 30, dateOfBirth: 10, gender: 30, nationality: 80,
                    parentName: 100, parentPhone: 30, address: 500, tenthMarks: 50, twelfthMarks: 50,
                    entranceExam: 60, rollNumber: 100, rankScore: 30, expectedStartDate: 20,
                    category: 20, qualifyingExam: 100, scholarshipCategory: 50,
                };
                for (const [field, maxLength] of Object.entries(fieldLimits)) {
                    if (payload[field] !== undefined && (typeof payload[field] !== "string" || payload[field].length > maxLength)) {
                        sendJson(res, 400, { error: `The ${field} field is invalid or too long.` });
                        return;
                    }
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
                    sendJson(res, 400, { error: "Please provide a valid email address." });
                    return;
                }
                const normalizedEmail = payload.email.trim().toLowerCase();
                const phoneDigits = String(payload.phone).replace(/\D/g, "");
                if (payload.fullName.trim().length > 100 || payload.email.length > 254 || phoneDigits.length < 10 || phoneDigits.length > 15) {
                    sendJson(res, 400, { error: "Please provide a name up to 100 characters and a valid phone number." });
                    return;
                }
                const courseId = payload.choiceOption1;
                const courseItem = COURSES.find(c => c.id === courseId);
                if (!courseItem) {
                    sendJson(res, 400, { error: "Please choose a valid programme." });
                    return;
                }
                if (!isCounselorEntry &&
                    (!payload.entranceExam || !payload.rollNumber || !payload.rankScore || !payload.dataAuthorization || !payload.expectedStartDate)) {
                    sendJson(res, 400, { error: "Entrance examination, exam roll number, rank, and consent are required." });
                    return;
                }
                if (!isCounselorEntry && !["EAPCET", "APECET", "JEE Main", "Management Quota"].includes(payload.entranceExam)) {
                    sendJson(res, 400, { error: "Choose a supported entrance examination." });
                    return;
                }
                if (!isCounselorEntry) {
                    const rank = Number(String(payload.rankScore).replace(/[,\s]/g, ""));
                    if (!Number.isInteger(rank) || rank < 1) {
                        sendJson(res, 400, { error: "Please provide a valid positive entrance exam rank." });
                        return;
                    }
                    const dob = new Date(`${payload.dateOfBirth}T00:00:00`);
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.dateOfBirth || "") || Number.isNaN(dob.getTime()) || dob > new Date()) {
                        sendJson(res, 400, { error: "Please provide a valid date of birth that is not in the future." });
                        return;
                    }
                    const startDate = new Date(`${payload.expectedStartDate}T00:00:00`);
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.expectedStartDate || "") || Number.isNaN(startDate.getTime()) || startDate < new Date(new Date().toDateString())) {
                        sendJson(res, 400, { error: "Please provide a valid expected start date that is not in the past." });
                        return;
                    }
                    if (payload.choiceOption2 && (!COURSES.some((course) => course.id === payload.choiceOption2) || payload.choiceOption2 === payload.choiceOption1)) {
                        sendJson(res, 400, { error: "Choose a valid secondary programme different from your primary choice." });
                        return;
                    }
                }
                if (enrollments.some((record) => String(record.email || "").toLowerCase() === normalizedEmail)) {
                    sendJson(res, 409, { error: "An application with this email address already exists. Please contact admissions if you need to make a correction." });
                    return;
                }
                const fee = courseItem.fee;
                let discount = payload.discountPercentage === undefined ? 0 : Number(payload.discountPercentage);
                if (!isCounselorEntry) {
                    const rank = Number(String(payload.rankScore).replace(/[\s,]/g, "")) || 0;
                    if (payload.scholarshipCategory === "sports") discount = 20;
                    else if (payload.scholarshipCategory === "ews") discount = 30;
                    else if (payload.scholarshipCategory === "topper") discount = 50;
                    else if (payload.scholarshipCategory === "merit") {
                        if (payload.entranceExam === "APECET") discount = rank <= 200 ? 50 : rank <= 500 ? 30 : rank <= 1000 ? 15 : 5;
                        else discount = rank <= 5000 ? 50 : rank <= 15000 ? 30 : rank <= 30000 ? 15 : 5;
                    } else discount = 0;
                    if (payload.scholarshipCategory === "merit" && payload.entranceExam === "EAPCET" && rank > courseItem.cutoffEapcet) {
                        sendJson(res, 400, { error: "The entrance rank exceeds this programme's illustrative merit eligibility threshold." });
                        return;
                    }
                    if (payload.scholarshipCategory === "merit" && payload.entranceExam === "APECET" && rank > courseItem.cutoffEcet) {
                        sendJson(res, 400, { error: "The entrance rank exceeds this programme's illustrative lateral-entry merit threshold." });
                        return;
                    }
                }
                if (!Number.isFinite(discount) || discount < 0 || discount > 50) {
                    sendJson(res, 400, { error: "Sample scholarship discounts must be between 0 and 50 percent." });
                    return;
                }
                const finalPayable = Math.max(0, fee * (1 - (discount / 100)));
                const aiScore = 50;

                let risk = "Low";
                if (discount > 30) risk = "High";
                else if (discount >= 15) risk = "Medium";

                const appStatus = "Pending";
                const enrollStatus = "Submitted for Review";

                const brandNew = {
                    id: `ENR-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
                    fullName: payload.fullName || "Test Student",
                    email: normalizedEmail,
                    phone: payload.phone || "0000000000",
                    expectedStartDate: payload.expectedStartDate || new Date().toISOString().split("T")[0],
                    entranceExam: payload.entranceExam || null,
                    rollNumber: payload.rollNumber || null,
                    rankScore: payload.rankScore || null,
                    choiceOption1: courseId,
                    choiceOption2: payload.choiceOption2 || null,
                    category: payload.category || null,
                    qualifyingExam: payload.qualifyingExam || null,
                    scholarshipCategory: payload.scholarshipCategory || null,
                    dataAuthorization: payload.dataAuthorization === true,
                    applicantDetails: {
                        dateOfBirth: payload.dateOfBirth || null,
                        gender: payload.gender || null,
                        nationality: payload.nationality || null,
                        parentName: payload.parentName || null,
                        parentPhone: payload.parentPhone || null,
                        address: payload.address || null,
                        tenthMarks: payload.tenthMarks || null,
                        twelfthMarks: payload.twelfthMarks || null,
                        documents: [],
                    },
                    courseName: courseItem.name,
                    courseCategory: courseItem.category || "Technical",
                    courseFee: fee,
                    discountPercentage: discount,
                    finalPayableAmount: finalPayable,
                    enrollmentStatus: enrollStatus,
                    approvalStatus: appStatus,
                    aiPriorityScore: aiScore,
                    riskLevel: risk,
                    createdDate: new Date().toISOString()
                };

                brandNew.applicantDetails.documents = storePrivateDocuments(payload.documents, brandNew.id);

                enrollments.push(brandNew);
                await saveEnrollmentDb(brandNew);
                console.log(`[AG ADMISSIONS DB] Saved new student application: ${brandNew.id}`);

                // Mock triggered flow outputs in local log
                if (aiScore >= 80) {
                    console.log(`[AG ADMISSIONS SYSTEM] Review flag for ${brandNew.id}. No email notification is configured.`);
                }
                if (discount > 30) {
                    console.log(`[AG ADMISSIONS SYSTEM] Discount review flag for ${brandNew.id}. No manager email is configured.`);
                }

                sendJson(res, 201, brandNew);
            } catch (err) {
                console.error("Error parsing enrollment post:", err);
                sendJson(res, 400, { error: "Invalid JSON body" });
            }
        });
        return;
    }

    // 5. POST /api/enrollments/action
    if (req.method === "POST" && req.url === "/api/enrollments/action") {
        if (!checkAuthorized(req, res)) return;
        let body = "";
        req.on("data", (chunk) => { if (!requestTooLarge) body += chunk.toString(); });
        req.on("end", async () => {
            if (requestTooLarge) return;
            try {
                const payload = JSON.parse(body);
                const enrollmentId = payload.id;
                const action = payload.action; // "approve" or "reject"
                const foundIndex = enrollments.findIndex(e => e.id === enrollmentId);

                if (foundIndex === -1) {
                    sendJson(res, 404, { error: "Enrollment not found" });
                    return;
                }

                if (action === "approve") {
                    enrollments[foundIndex].approvalStatus = "Approved";
                    enrollments[foundIndex].enrollmentStatus = "Approved";
                    console.log(`[MOCK SF SYSTEM] Enrollment ${enrollmentId} APPROVED by manager.`);
                } else if (action === "reject") {
                    enrollments[foundIndex].approvalStatus = "Rejected";
                    enrollments[foundIndex].enrollmentStatus = "Rejected";
                    console.log(`[MOCK SF SYSTEM] Enrollment ${enrollmentId} REJECTED by manager.`);
                } else {
                    sendJson(res, 400, { error: "Action must be either approve or reject." });
                    return;
                }

                await saveEnrollmentDb(enrollments[foundIndex]);
                sendJson(res, 200, enrollments[foundIndex]);
            } catch (err) {
                console.error("Error parsing enrollment action post:", err);
                sendJson(res, 400, { error: "Invalid JSON body" });
            }
        });
        return;
    }

    // 404 Route
    res.writeHead(404, corsHeaders);
    res.end("Not Found");

});

server.listen(PORT, () => {
    console.log(`🚀 Admissions Agent Live-Gemini Simulator running at http://localhost:${PORT}`);
    console.log("Press Ctrl+C to terminate");
});
