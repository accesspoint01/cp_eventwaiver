import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import type { WaiverSignature } from "@/types/domain";

// Excel opens a CSV without a BOM as Windows-1252, which turns UTF-8
// accents into "Ã¡", "Ã­", etc. A leading BOM makes it read UTF-8.
const UTF8_BOM = "﻿";

const COMMON_START = ["first_name", "last_name"] as const;
const GUARDIAN_COLUMNS = [
  "guardian_first_name",
  "guardian_last_name",
  "guardian_relationship",
] as const;
const CONTACT = ["email", "phone", "emergency_contact_name", "emergency_contact_phone"] as const;
const MEDICAL_COLUMNS = ["has_medical_info", "medical_info"] as const;
const CONSENT_AND_EVIDENCE = [
  "accepted_liability",
  "accepted_image_use",
  "signature_name",
  "signed_at",
  "waiver_version",
  "ip_address",
  "user_agent",
] as const;

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
    .select("*")
    .eq("event_id", id)
    .order("signed_at", { ascending: true })
    .returns<WaiverSignature[]>();

  if (error) {
    return new Response("Error obteniendo las firmas", { status: 500 });
  }

  const rows = data ?? [];

  // For guardian signatures first/last name are the minor. Guardian and
  // medical columns are only included when the event actually has them, so
  // adult-only exports don't carry empty columns.
  const hasGuardian = rows.some((r) => r.signer_type === "guardian");
  const columns: (keyof WaiverSignature)[] = [
    ...COMMON_START,
    ...(hasGuardian ? GUARDIAN_COLUMNS : []),
    ...CONTACT,
    ...(hasGuardian ? MEDICAL_COLUMNS : []),
    ...CONSENT_AND_EVIDENCE,
  ];

  const csv = Papa.unparse({
    fields: columns as string[],
    data: rows.map((r) => columns.map((c) => r[c] ?? "")),
  });

  return new Response(UTF8_BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="firmas-evento-${id}.csv"`,
    },
  });
}
