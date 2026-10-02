"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signatureSchema } from "@/lib/validation/schemas";
import { sendConfirmationEmails } from "@/lib/email/send-confirmation";
import type { PublicEventInfo } from "@/types/domain";

export type SubmitState = {
  ok: boolean;
  error?: string;
};

function radioToBoolean(value: FormDataEntryValue | null): boolean | undefined {
  if (value === "yes") return true;
  if (value === "no") return false;
  return undefined;
}

export async function submitSignature(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const parsed = signatureSchema.safeParse({
    signer_type: formData.get("signer_type"),
    event_id: formData.get("event_id"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    guardian_first_name: formData.get("guardian_first_name") ?? undefined,
    guardian_last_name: formData.get("guardian_last_name") ?? undefined,
    guardian_relationship: formData.get("guardian_relationship") ?? undefined,
    has_medical_info: radioToBoolean(formData.get("has_medical_info")),
    medical_info: formData.get("medical_info") ?? undefined,
    email: formData.get("email"),
    phone: formData.get("phone"),
    emergency_contact_name: formData.get("emergency_contact_name"),
    emergency_contact_phone: formData.get("emergency_contact_phone"),
    accepted_liability: formData.get("accepted_liability") === "on",
    accepted_image_use: formData.get("accepted_image_use") === "on",
    signature_name: formData.get("signature_name"),
    reviewed_confirmation: formData.get("reviewed_confirmation") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  // Everything about the event comes from the DB, never from the form:
  // which signer type it accepts and which text version was shown.
  const { data: event } = await supabase
    .from("public_event_info")
    .select("name, company_name, third_party_name, event_date, audience, waiver_version, guardian_waiver_version")
    .eq("id", data.event_id)
    .maybeSingle<
      Pick<
        PublicEventInfo,
        | "name"
        | "company_name"
        | "third_party_name"
        | "event_date"
        | "audience"
        | "waiver_version"
        | "guardian_waiver_version"
      >
    >();

  if (!event) {
    return { ok: false, error: "Este evento ya no está aceptando firmas." };
  }

  const expectedSigner = event.audience === "minors" ? "guardian" : "adult";
  if (data.signer_type !== expectedSigner) {
    return { ok: false, error: "Este formulario no corresponde a este evento. Recarga la página." };
  }

  const waiverVersion =
    data.signer_type === "guardian" ? event.guardian_waiver_version : event.waiver_version;
  if (!waiverVersion) {
    console.error("Evento de menores sin guardian_waiver_version:", data.event_id);
    return { ok: false, error: "Este evento no está configurado correctamente. Contacta a los organizadores." };
  }

  const h = await headers();
  const ip =
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent");

  const signedAt = new Date().toISOString();

  const row =
    data.signer_type === "guardian"
      ? { ...data, medical_info: data.has_medical_info ? data.medical_info : null }
      : data;

  // Deliberately not chaining .select() here: anon has no SELECT policy on
  // waiver_signatures (so nobody can read others' signed data), and
  // INSERT ... RETURNING requires that same visibility — requesting the row
  // back would fail with a misleading "violates row-level security policy"
  // error even though the insert itself is allowed.
  const { error } = await supabase.from("waiver_signatures").insert({
    ...row,
    waiver_version: waiverVersion,
    signed_at: signedAt,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error("Error guardando firma:", error);
    return { ok: false, error: "No se pudo guardar la firma. Verifica tu conexión e intenta de nuevo." };
  }

  const eventDate = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("es-PR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const parties = [event.company_name, event.third_party_name].filter(
    (v): v is string => !!v,
  );
  const companyLine = parties.length ? ` — ${parties.join(" / ")}` : "";

  const participantName = `${data.first_name} ${data.last_name}`.trim();
  const isGuardian = data.signer_type === "guardian";

  await sendConfirmationEmails(
    {
      signerType: data.signer_type,
      signerName: isGuardian
        ? `${data.guardian_first_name} ${data.guardian_last_name}`.trim()
        : participantName,
      participantName,
      guardianRelationship: isGuardian ? data.guardian_relationship : null,
      email: data.email,
      phone: data.phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      hasMedicalInfo: isGuardian ? data.has_medical_info : null,
      medicalInfo: isGuardian && data.has_medical_info ? (data.medical_info ?? null) : null,
      acceptedLiability: data.accepted_liability,
      acceptedImageUse: data.accepted_image_use,
      signedAt,
    },
    { name: event.name, companyLine, eventDate },
  );

  return { ok: true };
}
