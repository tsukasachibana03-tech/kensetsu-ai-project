const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const root = __dirname;
const projectRoot = path.resolve(root, "..", "..");
const dropboxRoot = path.resolve(projectRoot, "..");
const dropboxAccountRoot = path.dirname(dropboxRoot);
const dropboxDataPath = path.join(dropboxRoot, "mitsumori_data.json");
const port = Number(process.argv[2] || process.env.PORT || 8766);
const gitExecutable = process.env.GIT_EXE || "git";
const gitSyncBranch = process.env.GITHUB_SYNC_BRANCH || "main";
const gitSyncIntervalMs = Math.max(5000, Number(process.env.GITHUB_SYNC_INTERVAL_MS || 15000));
const gitSyncQuietMs = Math.max(gitSyncIntervalMs, Number(process.env.GITHUB_SYNC_QUIET_MS || 45000));
let gitSyncPromise = null;
let gitSyncCheckActive = false;
let lastGitSyncFingerprint = null;
let lastGitSyncChangeAt = Date.now();
let lastGitSyncedFingerprint = null;
const gitSyncPathspecs = [
  "apps/mitsumori_app",
  "index.html",
  "README.md",
  ":(exclude)apps/mitsumori_app/mitsumori_data.json",
  ":(exclude)data/mitsumori_data.json",
  ":(exclude)mitsumori_data.json"
];

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

function validatePayload(text) {
  if (!text || !text.trim()) throw new Error("empty data");
  const payload = JSON.parse(text);
  const book = payload.book || payload;
  if (!Array.isArray(book.estimates) || book.estimates.length === 0) {
    throw new Error("estimate data not found");
  }
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 25 * 1024 * 1024) throw new Error("data too large");
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

