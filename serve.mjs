// Minimal static server for this bundle: node serve.mjs [port] (zero dependency, ESM).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const MIME = {
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", ico: "image/x-icon",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  mp4: "video/mp4", webm: "video/webm", wasm: "application/wasm"
};
function mimeFor(f) {
  const e = (String(f).split(".").pop() || "").toLowerCase();
  return MIME[e] || "application/octet-stream";
}
function openBrowser(url) {
  if (process.env.NO_OPEN) return;
  let cmd = null;
  if (process.platform === "win32") cmd = "start " + url;
  else if (process.platform === "darwin") cmd = "open " + url;
  else cmd = "xdg-open " + url;
  exec(cmd, function () {});
}
function deny(res) {
  res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end("forbidden");
}
function missing(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end("not found");
}
function onReq(req, res) {
  const raw = String(req.url || "/").split("?")[0].split("#")[0];
  if (/%2e%2e|%5c/i.test(raw)) { deny(res); return; }
  let p = null;
  try { p = decodeURIComponent(raw); } catch (e) { deny(res); return; }
  if (p.indexOf("\0") !== -1) { deny(res); return; }
  if (p.charAt(p.length - 1) === "/") p += "index.html";
  const f = path.normalize(path.join(root, p.replace(/^[\\/]+/, "")));
  if (f !== root && f.indexOf(root + path.sep) !== 0) { deny(res); return; }
  fs.stat(f, function (err, st) {
    let file = f;
    if (!err && st && st.isDirectory()) file = path.join(f, "index.html");
    fs.readFile(file, function (err2, b) {
      if (err2) { missing(res); return; }
      res.writeHead(200, { "Content-Type": mimeFor(file), "Content-Length": b.length, "Cache-Control": "no-store" });
      if (req.method === "HEAD") res.end();
      else res.end(b);
    });
  });
}
function boot(port, left) {
  const server = http.createServer(onReq);
  server.on("error", function (e) {
    if (e && e.code === "EADDRINUSE" && left > 0) {
      console.log("port " + port + " busy, trying " + (port + 1) + "...");
      boot(port + 1, left - 1);
    } else { console.error("server error: " + ((e && e.message) || e)); process.exit(1); }
  });
  server.listen(port, "127.0.0.1", function () {
    console.log("Serving at http://127.0.0.1:" + port + "/");
    openBrowser("http://127.0.0.1:" + port + "/");
  });
}
let base = parseInt(process.argv[2] || process.env.PORT || "8000", 10);
if (!base || base < 1 || base > 65535) base = 8000;
boot(base, 20);
