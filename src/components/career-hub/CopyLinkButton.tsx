"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 px-4 text-label-bold text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"><span className="material-symbols-outlined text-[18px]" aria-hidden>{copied ? "check" : "content_copy"}</span>{copied ? "Link disalin" : "Salin link"}</button>;
}
