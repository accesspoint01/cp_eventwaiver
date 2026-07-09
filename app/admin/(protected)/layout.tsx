import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
      <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 print:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-zinc-900">
          <Image src="/cp-logo.png" alt="Center Point" width={32} height={18} />
          Center Point — Waivers
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin/team" className="text-sm text-zinc-500 hover:text-zinc-900">
            Administradores
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900">
              Cerrar sesión
            </button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  );
}
