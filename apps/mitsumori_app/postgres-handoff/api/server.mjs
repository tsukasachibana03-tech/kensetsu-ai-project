import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const port = Number(process.env.PORT || 8766);
const appDirectory = path.resolve(process.env.APP_DIR || "/srv/app");
const initialDataPath = process.env.INITIAL_DATA_PATH || "";
const printDirectory = path.resolve(process.env.PRINT_DIR || "/prints");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".mjs": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf"
};

function isInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function normalizePayload(text) {
  if (!text || !text.trim()) throw new Error("empty data");
  const payload = JSON.parse(text);
  const book = payload.book || payload;
  if (!Array.isArray(book.estimates) || book.estimates.length === 0) {
    throw new Error("estimate data not found");
  }
  return {
    payload,
    content: `${JSON.stringify(payload, null, 2)}\n`,
    estimateCount: book.estimates.length,
    activeId: book.activeId || ""
  };
}

function revisionOf(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function send(response, status, body, contentType = "text/plain; charset=utf-8", headers = {}) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(body);
}

async function readBody(request, maxBytes = 25 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("data too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readBinaryBody(request, maxBytes = 100 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("file too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mitsumori_state (
      singleton_id smallint PRIMARY KEY CHECK (singleton_id = 1),
      payload jsonb NOT NULL,
      revision text NOT NULL,
      source_name text NOT NULL DEFAULT 'estimate-app',
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS mitsumori_state_history (
      history_id bigserial PRIMARY KEY,
      payload jsonb NOT NULL,
      revision text NOT NULL,
      source_name text NOT NULL,
      saved_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function readStoredState(client = pool) {
  const result = await client.query(
    `SELECT payload, revision, source_name, updated_at
       FROM mitsumori_state
      WHERE singleton_id = 1`
  );
  if (!result.rowCount) return null;
  const row = result.rows[0];
  const content = `${JSON.stringify(row.payload, null, 2)}\n`;
  return { ...row, content };
}

async function replaceStoredState(text, sourceName, requestedRevision = null) {
  const normalized = normalizePayload(text);
  const revision = revisionOf(normalized.content);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentResult = await client.query(
      "SELECT payload, revision, source_name FROM mitsumori_state WHERE singleton_id = 1 FOR UPDATE"
    );
    const current = currentResult.rows[0] || null;
    if (requestedRevision !== null && current && requestedRevision !== current.revision) {
      await client.query("ROLLBACK");
      return { conflict: true, revision: current.revision };
    }
    if (current && current.revision !== revision) {
      await client.query(
        `INSERT INTO mitsumori_state_history(payload, revision, source_name)
         VALUES ($1::jsonb, $2, $3)`,
        [JSON.stringify(current.payload), current.revision, current.source_name]
      );
    }
    await client.query(
      `INSERT INTO mitsumori_state(singleton_id, payload, revision, source_name, updated_at)
       VALUES (1, $1::jsonb, $2, $3, now())
       ON CONFLICT (singleton_id) DO UPDATE SET
         payload = excluded.payload,
         revision = excluded.revision,
         source_name = excluded.source_name,
         updated_at = now()`,
      [JSON.stringify(normalized.payload), revision, sourceName]
    );
    await client.query("COMMIT");
    return { ...normalized, revision, conflict: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function importInitialData() {
  if (!initialDataPath || !fs.existsSync(initialDataPath) || await readStoredState()) return;
  const content = await fs.promises.readFile(initialDataPath, "utf8");
  const result = await replaceStoredState(content, "handoff-initial-data");
  console.log(`Imported ${result.estimateCount} estimates from ${initialDataPath}`);
}

function safePrintFileName(value) {
  let decoded = String(value || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep the original value when it is not URI encoded.
  }
  const name = path.basename(decoded, path.extname(decoded))
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .trim()
    .slice(0, 80);
  return name || "estimate";
}

async function handleLatestData(response) {
  const stored = await readStoredState();
  if (!stored) {
    send(response, 404, "latest data not found");
    return;
  }
  send(response, 200, stored.content, "application/json; charset=utf-8", {
    "X-Mitsumori-Data-Revision": stored.revision,
    "X-Mitsumori-Data-Source-Count": "1",
    "X-Mitsumori-Data-Source": "PostgreSQL",
    "X-Mitsumori-Storage": "PostgreSQL"
  });
}

async function handleSave(request, response) {
  const content = await readBody(request);
  const requestedRevision = String(request.headers["x-mitsumori-data-revision"] || "");
  const result = await replaceStoredState(content, "estimate-app", requestedRevision);
  if (result.conflict) {
    send(response, 409, JSON.stringify({
      ok: false,
      code: "dropbox_data_conflict",
      message: "他のPCで更新された見積りデータがあります。保存済みデータを読み込んで確認してください。",
      revision: result.revision
    }), "application/json; charset=utf-8", {
      "X-Mitsumori-Data-Revision": result.revision
    });
    return;
  }
  send(response, 200, JSON.stringify({
    ok: true,
    fileName: "PostgreSQL",
    savedAt: new Date().toISOString(),
    revision: result.revision
  }), "application/json; charset=utf-8", {
    "X-Mitsumori-Data-Revision": result.revision,
    "X-Mitsumori-Storage": "PostgreSQL"
  });
}

async function handleImport(request, response) {
  const result = await replaceStoredState(await readBody(request), "handoff-import");
  send(response, 201, JSON.stringify({
    ok: true,
    estimateCount: result.estimateCount,
    activeId: result.activeId,
    revision: result.revision
  }), "application/json; charset=utf-8");
}

async function handleOpenPrintPdf(request, response) {
  const content = await readBinaryBody(request);
  if (content.length < 5 || content.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("invalid PDF data");
  }
  await fs.promises.mkdir(printDirectory, { recursive: true });
  const requestedName = safePrintFileName(request.headers["x-mitsumori-print-name"]);
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const fileName = `${requestedName}-${timestamp}.pdf`;
  await fs.promises.writeFile(path.join(printDirectory, fileName), content);
  send(response, 200, JSON.stringify({
    ok: true,
    fileName,
    url: `/api/prints/${encodeURIComponent(fileName)}`
  }), "application/json; charset=utf-8");
}

async function servePrintFile(request, response, encodedName) {
  const fileName = path.basename(decodeURIComponent(encodedName));
  const filePath = path.resolve(printDirectory, fileName);
  if (!isInside(printDirectory, filePath)) {
    send(response, 403, "forbidden");
    return;
  }
  const stat = await fs.promises.stat(filePath);
  response.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Length": stat.size,
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "Cache-Control": "private, no-store"
  });
  fs.createReadStream(filePath).pipe(response);
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  const relativePath = decodeURIComponent(url.pathname) === "/"
    ? "index.html"
    : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const filePath = path.resolve(appDirectory, relativePath);
  if (!isInside(appDirectory, filePath)) {
    send(response, 403, "forbidden");
    return;
  }
  const stat = await fs.promises.stat(filePath);
  if (!stat.isFile()) {
    send(response, 404, "not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=60"
  });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  (async () => {
    const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
    if (request.method === "GET" && url.pathname === "/api/health") {
      await pool.query("SELECT 1");
      const stored = await readStoredState();
      send(response, 200, JSON.stringify({
        ok: true,
        storage: "PostgreSQL",
        dataReady: Boolean(stored),
        updatedAt: stored?.updated_at || null
      }), "application/json; charset=utf-8");
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/latest-data") {
      await handleLatestData(response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/save-data") {
      await handleSave(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/import") {
      await handleImport(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/export") {
      const stored = await readStoredState();
      if (!stored) {
        send(response, 404, "data not found");
        return;
      }
      send(response, 200, stored.content, "application/json; charset=utf-8", {
        "Content-Disposition": `attachment; filename="mitsumori-postgres-${new Date().toISOString().slice(0, 10)}.json"`
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/open-print-pdf") {
      await handleOpenPrintPdf(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/prints/")) {
      await servePrintFile(request, response, url.pathname.slice("/api/prints/".length));
      return;
    }
    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
      return;
    }
    send(response, 405, "method not allowed");
  })().catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      send(response, 500, `server error: ${error.message}`);
    } else {
      response.destroy(error);
    }
  });
});

await ensureSchema();
await importInitialData();
server.listen(port, "0.0.0.0", () => {
  console.log(`Mitsumori PostgreSQL app: http://127.0.0.1:${port}/`);
});
