import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;
let cachedUrl = "";
let cachedKey = "";

export function isServiceRoleKey(key?: string | null) {
  const value = key?.trim() ?? "";
  if (!value) return false;

  // Format baru Supabase (API Keys): sb_secret_...
  if (value.startsWith("sb_secret_")) return true;

  // Format JWT lama: role claim = service_role
  if (!value.startsWith("eyJ")) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(value.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { role?: string };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function hasServiceRoleKey() {
  return isServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key || !isServiceRoleKey(key)) {
    throw new Error(
      "Isi SUPABASE_SERVICE_ROLE_KEY dengan secret key (sb_secret_... atau JWT service_role) dari Supabase Settings → API Keys. Jangan pakai anon/publishable.",
    );
  }

  if (!admin || cachedUrl !== url || cachedKey !== key) {
    cachedUrl = url;
    cachedKey = key;
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return admin;
}
