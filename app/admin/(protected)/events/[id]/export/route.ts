import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return new Response("No autorizado", { status: 401 });
  }

  const { data: allowed } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!allowed) {
    return new Response("No autorizado", { status: 401 });
  }

  const { data, error } = await supabase
    .from("waiver_signatures")
    .select(
      "full_name,email,phone,emergency_contact_name,emergency_contact_phone,accepted_liability,accepted_image_use,signature_name,signed_at,waiver_version,ip_address,user_agent",
    )
    .eq("event_id", id)
    .order("signed_at", { ascending: true });

  if (error) {
    return new Response("Error obteniendo las firmas", { status: 500 });
  }

  const csv = Papa.unparse(data ?? []);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="firmas-evento-${id}.csv"`,
    },
  });
}
