#!/usr/bin/env node
/**
 * GRANDEFLIX Cloudflare R2 setup helper.
 *
 * After completing the browser steps (see README), add R2_* vars to .env, then:
 *   npm run r2:setup
 *
 * This script:
 *  - Validates .env R2 credentials
 *  - Optionally creates the bucket via Cloudflare API (CLOUDFLARE_API_TOKEN)
 *  - Pushes R2 env vars to Vercel Production
 *  - Applies CORS via wrangler (if logged in)
 *  - Redeploys production
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "grandeflix-media";
const R2_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];

function loadEnv() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !m[2].startsWith("your-")) vars[m[1]] = m[2].trim();
  }
  return vars;
}

function run(cmd, opts = {}) {
  console.log(`\n→ ${cmd}`);
  return spawnSync(cmd, { shell: true, cwd: ROOT, stdio: "inherit", ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function missingR2Vars(env) {
  return R2_VARS.filter((k) => !env[k]?.trim());
}

async function createBucketViaApi(accountId, apiToken) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: BUCKET }),
  });
  const body = await res.json();
  if (res.ok) {
    console.log(`✓ Bucket "${BUCKET}" created.`);
    return true;
  }
  if (body.errors?.some((e) => /already exists/i.test(e.message))) {
    console.log(`✓ Bucket "${BUCKET}" already exists.`);
    return true;
  }
  console.error("✗ Bucket creation failed:", JSON.stringify(body, null, 2));
  return false;
}

function pushVercelEnv(name, value) {
  try {
    runCapture(
      `printf '%s' ${JSON.stringify(value)} | vercel env add ${name} production --force 2>&1`,
    );
    console.log(`✓ Vercel env ${name} set (production).`);
  } catch (err) {
    console.error(`✗ Failed to set Vercel env ${name}:`, err.message?.slice(0, 200));
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  GRANDEFLIX — Cloudflare R2 setup                            ║
╚══════════════════════════════════════════════════════════════╝
`);

const env = loadEnv();
const missing = missingR2Vars(env);

if (missing.length > 0) {
  console.log(`
R2 env vars missing in .env: ${missing.join(", ")}

Complete these browser steps first (Brave should be open):

1. R2 Overview → Create bucket
   • Name: ${BUCKET}
   • Location: Automatic
   • Click Create bucket

2. Open bucket "${BUCKET}" → Settings → Public access
   • Enable "Allow Access" / r2.dev subdomain
   • Copy the public URL (e.g. https://pub-xxxx.r2.dev) → R2_PUBLIC_URL

3. R2 → Manage R2 API Tokens → Create API token
   • Permission: Object Read & Write
   • Scope: Apply to specific bucket → ${BUCKET}
   • Create → copy Access Key ID + Secret Access Key (shown once)

4. Account ID (right sidebar on any Cloudflare page) → R2_ACCOUNT_ID

5. Add to .env:
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=${BUCKET}
   R2_PUBLIC_URL=https://pub-xxxx.r2.dev

6. Bucket → Settings → CORS → paste scripts/r2-cors.json

Then run: npm run r2:setup
`);
  process.exit(1);
}

console.log("✓ All R2_* vars found in .env");

const apiToken = env.CLOUDFLARE_API_TOKEN?.trim();
if (apiToken && env.R2_ACCOUNT_ID) {
  console.log("\nAttempting bucket creation via Cloudflare API…");
  await createBucketViaApi(env.R2_ACCOUNT_ID, apiToken);
} else {
  console.log("\n(Skip API bucket create — set CLOUDFLARE_API_TOKEN in .env to auto-create)");
}

console.log("\nPushing R2 env vars to Vercel Production…");
for (const name of R2_VARS) {
  pushVercelEnv(name, env[name]);
}

console.log("\nApplying CORS (requires wrangler login)…");
const corsResult = run(`npx wrangler r2 bucket cors put ${env.R2_BUCKET_NAME || BUCKET} --file scripts/r2-cors.json`);
if (corsResult.status !== 0) {
  console.log("⚠ CORS not applied via CLI — paste scripts/r2-cors.json in bucket Settings → CORS.");
}

console.log("\nDeploying to Vercel production…");
const deploy = run("vercel --prod --yes");
if (deploy.status !== 0) {
  console.error("✗ Deploy failed.");
  process.exit(1);
}

console.log(`
✓ Done! Test at https://grandeflix.com/admin → Upload to Cloudflare R2
`);
