import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/app-user";
import { parseRole, permissionsFor } from "@/lib/rbac";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const permissions = permissionsFor(parseRole(session.user.role));

  return (
    <Providers>
      <AppShell
        userName={session.user.name}
        role={permissions.role}
        canViewFinance={permissions.canViewFinance}
        canManageUsers={permissions.canManageUsers}
      >
        {children}
      </AppShell>
    </Providers>
  );
}
