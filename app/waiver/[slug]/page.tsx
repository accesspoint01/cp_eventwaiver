import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { renderWaiverText } from "@/lib/waiver/template";
import WaiverForm from "./waiver-form";
import type { PublicEventInfo, WaiverTextVersion } from "@/types/domain";

export default async function WaiverPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("public_event_info")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<PublicEventInfo>();

  if (!event) notFound();

  const { data: textVersion } = await supabase
    .from("waiver_text_versions")
    .select("*")
    .eq("version", event.waiver_version)
    .maybeSingle<WaiverTextVersion>();

  if (!textVersion) notFound();

  const eventDate = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const waiverText = renderWaiverText(textVersion.body_template, {
    event_name: event.name,
    company_name: event.company_name,
    third_party_name: event.third_party_name,
    event_date: eventDate,
  });

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <WaiverForm
          eventId={event.id}
          eventName={event.name}
          waiverVersion={event.waiver_version}
          waiverText={waiverText}
        />
      </div>
    </main>
  );
}
