import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ONE_GB = 1073741824;
const MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function loadEnv() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const vars = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${bytes / (1024 ** 3)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: before, error: beforeError } = await sb.storage.getBucket("media");
if (beforeError || !before) {
  console.error("Could not read media bucket:", beforeError?.message ?? "not found");
  console.error('Run npm run db:storage first, then retry.');
  process.exit(1);
}

console.log(`Current bucket file_size_limit: ${before.file_size_limit} (${formatBytes(before.file_size_limit ?? 0)})`);

const { data: updated, error: updateError } = await sb.storage.updateBucket("media", {
  public: true,
  fileSizeLimit: ONE_GB,
  allowedMimeTypes: MIME_TYPES,
});

if (updateError) {
  console.error("updateBucket failed:", updateError.message);
  if (updateError.message.toLowerCase().includes("exceeded the maximum allowed size")) {
    console.error("");
    console.error("Supabase rejected 1 GB — this project is likely on the Free tier (50 MB global cap).");
    console.error("Upgrade to Pro, then:");
    console.error("  1. Dashboard → Storage → Settings → raise Global file size limit");
    console.error("  2. Re-run: npm run db:storage-1gb:apply");
    console.error("  Or use YouTube/Vimeo URLs for large videos.");
  }
  process.exit(1);
}

const { data: after } = await sb.storage.getBucket("media");
console.log("Updated bucket:", updated?.id ?? "media");
console.log(`New file_size_limit: ${after?.file_size_limit} (${formatBytes(after?.file_size_limit ?? 0)})`);

if ((after?.file_size_limit ?? 0) < ONE_GB) {
  console.error("Bucket limit is still below 1 GB. Check Supabase Storage Settings global limit.");
  process.exit(1);
}

console.log("Storage bucket is configured for 1 GB uploads.");
