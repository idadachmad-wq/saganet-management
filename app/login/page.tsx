"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Email atau password salah, atau URL/anon key Supabase tidak cocok."
          : "Login gagal. Cek .env (URL dan anon key harus dari project yang sama).",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 app-grid" />
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[var(--border)] shadow-[var(--shadow)]">
        <div className="brand-banner relative p-6 md:p-8">
          <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.2em]">
            SaGa-Net
          </p>
          <h1 className="relative z-[1] mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {APP_NAME}
          </h1>
          <p className="banner-sub relative z-[1] mt-2 text-sm leading-relaxed md:text-base">
            Masuk untuk mengelola dashboard, PSB, keuangan, dan bagi hasil ISP.
          </p>
        </div>

        <div className="bg-[var(--surface)] p-6 md:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                Login memakai Supabase Authentication. Peran diambil dari tabel
                profiles (super_admin, admin, teknisi).
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Masuk..." : "Masuk Workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
