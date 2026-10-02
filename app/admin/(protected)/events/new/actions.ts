"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validation/schemas";

export type CreateEventState = { ok: boolean; error?: string };

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const parsed = eventSchema.safeParse({
    name: formData.get("name"),
    company_name: formData.get("company_name") ?? "",
    third_party_name: formData.get("third_party_name") ?? "",
    event_date: formData.get("event_date"),
    slug: formData.get("slug"),
    risk_clause: formData.get("risk_clause") ?? "",
    audience: formData.get("audience"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentVersion } = await supabase
    .from("waiver_text_versions")
    .select("version")
    .eq("kind", "adult")
    .eq("is_current", true)
    .maybeSingle();

  if (!currentVersion) {
    return { ok: false, error: "No hay un texto legal vigente para adultos configurado." };
  }

  // The guardian text in use is the most recently created 'guardian' row.
  let guardianVersion: string | null = null;
  if (parsed.data.audience === "minors") {
    const { data: latestGuardian } = await supabase
      .from("waiver_text_versions")
      .select("version")
      .eq("kind", "guardian")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestGuardian) {
      return { ok: false, error: "No hay un texto legal para padres/tutores configurado." };
    }
    guardianVersion = latestGuardian.version;
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: parsed.data.name,
      company_name: parsed.data.company_name || null,
      third_party_name: parsed.data.third_party_name || null,
      event_date: parsed.data.event_date,
      slug: parsed.data.slug,
      risk_clause: parsed.data.risk_clause || null,
      audience: parsed.data.audience,
      waiver_version: currentVersion.version,
      guardian_waiver_version: guardianVersion,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Ese link ya está en uso, escoge otro."
          : "No se pudo crear el evento.",
    };
  }

  revalidatePath("/admin");
  redirect(`/admin/events/${event.id}`);
}
