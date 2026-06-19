"use client";

import { useState } from "react";

export function SetupClient({ schema }: { schema: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(schema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={copy}
        className="btn-secondary rounded-lg px-4 py-2 text-sm"
      >
        {copied ? "Copied!" : "Copy SQL to clipboard"}
      </button>
      <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 text-[11px] leading-relaxed text-white/50">
        {schema}
      </pre>
    </div>
  );
}
