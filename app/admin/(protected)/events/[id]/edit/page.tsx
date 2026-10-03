import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/domain";
import EventForm from "../../event-form";

function uniqueSorted(values: (string | null)[]): string[] {
  const set = new Set(values.filter((v): v is string => !!v && v.trim().length > 0));
  return [...set].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

export default async function EditEventPage({
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

  const { count } = await supabase
    .from("waiver_signatures")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  const { data: all } = await supabase
    .from("events")
    .select("name, company_name, third_party_name");

  return (
    <EventForm
      event={event}
      signatureCount={count ?? 0}
      eventNames={uniqueSorted((all ?? []).map((e) => e.name))}
      companyNames={uniqueSorted((all ?? []).map((e) => e.company_name))}
      thirdPartyNames={uniqueSorted((all ?? []).map((e) => e.third_party_name))}
    />
  );
}
