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
    .eq("is_current", true)
    .maybeSingle();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: parsed.data.name,
      company_name: parsed.data.company_name || null,
      third_party_name: parsed.data.third_party_name || null,
      event_date: parsed.data.event_date,
      slug: parsed.data.slug,
      waiver_version: currentVersion?.version ?? "v1",
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
