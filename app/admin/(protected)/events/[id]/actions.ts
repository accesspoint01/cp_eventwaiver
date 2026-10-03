"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validation/schemas";

export type UpdateEventState = { ok: boolean; error?: string };

export async function updateEvent(
  eventId: string,
  _prevState: UpdateEventState,
  formData: FormData,
): Promise<UpdateEventState> {
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

  const { data: current } = await supabase
    .from("events")
    .select("audience, guardian_waiver_version")
    .eq("id", eventId)
    .maybeSingle();
  if (!current) return { ok: false, error: "El evento ya no existe." };

  const update: Record<string, unknown> = {
    name: parsed.data.name,
    company_name: parsed.data.company_name || null,
    third_party_name: parsed.data.third_party_name || null,
    event_date: parsed.data.event_date,
    slug: parsed.data.slug,
    risk_clause: parsed.data.risk_clause || null,
  };

  if (parsed.data.audience !== current.audience) {
    const { count } = await supabase
      .from("waiver_signatures")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: "No se puede cambiar el tipo de participantes porque el evento ya tiene firmas.",
      };
    }

    update.audience = parsed.data.audience;
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
      update.guardian_waiver_version = latestGuardian.version;
    } else {
      update.guardian_waiver_version = null;
    }
  }

  const { error } = await supabase.from("events").update(update).eq("id", eventId);
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Ese link ya está en uso, escoge otro."
          : "No se pudo guardar el evento.",
    };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();
  // Signatures are removed too (ON DELETE CASCADE).
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    console.error("Error borrando evento:", error);
    return { ok: false, error: "No se pudo eliminar el evento." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleActive(eventId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("events").update({ is_active: isActive }).eq("id", eventId);
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
}

export async function deleteSignature(eventId: string, signatureId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("waiver_signatures").delete().eq("id", signatureId);
  if (error) {
    console.error("Error borrando firma:", error);
    return { ok: false };
  }
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}
