"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ROLES, ROLE_HINTS, ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/lib/types";
import {
  createWorkspaceUser,
  updateUserPassword,
  updateUserRole,
  type WorkspaceUser,
} from "./actions";

function rolePillClass(role: Role) {
  if (role === "super_admin") return "role-pill role-pill-super";
  if (role === "admin") return "role-pill role-pill-admin";
  return "role-pill role-pill-teknisi";
}

function formatWhen(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

export function PenggunaClient({
  users,
  currentUserId,
  serviceConfigured,
}: {
  users: WorkspaceUser[];
  currentUserId: string;
  serviceConfigured: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [passwordUser, setPasswordUser] = useState<WorkspaceUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [pending, startTransition] = useTransition();
  const superCount = users.filter((u) => u.role === "super_admin").length;

  function changeRole(userId: string, role: string) {
    const fd = new FormData();
    fd.set("id", userId);
    fd.set("role", role);
    setError("");
    setOkMsg("");
    startTransition(async () => {
      const result = await updateUserRole(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function copyText(label: string, value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(`${id}:${label}`);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Gagal menyalin ke clipboard");
    }
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {!serviceConfigured ? (
        <div className="panel p-5">
          <h3 className="font-semibold text-[var(--text)]">
            Kunci service_role belum diisi
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Untuk melihat semua akun Authentication dan menambah user dari app,
            isi <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            di <code className="font-mono text-xs">.env</code> dengan secret key
            dari Supabase → Settings → API Keys (
            <span className="font-semibold">sb_secret_...</span> atau JWT{" "}
            <span className="font-semibold">service_role</span>), bukan
            publishable/anon. Restart{" "}
            <code className="font-mono text-xs">npm run dev</code>.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--muted)]">
        Password asli tidak bisa ditampilkan lagi (tersimpan terenkripsi di
        Supabase). Super Admin bisa melihat email akun dan{" "}
        <span className="font-semibold text-[var(--text)]">menyetel password baru</span>.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {users.length} akun · peran terikat ke UID · berlaku setelah login
          ulang
        </p>
        {serviceConfigured ? (
          <button
            className="btn btn-primary w-full sm:w-auto"
            type="button"
            onClick={() => {
              setError("");
              setOkMsg("");
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Tutup Form" : "Tambah Pengguna"}
          </button>
        ) : null}
      </div>

      {showForm && serviceConfigured ? (
        <form
          className="panel space-y-4 p-4 md:p-6"
          action={(fd) => {
            setError("");
            setOkMsg("");
            startTransition(async () => {
              const result = await createWorkspaceUser(fd);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setShowForm(false);
              setOkMsg("Pengguna berhasil dibuat. Catat password sekarang.");
              router.refresh();
            });
          }}
        >
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Tambah Pengguna
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="user-name">
                Nama
              </label>
              <input
                id="user-name"
                className="input"
                name="name"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label" htmlFor="user-email">
                Email
              </label>
              <input
                id="user-email"
                className="input"
                name="email"
                type="email"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label" htmlFor="user-password">
                Password
              </label>
              <input
                id="user-password"
                className="input"
                name="password"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label" htmlFor="user-role">
                Hak akses
              </label>
              <select
                id="user-role"
                className="input"
                name="role"
                defaultValue="teknisi"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => setShowForm(false)}
            >
              Batal
            </button>
            <button
              className="btn btn-primary w-full sm:w-auto"
              disabled={pending}
            >
              {pending ? "Menyimpan..." : "Simpan Pengguna"}
            </button>
          </div>
        </form>
      ) : null}

      {passwordUser && serviceConfigured ? (
        <form
          className="panel space-y-4 p-4 md:p-6"
          action={(fd) => {
            setError("");
            setOkMsg("");
            startTransition(async () => {
              const result = await updateUserPassword(fd);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setPasswordUser(null);
              setShowPassword(false);
              setOkMsg(`Password ${passwordUser.email} berhasil diubah.`);
              router.refresh();
            });
          }}
        >
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Ubah password
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {passwordUser.name} · {passwordUser.email}
          </p>
          <input type="hidden" name="id" value={passwordUser.id} />
          <div>
            <label className="label" htmlFor="new-password">
              Password baru
            </label>
            <div className="flex gap-2">
              <input
                id="new-password"
                className="input"
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={6}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="btn btn-ghost shrink-0"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Sembunyi" : "Lihat"}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto"
              onClick={() => {
                setPasswordUser(null);
                setShowPassword(false);
              }}
            >
              Batal
            </button>
            <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </form>
      ) : null}

      {okMsg ? (
        <p className="text-sm font-medium text-[var(--brand)]">{okMsg}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <span
            key={role}
            className={rolePillClass(role)}
            title={ROLE_HINTS[role]}
          >
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      {users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Belum ada pengguna yang terdaftar.
        </p>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {users.map((user) => {
              const lockSelf =
                user.id === currentUserId &&
                user.role === "super_admin" &&
                superCount <= 1;
              return (
                <article key={user.id} className="panel space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--text)]">
                        {user.name}
                      </h3>
                      <p className="mt-1 break-all text-sm text-[var(--text)]">
                        {user.email || "—"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Login terakhir: {formatWhen(user.lastSignInAt)}
                      </p>
                    </div>
                    <span className={rolePillClass(user.role)}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.email ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => copyText("email", user.email, user.id)}
                      >
                        {copiedId === `${user.id}:email`
                          ? "Tersalin"
                          : "Salin email"}
                      </button>
                    ) : null}
                    {serviceConfigured ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setError("");
                          setOkMsg("");
                          setPasswordUser(user);
                          setShowForm(false);
                        }}
                      >
                        Ubah password
                      </button>
                    ) : null}
                  </div>
                  <label className="label">Hak akses</label>
                  <select
                    className="input"
                    key={`${user.id}-${user.role}`}
                    defaultValue={user.role}
                    disabled={pending || lockSelf}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </article>
              );
            })}
          </div>

          <div className="panel hidden overflow-hidden lg:block">
            <div className="table-scroll">
              <table className="min-w-[1080px] w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Email / akun</th>
                    <th className="px-4 py-3 font-medium">Login terakhir</th>
                    <th className="px-4 py-3 font-medium">Hak akses</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const lockSelf =
                      user.id === currentUserId &&
                      user.role === "super_admin" &&
                      superCount <= 1;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-[var(--border)]/70"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--text)]">
                            {user.name}
                          </div>
                          {user.id === currentUserId ? (
                            <div className="text-xs text-[var(--muted)]">
                              Akun Anda
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--text)]">
                            {user.email || "—"}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">
                            {user.id.slice(0, 8)}…
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {formatWhen(user.lastSignInAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={rolePillClass(user.role)}>
                              {ROLE_LABELS[user.role]}
                            </span>
                            <select
                              className="input max-w-[180px]"
                              key={`${user.id}-${user.role}`}
                              defaultValue={user.role}
                              disabled={pending || lockSelf}
                              onChange={(e) =>
                                changeRole(user.id, e.target.value)
                              }
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {user.email ? (
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() =>
                                  copyText("email", user.email, user.id)
                                }
                              >
                                {copiedId === `${user.id}:email`
                                  ? "Tersalin"
                                  : "Salin email"}
                              </button>
                            ) : null}
                            {serviceConfigured ? (
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                  setError("");
                                  setOkMsg("");
                                  setPasswordUser(user);
                                  setShowForm(false);
                                }}
                              >
                                Ubah password
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!showForm && !passwordUser && error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
