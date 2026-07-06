"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signatureSchema } from "@/lib/validation/schemas";
import { sendConfirmationEmails } from "@/lib/email/send-confirmation";

export type SubmitState = {
  ok: boolean;
  error?: string;
};

export async function submitSignature(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const parsed = signatureSchema.safeParse({
    event_id: formData.get("event_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    team_name: formData.get("team_name") ?? "",
    emergency_contact_name: formData.get("emergency_contact_name"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    accepted_terms: formData.get("accepted_terms") === "on",
    signature_name: formData.get("signature_name"),
    waiver_version: formData.get("waiver_version"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const h = await headers();
  const ip =
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent");

  const supabase = await createClient();
  const { team_name, ...rest } = parsed.data;

  const { data: inserted, error } = await supabase
    .from("waiver_signatures")
    .insert({
      ...rest,
      team_name: team_name || null,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("signed_at")
    .single();

  if (error) {
    console.error("Error guardando firma:", error);
    return { ok: false, error: "No se pudo guardar la firma. Verifica tu conexión e intenta de nuevo." };
  }

  // Recompute event/company info from the DB (not the submitted form) so
  // the confirmation emails always reflect the real, current event record.
  const { data: event } = await supabase
    .from("public_event_info")
    .select("name, company_name, third_party_name, event_date")
    .eq("id", parsed.data.event_id)
    .maybeSingle();

  if (event) {
    const eventDate = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("es-PR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const parties = [event.company_name, event.third_party_name].filter(
      (v): v is string => !!v,
    );
    const companyLine = parties.length ? ` — ${parties.join(" / ")}` : "";

    await sendConfirmationEmails(
      {
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        team_name: team_name || null,
        emergency_contact_name: parsed.data.emergency_contact_name,
        emergency_contact_phone: parsed.data.emergency_contact_phone,
        signed_at: inserted?.signed_at ?? new Date().toISOString(),
      },
      { name: event.name, companyLine, eventDate },
    );
  }

  return { ok: true };
}
