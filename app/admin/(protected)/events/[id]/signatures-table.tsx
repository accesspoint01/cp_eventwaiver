"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { WaiverSignature } from "@/types/domain";
import { deleteSignature } from "./actions";

type SortDir = "asc" | "desc";

type Column = {
  id: string;
  label: string;
  // Tailwind print width class for the <col>, tuned per column set so the
  // whole table fits one landscape page.
  printWidth: string;
  // Long cells wrap on screen with this minimum width; the rest stay on one line.
  screenMinWidth?: string;
  printBreak?: "print:break-words" | "print:break-all";
  sortValue: (s: WaiverSignature) => string | number;
  render: (s: WaiverSignature) => ReactNode;
};

const relationshipLabel: Record<string, string> = {
  padre: "padre",
  madre: "madre",
  tutor: "tutor(a)",
};

function guardianName(s: WaiverSignature): string {
  return `${s.guardian_first_name ?? ""} ${s.guardian_last_name ?? ""}`.trim();
}

function yesNo(value: boolean) {
  return value ? "Sí" : "No";
}

const firstName: Column = {
  id: "first_name",
  label: "Nombre",
  printWidth: "print:w-[11%]",
  printBreak: "print:break-words",
  sortValue: (s) => s.first_name,
  render: (s) => s.first_name,
};

const lastName: Column = {
  id: "last_name",
  label: "Apellido",
  printWidth: "print:w-[12%]",
  printBreak: "print:break-words",
  sortValue: (s) => s.last_name,
  render: (s) => s.last_name,
};

const email: Column = {
  id: "email",
  label: "Email",
  printWidth: "print:w-[19%]",
  printBreak: "print:break-all",
  sortValue: (s) => s.email,
  render: (s) => s.email,
};

const phone: Column = {
  id: "phone",
  label: "Teléfono",
  printWidth: "print:w-[10%]",
  sortValue: (s) => s.phone,
  render: (s) => s.phone,
};

const emergency: Column = {
  id: "emergency",
  label: "Contacto emergencia",
  printWidth: "print:w-[16%]",
  screenMinWidth: "min-w-[9rem]",
  printBreak: "print:break-words",
  sortValue: (s) => s.emergency_contact_name,
  render: (s) => `${s.emergency_contact_name} (${s.emergency_contact_phone})`,
};

const liability: Column = {
  id: "liability",
  label: "Responsabilidad",
  printWidth: "print:w-[10%]",
  sortValue: (s) => Number(s.accepted_liability),
  render: (s) => yesNo(s.accepted_liability),
};

const image: Column = {
  id: "image",
  label: "Imagen",
  printWidth: "print:w-[7%]",
  sortValue: (s) => Number(s.accepted_image_use),
  render: (s) => yesNo(s.accepted_image_use),
};

const signed: Column = {
  id: "signed",
  label: "Firmado",
  printWidth: "print:w-[12%]",
  sortValue: (s) => new Date(s.signed_at).getTime(),
  render: (s) => new Date(s.signed_at).toLocaleString("es-PR"),
};

const adultColumns: Column[] = [
  firstName,
  lastName,
  email,
  phone,
  emergency,
  liability,
  image,
  signed,
];

// Events with guardian signatures: first/last name are the minor; email and
// phone belong to the guardian. Medical info is shown because it's what
// staff most need on the printed sheet at the event.
const guardianColumns: Column[] = [
  { ...firstName, printWidth: "print:w-[8%]" },
  { ...lastName, printWidth: "print:w-[9%]" },
  {
    id: "guardian",
    label: "Padre/tutor",
    printWidth: "print:w-[11%]",
    screenMinWidth: "min-w-[9rem]",
    printBreak: "print:break-words",
    sortValue: (s) => guardianName(s),
    render: (s) =>
      s.signer_type === "guardian"
        ? `${guardianName(s)} (${relationshipLabel[s.guardian_relationship ?? ""] ?? ""})`
        : "—",
  },
  { ...email, label: "Email (tutor)", printWidth: "print:w-[13%]" },
  { ...phone, label: "Tel. (tutor)", printWidth: "print:w-[8%]" },
  { ...emergency, printWidth: "print:w-[11%]" },
  {
    id: "medical",
    label: "Alergias / medicamentos",
    printWidth: "print:w-[13%]",
    screenMinWidth: "min-w-[13rem]",
    printBreak: "print:break-words",
    sortValue: (s) => (s.has_medical_info ? 1 : 0),
    render: (s) =>
      s.has_medical_info === null ? "—" : s.has_medical_info ? `Sí: ${s.medical_info ?? ""}` : "No",
  },
  { ...liability, printWidth: "print:w-[9%]" },
  { ...image, printWidth: "print:w-[6%]" },
  { ...signed, printWidth: "print:w-[8%]" },
];

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { sensitivity: "base" });
}

export default function SignaturesTable({
  eventId,
  signatures,
}: {
  eventId: string;
  signatures: WaiverSignature[];
}) {
  const [query, setQuery] = useState("");
  const [sortId, setSortId] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const hasGuardian = signatures.some((s) => s.signer_type === "guardian");
  const columns = hasGuardian ? guardianColumns : adultColumns;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return signatures;
    return signatures.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        guardianName(s).toLowerCase().includes(q),
    );
  }, [signatures, query]);

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.id === sortId);
    if (!column) return filtered;
    const copy = [...filtered];
    copy.sort(
      (a, b) => compare(column.sortValue(a), column.sortValue(b)) * (sortDir === "asc" ? 1 : -1),
    );
    return copy;
  }, [filtered, columns, sortId, sortDir]);

  // # always reflects the current on-screen position (1..N for whatever is
  // currently sorted/filtered), not a fixed per-person identifier.
  const numbered = useMemo(() => sorted.map((s, i) => ({ ...s, rowNumber: i + 1 })), [sorted]);

  function handleSort(id: string) {
    if (sortId === id) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortId(id);
      setSortDir("asc");
    }
  }

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

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white print:overflow-visible print:rounded-none print:border-0">
        <table className="w-full min-w-[720px] table-auto text-left text-[13px] print:min-w-0 print:w-full print:table-fixed print:text-[10px]">
          <colgroup>
            <col className="print:w-[3%]" />
            {columns.map((col) => (
              <col key={col.id} className={col.printWidth} />
            ))}
            <col className="print:hidden" />
          </colgroup>
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-2 py-2 print:px-1 print:py-1">#</th>
              {columns.map((col) => (
                <th key={col.id} className="px-2 py-2 print:px-1 print:py-1">
                  <button
                    type="button"
                    onClick={() => handleSort(col.id)}
                    className="flex cursor-pointer items-center gap-1 text-left font-medium hover:text-zinc-900 print:pointer-events-none"
                  >
                    {col.label}
                    <span className={sortId === col.id ? "text-zinc-700" : "text-zinc-300"}>
                      {sortId === col.id ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  </button>
                </th>
              ))}
              <th className="px-2 py-2 print:hidden">Borrar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {numbered.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap px-2 py-2 text-zinc-500 print:px-1 print:py-1">
                  {s.rowNumber}
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={[
                      "px-2 py-2 print:px-1 print:py-1",
                      col.screenMinWidth ?? "whitespace-nowrap print:whitespace-normal",
                      col.printBreak ?? "",
                    ].join(" ")}
                  >
                    {col.render(s)}
                  </td>
                ))}
                <td className="px-2 py-2 print:hidden">
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
            {numbered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-6 text-center text-zinc-500">
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
