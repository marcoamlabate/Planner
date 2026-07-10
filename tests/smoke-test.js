const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

childProcess.execFileSync(process.execPath, ["--check", path.join(root, "app.js")], { stdio: "inherit" });

function expectText(text, marker, message) {
  assert.ok(text.includes(marker), message);
}

expectText(app, 'const APP_VERSION = "v70.1"', "v70.1 app version is missing");
expectText(serviceWorker, "adhd-planner-v70-1-reliability", "v70.1 cache name is missing");
expectText(app, "getStorageSafety", "storage-safety guard is missing");
expectText(app, "Restore preview", "backup restore preview is missing");
expectText(app, "Restore Backup", "backup confirmation action is missing");
expectText(app, "New Planner version available", "PWA update notice is missing");
expectText(index, "planner-update-available", "PWA update event wiring is missing");
expectText(app, "adhd3_tasks", "task storage key contract changed unexpectedly");
expectText(app, "adhd3_notes", "note storage key contract changed unexpectedly");
expectText(app, "adhd3_meds", "medication storage key contract changed unexpectedly");

console.log("Planner v70.1 smoke checks passed.");

