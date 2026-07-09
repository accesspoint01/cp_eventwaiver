import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Event, WaiverSignature } from "@/types/domain";
import { toggleActive } from "./actions";
import QrPanel from "./qr-panel";
import SignaturesTable from "./signatures-table";
import PrintButton from "./print-button";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle<Event>();

  if (!event) notFound();

  const { data: signatures } = await supabase
    .from("waiver_signatures")
    .select("*")
    .eq("event_id", id)
    .order("signed_at", { ascending: false })
    .returns<WaiverSignature[]>();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const waiverUrl = `${siteUrl}/${event.slug}`;
  const parties = [event.company_name, event.third_party_name].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 print:max-w-none print:p-0">
      <div className="print:hidden">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Eventos
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{event.name}</h1>
            <p className="text-sm text-zinc-500">
              {parties.length ? parties.join(" / ") : "Sin cliente"} · {event.event_date}
            </p>
          </div>
          <form action={toggleActive.bind(null, event.id, !event.is_active)}>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                event.is_active ? "bg-zinc-100 text-zinc-700" : "bg-green-600 text-white"
              }`}
            >
              {event.is_active ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
      </div>

      <h1 className="hidden text-xl font-semibold text-zinc-900 print:block">
        {event.name} — {parties.length ? parties.join(" / ") : "Sin cliente"} · {event.event_date}
      </h1>

      <div className="grid gap-6 sm:grid-cols-[240px_1fr] print:block">
        <div className="print:hidden">
          <QrPanel url={waiverUrl} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">
              Firmas recibidas ({signatures?.length ?? 0})
            </h2>
            <div className="flex items-center gap-2 print:hidden">
              <PrintButton />
              <a
                href={`/admin/events/${event.id}/export`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700"
              >
                Exportar CSV
              </a>
            </div>
          </div>
          <SignaturesTable eventId={event.id} signatures={signatures ?? []} />
        </div>
      </div>
    </main>
  );
}
