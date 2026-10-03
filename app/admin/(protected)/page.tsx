import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/domain";
import DeleteEventButton from "./events/delete-event-button";

type EventWithCount = Event & { waiver_signatures: { count: number }[] };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*, waiver_signatures(count)")
    .order("created_at", { ascending: false })
    .returns<EventWithCount[]>();

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
          <li key={event.id} className="flex items-center hover:bg-zinc-50">
            <Link
              href={`/admin/events/${event.id}`}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900">{event.name}</p>
                <p className="truncate text-sm text-zinc-500">
                  {event.company_name ?? "Sin cliente"} · {event.event_date}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  event.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {event.is_active ? "Activo" : "Inactivo"}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-3 pr-4 text-sm">
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="text-zinc-700 hover:underline"
              >
                Editar
              </Link>
              <DeleteEventButton
                eventId={event.id}
                eventName={event.name}
                signatureCount={event.waiver_signatures?.[0]?.count ?? 0}
              />
            </div>
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
