"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
