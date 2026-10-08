import { readFileSync, existsSync } from "fs";
import zlib from "zlib";

const candidates = process.argv.slice(2);
let file = null;
for (const c of candidates) {
  if (existsSync(c)) { file = c; break; }
}
if (!file) {
  console.log("NO FILE FOUND among:", candidates.join(", "));
  process.exit(1);
}

const buf = readFileSync(file);
console.log("FILE:", file, "BYTES:", buf.length);
console.log("HEADER:", buf.subarray(0, 8).toString("latin1"));
console.log("TAIL:", JSON.stringify(buf.subarray(-20).toString("latin1")));

// find all stream...endstream blocks
const raw = buf.toString("latin1");
let idx = 0;
let total = 0, ok = 0, fail = 0;
const failures = [];
while (true) {
  const s = raw.indexOf("stream", idx);
  if (s === -1) break;
  // skip the E of endstream
  const isEnd = raw.slice(Math.max(0, s - 3), s) === "end";
  if (isEnd) {
    idx = s + 6;
    continue;
  }
  let start = s + 6;
  if (raw[start] === "\r") start++;
  if (raw[start] === "\n") start++;
  const e = raw.indexOf("endstream", start);
  if (e === -1) break;
  let end = e;
  while (end > start && (raw[end - 1] === "\n" || raw[end - 1] === "\r")) end--;
  const bytes = buf.subarray(start, end);
  total++;
  try {
    const out = zlib.inflateSync(bytes);
    ok++;
    console.log(`  stream #${total} len=${bytes.length} -> inflate OK (${out.length} bytes)`);
  } catch (err) {
    try {
      const out2 = zlib.inflateRawSync(bytes);
      ok++;
      console.log(`  stream #${total} len=${bytes.length} -> inflateRaw OK (${out2.length} bytes)`);
    } catch (err2) {
      fail++;
      failures.push(`#${total}: ${err.message} | raw: ${err2.message}`);
      console.log(`  stream #${total} len=${bytes.length} -> FAIL ${err.message}`);
    }
  }
  idx = e + 9;
}

console.log("---");
console.log(`streams: total=${total} ok=${ok} fail=${fail}`);
if (failures.length) console.log("FAILURES:\n" + failures.join("\n"));

// check for text operators in inflated content
if (ok > 0) {
  let textOps = 0;
  idx = 0;
  while (true) {
    const s = raw.indexOf("stream", idx);
    if (s === -1) break;
    if (raw.slice(Math.max(0, s - 3), s) === "end") { idx = s + 6; continue; }
    let start = s + 6;
    if (raw[start] === "\r") start++;
    if (raw[start] === "\n") start++;
    const e = raw.indexOf("endstream", start);
    if (e === -1) break;
    let end = e;
    while (end > start && (raw[end - 1] === "\n" || raw[end - 1] === "\r")) end--;
    try {
      const out = zlib.inflateSync(buf.subarray(start, end)).toString("latin1");
      const m = out.match(/(BT|Tj|TJ|Tf)\b/g);
      if (m) textOps += m.length;
    } catch {}
    idx = e + 9;
  }
  console.log("text-ish operators found in content streams:", textOps);
}
