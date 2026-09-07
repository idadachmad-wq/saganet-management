"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin, hasServiceRoleKey } from "@/lib/supabase-admin";
import {
  countSuperAdmins,
  getProfile,
  listProfiles,
  upsertProfile,
} from "@/lib/db";
import { parseRole, permissionsFor, ROLES } from "@/lib/rbac";
import type { Role } from "@/lib/types";

export type WorkspaceUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireManager() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const perms = permissionsFor(parseRole(session.user.role));
  if (!perms.canManageUsers) {
    throw new Error("Hanya Super Admin yang boleh mengatur pengguna");
  }
  return session.user;
}

function parseRoleValue(value: FormDataEntryValue | null): Role {
  const role = String(value ?? "");
  if ((ROLES as readonly string[]).includes(role)) return role as Role;
  throw new Error("Peran tidak valid");
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export async function listWorkspaceUsers(): Promise<WorkspaceUser[]> {
  const session = await requireManager();

  if (hasServiceRoleKey()) {
    const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const profiles = await listProfiles();
    const byId = new Map(profiles.map((p) => [p.id, p]));

    return (data.users ?? []).map((user) => {
      const profile = byId.get(user.id);
      const meta = user.user_metadata ?? {};
      const metaName =
        typeof meta.name === "string" ? meta.name.trim() : "";
      return {
        id: user.id,
        email: user.email ?? "",
        name:
          profile?.name || metaName || user.email?.split("@")[0] || "Pengguna",
        role: profile?.role ?? "teknisi",
      };
    });
  }

  const profiles = await listProfiles();
  const mapped = profiles.map((profile) => ({
    id: profile.id,
    email: profile.id === session.id ? (session.email ?? "") : "",
    name: profile.name,
    role: profile.role,
  }));

  if (session.id && !mapped.some((u) => u.id === session.id)) {
    mapped.unshift({
      id: session.id,
      email: session.email ?? "",
      name: session.name ?? "Pengguna",
      role: parseRole(session.role),
    });
  }

  return mapped;
}

export async function updateUserRole(formData: FormData): Promise<ActionResult> {
  try {
    const manager = await requireManager();
    const id = String(formData.get("id") ?? "").trim();
    const role = parseRoleValue(formData.get("role"));
    if (!id) return { ok: false, error: "ID pengguna tidak ditemukan" };

    const { data: existing, error: getError } = hasServiceRoleKey()
      ? await getSupabaseAdmin().auth.admin.getUserById(id)
      : { data: { user: null }, error: null };

    if (hasServiceRoleKey() && (getError || !existing.user)) {
      return { ok: false, error: "Pengguna tidak ditemukan" };
    }

    const current = await getProfile(id);
    const superCount = await countSuperAdmins();
    const currentRole = current?.role ?? "teknisi";

    if (
      id === manager.id &&
      currentRole === "super_admin" &&
      role !== "super_admin" &&
      superCount <= 1
    ) {
      return { ok: false, error: "Tidak bisa menurunkan Super Admin terakhir" };
    }

    const meta = existing.user?.user_metadata ?? {};
    const name =
      current?.name ||
      (typeof meta.name === "string" && meta.name.trim()) ||
      existing.user?.email?.split("@")[0] ||
      manager.name ||
      "Pengguna";

    await upsertProfile({ id, name, role });
    revalidatePath("/pengguna");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error, "Gagal mengubah peran"),
    };
  }
}

export async function createWorkspaceUser(
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (!hasServiceRoleKey()) {
      return {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY belum valid. Isi secret key lalu restart npm run dev.",
      };
    }

    await requireManager();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = parseRoleValue(formData.get("role"));

    if (!name || !email || password.length < 6) {
      return {
        ok: false,
        error: "Nama, email, dan password minimal 6 karakter wajib diisi",
      };
    }

    const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message ?? "Gagal membuat akun Authentication",
      };
    }

    try {
      await upsertProfile({ id: data.user.id, name, role });
    } catch (profileError) {
      return {
        ok: false,
        error: `Akun Auth terbuat, tetapi profil gagal disimpan: ${toErrorMessage(profileError, "error profil")}`,
      };
    }

    revalidatePath("/pengguna");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: toErrorMessage(error, "Gagal menambah pengguna"),
    };
  }
}
