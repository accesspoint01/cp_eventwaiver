import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/domain";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Event[]>();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Eventos</h1>
        <Link
          href="/admin/events/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo evento
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {(events ?? []).map((event) => (
          <li key={event.id}>
            <Link
              href={`/admin/events/${event.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
            >
              <div>
                <p className="font-medium text-zinc-900">{event.name}</p>
                <p className="text-sm text-zinc-500">
                  {event.company_name ?? "Sin cliente"} · {event.event_date}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  event.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {event.is_active ? "Activo" : "Inactivo"}
              </span>
            </Link>
          </li>
        ))}
        {(events ?? []).length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Aún no hay eventos.
          </li>
        )}
      </ul>
    </main>
  );
}
