import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { google } from "googleapis";
import crypto from "node:crypto";

const REQUIRED = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GMAIL_TOKEN_ENCRYPTION_KEY",
  "AZURE_STORAGE_CONNECTION_STRING",
  "APP_BASE_URL",
];

const TABLE_ACCOUNTS = "GmailAccounts";
const TABLE_HISTORY = "GmailHistory";
const ACCOUNT_PARTITION = "company";
const ACCOUNT_ROW = "primary";

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function validateEnvironment() {
  REQUIRED.forEach(env);
}

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || process.env.APP_BASE_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = allowedOrigins();
  const selected = allowed.includes(origin) ? origin : allowed[0] || "";
  return {
    ...(selected ? { "Access-Control-Allow-Origin": selected } : {}),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, x-user-id",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(request, status, body) {
  return { status, headers: corsHeaders(request), jsonBody: body };
}

function getUserId(request) {
  return (request.headers.get("x-user-id") || "company-admin").trim().slice(0, 120);
}

function accountClient() {
  return TableClient.fromConnectionString(env("AZURE_STORAGE_CONNECTION_STRING"), TABLE_ACCOUNTS);
}

function historyClient() {
  return TableClient.fromConnectionString(env("AZURE_STORAGE_CONNECTION_STRING"), TABLE_HISTORY);
}

async function ensureTables() {
  await Promise.all([
    accountClient().createTable().catch((error) => {
      if (error.statusCode !== 409) throw error;
    }),
    historyClient().createTable().catch((error) => {
      if (error.statusCode !== 409) throw error;
    }),
  ]);
}

