import { AuthError, requireAdmin } from "@/lib/content";
import type { MediaKind } from "@/lib/media-upload";
import { putR2Object } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof AuthError ? err.message : "Unauthorized.";
    const status = err instanceof AuthError && err.code === "unauthorized" ? 401 : 403;
    return Response.json({ error: message }, { status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Could not read upload. File may exceed the server upload limit — try a smaller file or paste a public R2 URL." },
      { status: 413 },
    );
  }

  const file = form.get("file");
  const kind = form.get("kind");
  const slug = form.get("slug");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  if (kind !== "video" && kind !== "trailer" && kind !== "thumbnail") {
    return Response.json({ error: "Invalid media kind." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await putR2Object({
    kind: kind as MediaKind,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    body: buffer,
    slug: typeof slug === "string" ? slug : undefined,
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ publicUrl: result.publicUrl, path: result.path });
}
