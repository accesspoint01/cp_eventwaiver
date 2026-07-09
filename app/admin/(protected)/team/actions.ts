"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminSchema } from "@/lib/validation/schemas";

async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: allowed } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  return allowed ? user.email.toLowerCase() : null;
}

export type AddAdminState = { ok: boolean; error?: string };

export async function addAdmin(
  _prevState: AddAdminState,
  formData: FormData,
): Promise<AddAdminState> {
  const callerEmail = await requireAdmin();
  if (!callerEmail) return { ok: false, error: "No autorizado" };

  const parsed = adminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_allowlist")
    .insert({ name: parsed.data.name, email: parsed.data.email });

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Ese email ya tiene acceso." : "No se pudo agregar.",
    };
  }

  revalidatePath("/admin/team");
  return { ok: true };
}

export async function removeAdmin(email: string) {
  const callerEmail = await requireAdmin();
  if (!callerEmail) return { ok: false };

  if (callerEmail === email.trim().toLowerCase()) {
    return { ok: false, error: "No puedes quitarte a ti mismo." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("admin_allowlist").delete().eq("email", email);

  if (error) return { ok: false };

  revalidatePath("/admin/team");
  return { ok: true };
}
