"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QrPanel({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex w-fit max-w-full items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3">
      <QRCodeSVG value={url} size={96} className="shrink-0" />
      <div className="min-w-0 space-y-2">
        <p className="break-all text-sm text-zinc-600">{url}</p>
        <button
          type="button"
          onClick={copyLink}
          className="h-9 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700"
        >
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
