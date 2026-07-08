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
    risk_clause: event.risk_clause,
    includes_minors: event.includes_minors,
  });

  // The stored legal text has two {{SECTION_SPLIT}} markers bracketing the
  // photo/image authorization section, so it can be shown as its own block
  // with its own (independent, declinable) checkbox. Everything else
  // (including general closing provisions like severability/governing law)
  // stays together in the liability block.
  const [before = "", middle = "", after = ""] = waiverText.split("{{SECTION_SPLIT}}");
  const liabilityText = [before, after].filter((part) => part.trim()).join("\n\n").trim();
  const imageText = middle.trim();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md sm:max-w-2xl lg:max-w-3xl">
        <WaiverForm
          eventId={event.id}
          eventName={event.name}
          waiverVersion={event.waiver_version}
          liabilityText={liabilityText.trim()}
          imageText={imageText.trim()}
        />
      </div>
    </main>
  );
}
