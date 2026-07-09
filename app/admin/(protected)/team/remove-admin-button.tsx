"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeAdmin } from "./actions";

export default function RemoveAdminButton({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleRemove() {
    if (!confirm(`¿Quitar acceso de administrador a "${email}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeAdmin(email);
      if (!result.ok) {
        setError(result.error ?? "No se pudo quitar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "Quitando..." : "Quitar"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
