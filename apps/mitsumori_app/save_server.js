const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const root = __dirname;
const projectRoot = path.resolve(root, "..", "..");
const dropboxRoot = path.resolve(projectRoot, "..");
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

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

async function handleSave(request, response) {
  try {
    const content = await readBody(request);
    validatePayload(content);
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

    send(response, 200, JSON.stringify({
      ok: true,
      fileName: "mitsumori_data.json",
      savedAt: new Date().toISOString(),
      targets,
      githubSync
    }), "application/json; charset=utf-8");
  } catch (error) {
    send(response, 500, `save failed: ${error.message}`);
  }
}

async function handleLatestData(response) {
  try {
    const content = await fs.promises.readFile(dropboxDataPath, "utf8");
    validatePayload(content);
    send(response, 200, content, "application/json; charset=utf-8");
  } catch (error) {
    send(response, 404, `latest data not found: ${error.message}`);
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
