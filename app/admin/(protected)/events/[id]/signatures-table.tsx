"use client";

import { useMemo, useState } from "react";
import type { WaiverSignature } from "@/types/domain";

export default function SignaturesTable({ signatures }: { signatures: WaiverSignature[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return signatures;
    return signatures.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.team_name ?? "").toLowerCase().includes(q),
    );
  }, [signatures, query]);

  return (
    <div className="space-y-3">
      <input
        placeholder="Buscar por nombre, email o equipo..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full max-w-sm rounded-md border border-zinc-300 px-3 text-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Teléfono</th>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-3 py-2">Contacto emergencia</th>
              <th className="px-3 py-2">Firmado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2">{s.full_name}</td>
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2">{s.phone}</td>
                <td className="px-3 py-2">{s.team_name ?? "—"}</td>
                <td className="px-3 py-2">
                  {s.emergency_contact_name} ({s.emergency_contact_phone})
                </td>
                <td className="px-3 py-2">{new Date(s.signed_at).toLocaleString("es-PR")}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
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
