#!/usr/bin/env node
/**
 * Generates messages/{locale}.json from messages/en.json via Lingva.
 * Keeps support.comm + privacyPolicy in English (legal accuracy); rest is translated.
 *
 * Usage: node scripts/generate-locale-messages.mjs [ru|pl|ro|it|uk|ku|all]
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const enPath = path.join(root, "messages/en.json");

const TARGETS = [
  ["ru", "ru"],
  ["pl", "pl"],
  ["ro", "ro"],
  ["it", "it"],
  ["uk", "uk"],
  ["ku", "ku"],
];

const DELAY_MS = 45;
const MAX_CHUNK = 1400;

/** Subtrees copied verbatim from English (no MT). */
const SKIP_TOP_LEVEL = new Set(["privacyPolicy"]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function shieldIcu(s) {
  const names = [];
  const out = s.replace(/\{([a-zA-Z_]+)\}/g, (_, name) => {
    names.push(name);
    return `\u2060<<${names.length - 1}>>\u2060`;
  });
  return { out, names };
}

function unshield(s, names) {
  return s.replace(/\u2060<<(\d+)>>\u2060/g, (_, i) => `{${names[Number(i)]}}`);
}

function chunkText(s) {
  if (s.length <= MAX_CHUNK) return [s];
  const parts = [];
  let rest = s;
  while (rest.length > MAX_CHUNK) {
    let cut = rest.lastIndexOf(" ", MAX_CHUNK);
    if (cut < MAX_CHUNK / 2) cut = MAX_CHUNK;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

function fetchLingvaChunk(to, chunk) {
  const enc = encodeURIComponent(chunk);
  const url = `https://lingva.ml/api/v1/en/${to}/${enc}`;
  const opts = {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TransPool24-i18n/1.0; +https://transpool24.com)",
      Accept: "application/json",
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.get(url, opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          const j = JSON.parse(d);
          resolve(String(j.translation ?? chunk));
        } catch {
          resolve(chunk);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(45_000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function lingva(to, text) {
  const { out, names } = shieldIcu(text);
  const chunks = chunkText(out);
  const parts = [];
  for (const chunk of chunks) {
    let lastErr;
    let t = chunk;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        t = await fetchLingvaChunk(to, chunk);
        break;
      } catch (e) {
        lastErr = e;
        await sleep(350 * (attempt + 1));
      }
    }
    if (t === chunk && lastErr) t = chunk;
    parts.push(t);
    await sleep(DELAY_MS);
  }
  return unshield(parts.join(""), names);
}

async function translateString(cache, to, text) {
  if (!text.trim()) return text;
  const key = `${to}::${text}`;
  if (cache.has(key)) return cache.get(key);
  let out;
  try {
    out = await lingva(to, text);
  } catch {
    out = text;
  }
  cache.set(key, out);
  return out;
}

async function mapTree(node, cache, to, topKey) {
  if (SKIP_TOP_LEVEL.has(topKey)) {
    return node;
  }
  if (typeof node === "string") {
    return translateString(cache, to, node);
  }
  if (Array.isArray(node)) {
    const arr = [];
    for (const item of node) {
      arr.push(await mapTree(item, cache, to, topKey));
    }
    return arr;
  }
  if (node && typeof node === "object") {
    const o = {};
    for (const k of Object.keys(node)) {
      const childTop = topKey === "" ? k : topKey;
      o[k] = await mapTree(node[k], cache, to, SKIP_TOP_LEVEL.has(k) ? k : childTop);
    }
    return o;
  }
  return node;
}

async function buildOne(fileLocale, lingvaCode, en) {
  const cache = new Map();
  process.stdout.write(`[${fileLocale}] translating…\n`);
  const out = await mapTree(en, cache, lingvaCode, "");
  const dest = path.join(root, `messages/${fileLocale}.json`);
  fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
  process.stdout.write(`[${fileLocale}] wrote ${dest} (${cache.size} API strings)\n`);
}

async function main() {
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const arg = (process.argv[2] || "all").toLowerCase();
  if (arg === "all") {
    for (const [loc, code] of TARGETS) {
      try {
        await buildOne(loc, code, en);
      } catch (e) {
        console.error(`[${loc}]`, e);
        process.exitCode = 1;
      }
    }
    return;
  }
  const row = TARGETS.find(([loc]) => loc === arg);
  if (!row) {
    console.error("Unknown locale:", arg);
    process.exit(1);
  }
  await buildOne(row[0], row[1], en);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
