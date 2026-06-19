#!/usr/bin/env node
/**
 * Finish GRANDEFLIX R2 setup via Cloudflare API:
 *  - Enable r2.dev public URL
 *  - Apply CORS
 *  - Update R2_PUBLIC_URL on Vercel Production
 *  - Redeploy
 *
 * Requires CLOUDFLARE_API_TOKEN with R2 read/write (Account → R2 → Edit).
 * Falls back to WRANGLER_OAUTH_TOKEN env if set.
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_BUCKET = "grandeflix";

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  return vars;
}

function getCloudflareToken() {
  if (process.env.CLOUDFLARE_API_TOKEN?.trim()) return process.env.CLOUDFLARE_API_TOKEN.trim();
  const local = loadEnvFile(join(ROOT, ".env"));
  if (local.CLOUDFLARE_API_TOKEN?.trim()) return local.CLOUDFLARE_API_TOKEN.trim();
  return null;
}

async function cfApi(method, path, body, token) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg);
  }
  return json.result;
}

function loadProductionR2Env() {
  const pulled = join(ROOT, ".env.r2-finish");
  runCapture(`vercel env pull ${pulled} --environment=production --yes 2>/dev/null || true`);
  const fromFile = loadEnvFile(pulled);
  const accountId = process.env.R2_ACCOUNT_ID || fromFile.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME || fromFile.R2_BUCKET_NAME || DEFAULT_BUCKET;
  return { accountId, bucketName, pulledPath: pulled };
}

function pushVercelEnv(name, value) {
  execSync(`printf '%s' ${JSON.stringify(value)} | vercel env add ${name} production --force`, {
    cwd: ROOT,
    stdio: "inherit",
  });
}

async function main() {
  const token = getCloudflareToken();
  if (!token) {
    console.error(`
Missing CLOUDFLARE_API_TOKEN.

Create one at: https://dash.cloudflare.com/profile/api-tokens
  • Template: "Edit Cloudflare Workers" OR custom with Account → R2 → Edit
  • Add to .env: CLOUDFLARE_API_TOKEN=...

Then run: npm run r2:finish
`);
    process.exit(1);
  }

  const { accountId, bucketName, pulledPath } = loadProductionR2Env();
  if (!accountId) {
    console.error("Missing R2_ACCOUNT_ID on Vercel Production.");
    process.exit(1);
  }

  console.log(`Account: ${accountId}`);
  console.log(`Bucket:  ${bucketName}`);

  const base = `/accounts/${accountId}/r2/buckets/${bucketName}`;

  let managed = await cfApi("GET", `${base}/domains/managed`, null, token);
  console.log(`r2.dev domain: ${managed.domain || "(none)"} enabled=${managed.enabled}`);

  if (!managed.enabled) {
    console.log("Enabling r2.dev public access…");
    managed = await cfApi("PUT", `${base}/domains/managed`, { enabled: true }, token);
    console.log(`✓ Enabled: https://${managed.domain}`);
  }

  const publicUrl = `https://${managed.domain}`;
  console.log(`Public URL: ${publicUrl}`);

  const corsRules = JSON.parse(readFileSync(join(ROOT, "scripts/r2-cors.json"), "utf8"));
  const apiCors = {
    rules: corsRules.map((rule, i) => ({
      id: `grandeflix-${i}`,
      allowed: {
        origins: rule.AllowedOrigins,
        methods: rule.AllowedMethods,
        headers: rule.AllowedHeaders,
      },
      exposeHeaders: rule.ExposeHeaders,
      maxAgeSeconds: rule.MaxAgeSeconds,
    })),
  };

  console.log("Applying CORS…");
  await cfApi("PUT", `${base}/cors`, apiCors, token);
  console.log("✓ CORS applied");

  console.log("Updating Vercel R2_PUBLIC_URL…");
  pushVercelEnv("R2_PUBLIC_URL", publicUrl);
  console.log("✓ Vercel env updated");

  console.log("Deploying production…");
  const deploy = spawnSync("vercel", ["--prod", "--yes"], { cwd: ROOT, stdio: "inherit" });
  if (deploy.status !== 0) process.exit(deploy.status ?? 1);

  try {
    execSync(`rm -f ${JSON.stringify(pulledPath)}`, { cwd: ROOT });
  } catch {
    /* ignore */
  }

  console.log(`
✓ R2 setup complete!
  Public URL: ${publicUrl}
  Test: https://grandeflix.com/admin → Upload to Cloudflare R2
`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