function safePrintFileName(value) {
  let decoded = String(value || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch (error) {
    // Keep the original header value when it is not URI encoded.
  }
  const name = path.basename(decoded, path.extname(decoded))
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .trim()
    .slice(0, 80);
  return name || "estimate";
}

function openSystemFile(filePath) {
  const command = process.platform === "win32" ? "explorer.exe" : (process.platform === "darwin" ? "open" : "xdg-open");
  return new Promise((resolve, reject) => {
    const child = spawn(command, [filePath], {
      detached: true,
      stdio: "ignore",
      windowsHide: false
    });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

async function writeAtomic(filePath, content) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const current = await fs.promises.readFile(filePath, "utf8");
    validatePayload(current);
    await fs.promises.writeFile(`${filePath}.last-good`, current, "utf8");
  } catch (error) {
    // No valid previous data to back up.
  }
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.promises.writeFile(tempPath, content, "utf8");
  validatePayload(await fs.promises.readFile(tempPath, "utf8"));
  try {
    await fs.promises.rename(tempPath, filePath);
  } catch (error) {
    if (error.code !== "EACCES" && error.code !== "EPERM") throw error;
    await fs.promises.copyFile(tempPath, filePath);
    await fs.promises.unlink(tempPath).catch(() => {});
  }
}

async function runGit(args) {
  const result = await execFileAsync(gitExecutable, ["-c", `safe.directory=${projectRoot}`, ...args], {
    cwd: projectRoot,
    windowsHide: true,
    timeout: 60000,
    maxBuffer: 1024 * 1024
  });
  return `${result.stdout || ""}${result.stderr || ""}`.trim();
}

async function syncAppToGitHub() {
  if (process.env.DISABLE_GITHUB_SYNC === "1") {
    return { ok: true, skipped: true, reason: "disabled" };
  }

  const branch = (await runGit(["branch", "--show-current"])).trim();
  if (branch && branch !== gitSyncBranch) {
    return {
      ok: true,
      skipped: true,
      reason: `current branch is ${branch}; set GITHUB_SYNC_BRANCH=${branch} to push it`
    };
  }

  const status = await runGit(["status", "--porcelain", "--", ...gitSyncPathspecs]);
  if (!status) {
    return { ok: true, skipped: true, reason: "no app changes" };
  }

  await runGit(["add", "--", ...gitSyncPathspecs]);
  await runGit(["commit", "-m", "Save latest estimate app"]);
  await runGit(["push", "origin", `HEAD:${gitSyncBranch}`]);
  return { ok: true, skipped: false, branch: gitSyncBranch };
}

function dataRevision(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function timestampValue(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function estimateIdentity(record) {
  const projectName = String(record?.state?.projectName || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  const clientName = String(record?.state?.clientName || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase();
  if (projectName) return `project:${projectName}|client:${clientName}`;
  return `id:${record?.id || ""}`;
}

async function discoverDropboxDataPaths() {
  const candidates = new Set([dropboxDataPath]);
  try {
    const files = await fs.promises.readdir(dropboxRoot, { withFileTypes: true });
    files.forEach((entry) => {
      if (entry.isFile() && /^mitsumori_data.*\.json$/i.test(entry.name)) {
        candidates.add(path.join(dropboxRoot, entry.name));
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    const siblings = await fs.promises.readdir(dropboxAccountRoot, { withFileTypes: true });
    siblings.forEach((entry) => {
      if (entry.isDirectory() && /^OPENAI(?:$|[-_ ].+)/i.test(entry.name)) {
        candidates.add(path.join(dropboxAccountRoot, entry.name, "mitsumori_data.json"));
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return Array.from(candidates);
}

async function readDropboxDataSources() {
  const sources = [];
  for (const filePath of await discoverDropboxDataPaths()) {
    try {
      const [content, stat] = await Promise.all([
        fs.promises.readFile(filePath, "utf8"),
        fs.promises.stat(filePath)
      ]);
      validatePayload(content);
      const payload = JSON.parse(content);
      const book = payload.book || payload;
      const recordTimestamp = book.estimates.reduce((latest, record) => (
        Math.max(latest, timestampValue(record.updatedAt), timestampValue(record.createdAt))
      ), 0);
      sources.push({
        filePath,
        payload,
        book,
        freshness: Math.max(stat.mtimeMs, timestampValue(payload.savedAt), recordTimestamp)
      });
    } catch (error) {
      if (error.code !== "ENOENT") console.error(`Ignored invalid Dropbox data source ${filePath}: ${error.message}`);
    }
  }
  return sources;
}

function mergeDropboxDataSources(sources) {
  if (!sources.length) throw new Error("estimate data not found");
  const ordered = [...sources].sort((left, right) => left.freshness - right.freshness);
  const records = new Map();
  ordered.forEach((source) => {
    source.book.estimates.forEach((record) => {
      const key = estimateIdentity(record);
      const freshness = Math.max(timestampValue(record.updatedAt), timestampValue(record.createdAt));
      const current = records.get(key);
      if (!current || freshness > current.freshness || (freshness === current.freshness && source.freshness >= current.sourceFreshness)) {
        records.set(key, { record: JSON.parse(JSON.stringify(record)), freshness, sourceFreshness: source.freshness });
      }
    });
  });

  const latestSource = ordered[ordered.length - 1];
  const latestActiveRecord = latestSource.book.estimates.find((record) => record.id === latestSource.book.activeId);
  const activeKey = latestActiveRecord ? estimateIdentity(latestActiveRecord) : "";
  const estimates = Array.from(records.values()).map((entry) => entry.record);
  const activeRecord = records.get(activeKey)?.record || estimates[0];
  const payload = JSON.parse(JSON.stringify(latestSource.payload));
  payload.book = {
    activeId: activeRecord?.id || "",
    estimates
  };
  return {
    content: `${JSON.stringify(payload, null, 2)}\n`,
    sourcePaths: ordered.map((source) => source.filePath),
    latestSourcePath: latestSource.filePath
  };
}

async function latestDropboxData() {
  const merged = mergeDropboxDataSources(await readDropboxDataSources());
  return {
    ...merged,
    revision: dataRevision(merged.content)
  };
}

function queueAppGitHubSync() {
  if (!gitSyncPromise) {
    gitSyncPromise = syncAppToGitHub().finally(() => {
      gitSyncPromise = null;
    });
  }
  return gitSyncPromise;
}

async function appendFileFingerprints(directory, entries) {
  const children = await fs.promises.readdir(directory, { withFileTypes: true });
  for (const child of children) {
    const filePath = path.join(directory, child.name);
    if (child.isDirectory()) {
      await appendFileFingerprints(filePath, entries);
      continue;
    }
    if (!child.isFile() || /^mitsumori_data\.json(?:\.|$)/i.test(child.name)) continue;
    const stat = await fs.promises.stat(filePath);
    entries.push(`${path.relative(projectRoot, filePath)}:${stat.size}:${Math.floor(stat.mtimeMs)}`);
  }
}

async function appFileFingerprint() {
  const entries = [];
  await appendFileFingerprints(root, entries);
  for (const fileName of ["index.html", "README.md"]) {
    const filePath = path.join(projectRoot, fileName);
    try {
      const stat = await fs.promises.stat(filePath);
      entries.push(`${fileName}:${stat.size}:${Math.floor(stat.mtimeMs)}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return entries.sort().join("|");
}

async function checkGitHubAutoSync() {
  if (gitSyncCheckActive) return;
  gitSyncCheckActive = true;
  try {
    const fingerprint = await appFileFingerprint();
    if (fingerprint !== lastGitSyncFingerprint) {
      lastGitSyncFingerprint = fingerprint;
      lastGitSyncChangeAt = Date.now();
      return;
    }
    if (fingerprint === lastGitSyncedFingerprint || Date.now() - lastGitSyncChangeAt < gitSyncQuietMs) return;
    const result = await queueAppGitHubSync();
    lastGitSyncedFingerprint = fingerprint;
    if (!result.skipped) console.log(`GitHub app sync completed: ${result.branch}`);
  } catch (error) {
    console.error(`GitHub app sync failed: ${error.message}`);
  } finally {
    gitSyncCheckActive = false;
  }
}

function startGitHubAutoSync() {
  if (process.env.DISABLE_GITHUB_SYNC === "1") return;
  const timer = setInterval(checkGitHubAutoSync, gitSyncIntervalMs);
  timer.unref();
}

function send(response, status, body, contentType = "text/plain; charset=utf-8", headers = {}) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(body);
}

async function handleSave(request, response) {
  try {
    const content = await readBody(request);
    validatePayload(content);
    const requestedRevision = String(request.headers["x-mitsumori-data-revision"] || "");
    let currentRevision = "";
    try {
      currentRevision = (await latestDropboxData()).revision;
    } catch (error) {
      if (error.code !== "ENOENT" && error.message !== "estimate data not found") throw error;
    }
    if (currentRevision && requestedRevision !== currentRevision) {
      send(response, 409, JSON.stringify({
        ok: false,
        code: "dropbox_data_conflict",
        message: "他のPCで更新されたDropboxデータがあります。保存済みデータを読み込んで内容を確認してください。",
        revision: currentRevision
      }), "application/json; charset=utf-8", {
        "X-Mitsumori-Data-Revision": currentRevision
      });
      return;
    }
    const targets = [dropboxDataPath];
    for (const target of targets) {
      if (!isInside(dropboxRoot, target)) throw new Error(`invalid target: ${target}`);
      await writeAtomic(target, content);
    }

    const githubSync = {
      ok: true,
      skipped: true,
      reason: "app changes are synced after the edit quiet period"
    };

    const revision = (await latestDropboxData()).revision;
    send(response, 200, JSON.stringify({
      ok: true,
      fileName: "mitsumori_data.json",
      savedAt: new Date().toISOString(),
      targets,
      revision,
      githubSync
    }), "application/json; charset=utf-8", {
      "X-Mitsumori-Data-Revision": revision
    });
  } catch (error) {
    send(response, 500, `save failed: ${error.message}`);
  }
}

async function handleLatestData(response) {
  try {
    const latest = await latestDropboxData();
    send(response, 200, latest.content, "application/json; charset=utf-8", {
      "X-Mitsumori-Data-Revision": latest.revision,
      "X-Mitsumori-Data-Source-Count": String(latest.sourcePaths.length),
      "X-Mitsumori-Data-Source": encodeURIComponent(path.relative(dropboxAccountRoot, latest.latestSourcePath))
    });
  } catch (error) {
    send(response, 404, `latest data not found: ${error.message}`);
  }
}

async function handleOpenPrintPdf(request, response) {
  try {
    const content = await readBinaryBody(request);
    if (content.length < 5 || content.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new Error("invalid PDF data");
    }
    const printDirectory = path.join(dropboxRoot, "mitsumori_prints");
    if (!isInside(dropboxRoot, printDirectory)) throw new Error("invalid print directory");
    await fs.promises.mkdir(printDirectory, { recursive: true });
    const requestedName = safePrintFileName(request.headers["x-mitsumori-print-name"]);
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
    const filePath = path.join(printDirectory, `${requestedName}-${timestamp}.pdf`);
    await fs.promises.writeFile(filePath, content);
    await openSystemFile(filePath);
    send(response, 200, JSON.stringify({
      ok: true,
      fileName: path.basename(filePath),
      filePath
    }), "application/json; charset=utf-8");
  } catch (error) {
    send(response, 500, `open print PDF failed: ${error.message}`);
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  if (!isInside(root, filePath)) {
    send(response, 403, "forbidden");
    return;
  }
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      send(response, 404, "not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=60"
    });
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    send(response, 404, "not found");
  }
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    send(response, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
    return;
  }
  if (request.method === "GET" && request.url === "/api/latest-data") {
    handleLatestData(response);
    return;
  }
  if (request.method === "POST" && request.url === "/api/save-data") {
    handleSave(request, response);
    return;
  }
  if (request.method === "POST" && request.url === "/api/open-print-pdf") {
    handleOpenPrintPdf(request, response);
    return;
  }
  if (request.method === "GET" || request.method === "HEAD") {
    serveStatic(request, response);
    return;
  }
  send(response, 405, "method not allowed");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mitsumori save server: http://127.0.0.1:${port}/`);
  startGitHubAutoSync();
});
