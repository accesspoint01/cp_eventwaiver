"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WaiverSignature } from "@/types/domain";
import { deleteSignature } from "./actions";

export default function SignaturesTable({
  eventId,
  signatures,
}: {
  eventId: string;
  signatures: WaiverSignature[];
}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const numbered = useMemo(
    () => signatures.map((s, i) => ({ ...s, rowNumber: i + 1 })),
    [signatures],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return numbered;
    return numbered.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [numbered, query]);

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Borrar la firma de "${name}"? Esto no se puede deshacer.`)) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteSignature(eventId, id);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <input
        placeholder="Buscar por nombre o email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full max-w-sm rounded-md border border-zinc-300 px-3 text-sm print:hidden"
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Teléfono</th>
              <th className="px-3 py-2">Contacto emergencia</th>
              <th className="px-3 py-2">Responsabilidad</th>
              <th className="px-3 py-2">Imagen</th>
              <th className="px-3 py-2">Firmado</th>
              <th className="px-3 py-2 print:hidden">Borrar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 text-zinc-500">{s.rowNumber}</td>
                <td className="px-3 py-2">{s.full_name}</td>
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2">{s.phone}</td>
                <td className="px-3 py-2">
                  {s.emergency_contact_name} ({s.emergency_contact_phone})
                </td>
                <td className="px-3 py-2">{s.accepted_liability ? "Sí" : "No"}</td>
                <td className="px-3 py-2">{s.accepted_image_use ? "Sí" : "No"}</td>
                <td className="px-3 py-2">{new Date(s.signed_at).toLocaleString("es-PR")}</td>
                <td className="px-3 py-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.full_name)}
                    disabled={isPending && deletingId === s.id}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    {isPending && deletingId === s.id ? "Borrando..." : "Borrar"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-zinc-500">
                  Sin firmas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
