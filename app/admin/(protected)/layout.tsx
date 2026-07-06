import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  const { data: allowed } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=no-autorizado");
  }

  return (
    <div>
      <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <Link href="/admin" className="font-semibold text-zinc-900">
          Center Point — Waivers
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900">
            Cerrar sesión
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
