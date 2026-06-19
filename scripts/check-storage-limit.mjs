import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const vars = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim();
  }
  return vars;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: buckets, error: listError } = await sb.storage.listBuckets();
console.log("listBuckets error:", listError?.message ?? null);
console.log("listBuckets:", JSON.stringify(buckets, null, 2));

const { data: bucket, error: getError } = await sb.storage.getBucket("media");
console.log("getBucket error:", getError?.message ?? null);
console.log("getBucket media:", JSON.stringify(bucket, null, 2));

const ONE_GB = 1073741824;
const { data: updated, error: updateError } = await sb.storage.updateBucket("media", {
  public: true,
  fileSizeLimit: ONE_GB,
  allowedMimeTypes: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
});
console.log("updateBucket error:", updateError?.message ?? null);
console.log("updateBucket result:", JSON.stringify(updated, null, 2));

const { data: after, error: afterError } = await sb.storage.getBucket("media");
console.log("getBucket after update error:", afterError?.message ?? null);
console.log("getBucket after update:", JSON.stringify(after, null, 2));
