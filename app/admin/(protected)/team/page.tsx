import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AddAdminForm from "./add-admin-form";
import RemoveAdminButton from "./remove-admin-button";

type AdminRow = { email: string; name: string | null; created_at: string };

export default async function TeamPage() {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("admin_allowlist")
    .select("email, name, created_at")
    .order("created_at", { ascending: true })
    .returns<AdminRow[]>();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Eventos
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900">Administradores</h1>
      </div>

      <AddAdminForm />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {(admins ?? []).map((a) => (
              <tr key={a.email}>
                <td className="px-3 py-2">{a.name ?? "—"}</td>
                <td className="px-3 py-2">{a.email}</td>
                <td className="px-3 py-2">
                  <RemoveAdminButton email={a.email} />
                </td>
              </tr>
            ))}
            {(admins ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                  Sin administradores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
