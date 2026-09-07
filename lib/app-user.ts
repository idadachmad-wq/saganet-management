import { auth } from "@/lib/auth";
import { parseRole, permissionsFor, type Permissions } from "@/lib/rbac";
import type { Role } from "@/lib/types";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function requireSessionUser(): Promise<AppUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Pengguna",
    email: session.user.email ?? "",
    role: parseRole(session.user.role),
  };
}

export async function getSessionPermissions(): Promise<Permissions> {
  const user = await requireSessionUser();
  return permissionsFor(user.role);
}

export async function requirePsbMutate() {
  const perms = await getSessionPermissions();
  if (!perms.canMutatePsb) {
    throw new Error("Anda tidak punya izin mengubah data PSB");
  }
  return perms;
}

export async function requireFinanceView() {
  const perms = await getSessionPermissions();
  if (!perms.canViewFinance) {
    throw new Error("Anda tidak punya akses ke data keuangan");
  }
  return perms;
}

export async function requireFinanceMutate() {
  const perms = await getSessionPermissions();
  if (!perms.canMutateFinance) {
    throw new Error("Anda tidak punya izin mengubah data keuangan");
  }
  return perms;
}

export async function requireCustomerMutate() {
  const perms = await getSessionPermissions();
  if (!perms.canMutatePsb) {
    throw new Error("Anda tidak punya izin mengubah data pelanggan");
  }
  return perms;
}