function encryptionKey() {
  const key = Buffer.from(env("GMAIL_TOKEN_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY must be a base64 encoded 32-byte key");
  return key;
}

function encryptObject(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptObject(value) {
  const [ivText, tagText, encryptedText] = String(value || "").split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("Stored Gmail token is invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function oauthClient() {
  return new google.auth.OAuth2(
    env("GOOGLE_CLIENT_ID"),
    env("GOOGLE_CLIENT_SECRET"),
    env("GOOGLE_REDIRECT_URI"),
  );
}

function signState(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", encryptionKey())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyState(state) {
  const [encoded, signature] = String(state || "").split(".");
  const expected = crypto.createHmac("sha256", encryptionKey()).update(encoded || "").digest("base64url");
  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid OAuth state");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (Date.now() - payload.createdAt > 10 * 60 * 1000) throw new Error("OAuth state expired");
  return payload;
}

async function readAccount() {
  try {
    return await accountClient().getEntity(ACCOUNT_PARTITION, ACCOUNT_ROW);
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

async function authorizedClient() {
  const account = await readAccount();
  if (!account?.encryptedTokens) throw new Error("Gmail account is not connected");
  const client = oauthClient();
  client.setCredentials(decryptObject(account.encryptedTokens));
  client.on("tokens", async (tokens) => {
    const current = decryptObject(account.encryptedTokens);
    const merged = { ...current, ...tokens };
    await accountClient().upsertEntity({
      ...account,
      encryptedTokens: encryptObject(merged),
      updatedAt: new Date().toISOString(),
    }, "Merge");
  });
  return client;
}

function sanitizeHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function encodeSubject(value) {
  return `=?UTF-8?B?${Buffer.from(String(value || ""), "utf8").toString("base64")}?=`;
}

function normalizeRecipients(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[;,]/);
  return values.map((item) => sanitizeHeader(item)).filter(Boolean);
}

function buildRawMessage(payload) {
  const to = normalizeRecipients(payload.to);
  if (!to.length) throw new Error("宛先を入力してください");
  const cc = normalizeRecipients(payload.cc);
  const bcc = normalizeRecipients(payload.bcc);
  const subject = sanitizeHeader(payload.subject || "（件名なし）");
  const text = String(payload.body || "");
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const boundary = `chibana_${crypto.randomUUID().replaceAll("-", "")}`;
  const lines = [
    `To: ${to.join(", ")}`,
    ...(cc.length ? [`Cc: ${cc.join(", ")}`] : []),
    ...(bcc.length ? [`Bcc: ${bcc.join(", ")}`] : []),
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
  ];

  for (const attachment of attachments) {
    const fileName = sanitizeHeader(attachment.fileName || "attachment");
    const mimeType = sanitizeHeader(attachment.mimeType || "application/octet-stream");
    const content = String(attachment.base64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!content) continue;
    const bytes = Buffer.from(content, "base64");
    if (bytes.length > 20 * 1024 * 1024) throw new Error(`${fileName} は20MBを超えています`);
    lines.push(
      "",
      `--${boundary}`,
      `Content-Type: ${mimeType}; name="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${fileName}"`,
      "",
      bytes.toString("base64"),
    );
  }

  lines.push("", `--${boundary}--`);
  return Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
}

async function writeHistory({ userId, payload, result, status, errorMessage }) {
  const now = new Date();
  await historyClient().createEntity({
    partitionKey: now.toISOString().slice(0, 7),
    rowKey: `${now.getTime()}-${crypto.randomUUID()}`,
    userId,
    to: normalizeRecipients(payload.to).join(", "),
    cc: normalizeRecipients(payload.cc).join(", "),
    bcc: normalizeRecipients(payload.bcc).join(", "),
    subject: sanitizeHeader(payload.subject),
    attachmentNames: (payload.attachments || []).map((item) => sanitizeHeader(item.fileName)).join(", "),
    relatedProjectId: sanitizeHeader(payload.relatedProjectId),
    relatedEstimateId: sanitizeHeader(payload.relatedEstimateId),
    gmailMessageId: result?.id || "",
    gmailThreadId: result?.threadId || "",
    status,
    errorMessage: sanitizeHeader(errorMessage),
    sentAt: now.toISOString(),
  });
}

app.http("gmail-options", {
  methods: ["OPTIONS"],
  authLevel: "anonymous",
  route: "gmail/{*path}",
  handler: async (request) => ({ status: 204, headers: corsHeaders(request) }),
});

app.http("gmail-connect", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "gmail/connect",
  handler: async (request) => {
    try {
      validateEnvironment();
      const userId = getUserId(request);
      const state = signState({ userId, createdAt: Date.now() });
      const url = oauthClient().generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
        state,
      });
      return { status: 302, headers: { ...corsHeaders(request), Location: url } };
    } catch (error) {
      return json(request, 500, { ok: false, error: error.message });
    }
  },
});

app.http("gmail-callback", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "gmail/callback",
  handler: async (request) => {
    try {
      validateEnvironment();
      await ensureTables();
      const code = request.query.get("code");
      const state = verifyState(request.query.get("state"));
      if (!code) throw new Error("Google authorization code is missing");
      const client = oauthClient();
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const profile = await oauth2.userinfo.get();
      await accountClient().upsertEntity({
        partitionKey: ACCOUNT_PARTITION,
        rowKey: ACCOUNT_ROW,
        userId: state.userId,
        email: profile.data.email || "",
        encryptedTokens: encryptObject(tokens),
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, "Replace");
      const base = env("APP_BASE_URL").replace(/\/$/, "");
      return { status: 302, headers: { Location: `${base}/?gmail=connected` } };
    } catch (error) {
      const base = (process.env.APP_BASE_URL || "/").replace(/\/$/, "");
      return { status: 302, headers: { Location: `${base}/?gmail=error&message=${encodeURIComponent(error.message)}` } };
    }
  },
});

app.http("gmail-status", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "gmail/status",
  handler: async (request) => {
    try {
      validateEnvironment();
      await ensureTables();
      const account = await readAccount();
      return json(request, 200, {
        ok: true,
        connected: Boolean(account?.encryptedTokens),
        email: account?.email || null,
        connectedAt: account?.connectedAt || null,
      });
    } catch (error) {
      return json(request, 500, { ok: false, error: error.message });
    }
  },
});

app.http("gmail-send", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "gmail/send",
  handler: async (request) => {
    let payload = {};
    const userId = getUserId(request);
    try {
      validateEnvironment();
      await ensureTables();
      payload = await request.json();
      const auth = await authorizedClient();
      const gmail = google.gmail({ version: "v1", auth });
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: buildRawMessage(payload) },
      });
      await writeHistory({ userId, payload, result: response.data, status: "sent" });
      return json(request, 200, {
        ok: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
      });
    } catch (error) {
      try {
        await ensureTables();
        await writeHistory({ userId, payload, status: "failed", errorMessage: error.message });
      } catch {
        // Keep the original sending error as the response.
      }
      return json(request, 400, { ok: false, error: error.message });
    }
  },
});

app.http("gmail-history", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "gmail/history",
  handler: async (request) => {
    try {
      validateEnvironment();
      await ensureTables();
      const limit = Math.min(Math.max(Number(request.query.get("limit")) || 50, 1), 200);
      const items = [];
      for await (const entity of historyClient().listEntities({ queryOptions: { filter: `userId eq '${getUserId(request).replaceAll("'", "''")}'` } })) {
        items.push(entity);
      }
      items.sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
      return json(request, 200, { ok: true, items: items.slice(0, limit) });
    } catch (error) {
      return json(request, 500, { ok: false, error: error.message });
    }
  },
});
