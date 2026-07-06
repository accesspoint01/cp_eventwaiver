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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <QRCodeSVG value={url} size={160} />
      <p className="break-all text-center text-sm text-zinc-600">{url}</p>
      <button
        type="button"
        onClick={copyLink}
        className="h-10 w-full rounded-md border border-zinc-300 text-sm font-medium text-zinc-700"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
