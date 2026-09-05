#!/usr/bin/env node
/**
 * build.js — converts data.json → data.js (global window.DATA)
 * Usage: node build.js
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "data.json");
const dst = path.join(__dirname, "data.js");

if (!fs.existsSync(src)) {
  console.error("✗ data.json not found");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(src, "utf8"));
const js = "window.DATA =\n" + JSON.stringify(data, null, 2) + "\n";

fs.writeFileSync(dst, js, "utf8");
console.log("✓ data.json → data.js (" + (js.length / 1024).toFixed(1) + " KB)");
