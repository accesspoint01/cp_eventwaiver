"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleActive(eventId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("events").update({ is_active: isActive }).eq("id", eventId);
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
}
