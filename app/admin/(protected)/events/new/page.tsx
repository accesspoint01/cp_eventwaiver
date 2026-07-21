import { createClient } from "@/lib/supabase/server";
import NewEventForm from "./new-event-form";

function uniqueSorted(values: (string | null)[]): string[] {
  const set = new Set(values.filter((v): v is string => !!v && v.trim().length > 0));
  return [...set].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("name, company_name, third_party_name");

  const eventNames = uniqueSorted((data ?? []).map((e) => e.name));
  const companyNames = uniqueSorted((data ?? []).map((e) => e.company_name));
  const thirdPartyNames = uniqueSorted((data ?? []).map((e) => e.third_party_name));

  return (
    <NewEventForm
      eventNames={eventNames}
      companyNames={companyNames}
      thirdPartyNames={thirdPartyNames}
    />
  );
}
