import type { Role } from "@/lib/types";

export const ROLES = ["super_admin", "admin", "teknisi"] as const;

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teknisi: "Teknisi",
};

export type Permissions = {
  role: Role;
  canViewFinance: boolean;
  canMutatePsb: boolean;
  canMutateFinance: boolean;
  canManageUsers: boolean;
};

export function parseRole(value: unknown): Role {
  if (value === "super_admin") return "super_admin";
  if (value === "admin") return "admin";
  return "teknisi";
}

export function permissionsFor(role: Role): Permissions {
  return {
    role,
    canViewFinance: role === "super_admin" || role === "admin",
    canMutatePsb: role === "super_admin" || role === "teknisi",
    canMutateFinance: role === "super_admin",
    canManageUsers: role === "super_admin",
  };
}

export const ROLE_HINTS: Record<Role, string> = {
  super_admin: "Akses penuh, termasuk keuangan dan pengaturan pengguna",
  admin: "Hanya melihat data, tidak bisa tambah/edit/hapus",
  teknisi: "Input/edit/hapus PSB; data keuangan tersembunyi",
};
