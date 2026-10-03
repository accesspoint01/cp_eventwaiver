"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "./[id]/actions";

export default function DeleteEventButton({
  eventId,
  eventName,
  signatureCount,
  redirectTo,
  className = "text-red-600 hover:underline",
}: {
  eventId: string;
  eventName: string;
  signatureCount: number;
  /** Where to go after deleting (e.g. when deleting from the event's own page). */
  redirectTo?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    setError(null);
    if (signatureCount > 0) {
      const typed = prompt(
        `"${eventName}" tiene ${signatureCount} ${signatureCount === 1 ? "firma" : "firmas"} ` +
          `que ${signatureCount === 1 ? "se borrará" : "se borrarán"} de forma permanente. ` +
          `Si solo quieres que deje de aceptar firmas, ` +
          `usa "Desactivar".\n\nPara borrarlo, escribe BORRAR:`,
      );
      if (typed?.trim().toUpperCase() !== "BORRAR") return;
    } else if (!confirm(`¿Eliminar el evento "${eventName}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar.");
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className={`${className} disabled:opacity-50`}
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}
