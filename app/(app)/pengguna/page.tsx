import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { parseRole, permissionsFor } from "@/lib/rbac";
import { hasServiceRoleKey } from "@/lib/supabase-admin";
import { PageHeader } from "@/components/ui";
import { listWorkspaceUsers } from "./actions";
import { PenggunaClient } from "./pengguna-client";

export const metadata = { title: "Pengguna" };

export default async function PenggunaPage() {
  const session = await auth();
  const perms = permissionsFor(parseRole(session?.user?.role));
  if (!perms.canManageUsers) redirect("/dashboard");

  const configured = hasServiceRoleKey();
  const users = await listWorkspaceUsers();

  return (
    <div>
      <PageHeader
        title="Pengguna"
        description="Daftar akun dari Authentication Users. Peran Super Admin, Admin, dan Teknisi terikat ke UID masing-masing."
      />
      <PenggunaClient
        users={users}
        currentUserId={session?.user?.id ?? ""}
        serviceConfigured={configured}
      />
    </div>
  );
}
