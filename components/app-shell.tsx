"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/lib/types";

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "psb":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      );
    case "pelanggan":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "pengguna":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "keuangan":
      return (
        <svg {...common}>
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      );
  }
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

function pageTitle(pathname: string) {
  const hit = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return hit?.label ?? "Workspace";
}

export function AppShell({
  children,
  userName,
  role,
  canViewFinance,
  canManageUsers,
}: {
  children: React.ReactNode;
  userName?: string | null;
  role: Role;
  canViewFinance: boolean;
  canManageUsers: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const navItems = NAV_ITEMS.filter(
    (item) =>
      (!item.finance || canViewFinance) && (!item.users || canManageUsers),
  );

  useEffect(() => {
    setMenuOpen(false);
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    for (const item of navItems) {
      router.prefetch(item.href);
    }
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefetch when drawer opens
  }, [menuOpen, router]);

  function onNavClick(href: string) {
    setMenuOpen(false);
    if (pathname !== href && !pathname.startsWith(`${href}/`)) {
      setNavigating(true);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 app-grid" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside
          className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] p-5 lg:flex"
          style={{ background: "var(--sidebar-bg)" }}
        >
          <div className="sidebar-brand mb-8">
            <div className="flex items-start gap-3">
              <span className="brand-mark shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-saganet.jpg" alt="SaGa-Net" />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-[var(--text)]">
                  {APP_NAME}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                  Manajemen WiFi, PSB & keuangan
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onNavClick(item.href)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "nav-active"
                      : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <ThemeToggle />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-3">
              <p className="text-xs text-[var(--muted)]">Masuk sebagai</p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">
                {userName ?? "Pengguna"}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--brand)]">
                {ROLE_LABELS[role]}
              </p>
              <div className="mt-3">
                <SignOutButton />
              </div>
            </div>
          </div>
        </aside>

        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{ background: "var(--main-bg)" }}
        >
          <header
            className="sticky top-0 z-30 border-b border-[var(--border)] px-4 py-3 sm:px-6 lg:px-8"
            style={{
              background: "var(--header-bg)",
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            }}
          >
            {navigating ? (
              <div
                className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
                aria-hidden
              >
                <div className="h-full w-1/3 animate-pulse bg-[var(--brand)]" />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
                <button
                  type="button"
                  className="btn btn-ghost shrink-0 px-2.5"
                  aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <MenuIcon open={menuOpen} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                    SaGa-Net
                  </p>
                  <h1 className="truncate text-base font-bold text-[var(--text)]">
                    {pageTitle(pathname)}
                  </h1>
                </div>
              </div>

              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm text-[var(--muted)]">
                  Operasional jaringan & rekap keuangan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <div className="badge shrink-0">{ROLE_LABELS[role]}</div>
              </div>
            </div>
          </header>

          {menuOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label="Tutup menu"
                onClick={() => setMenuOpen(false)}
              />
              <div
                className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-[var(--border)] shadow-xl"
                style={{
                  background: "var(--sidebar-bg)",
                  paddingTop: "max(0.75rem, env(safe-area-inset-top))",
                  paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
                }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="brand-mark brand-mark-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo-saganet.jpg" alt="SaGa-Net" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--text)]">
                        {APP_NAME}
                      </p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {userName ?? "Pengguna"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost shrink-0 px-2.5"
                    aria-label="Tutup menu"
                    onClick={() => setMenuOpen(false)}
                  >
                    <MenuIcon open />
                  </button>
                </div>

                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                  {navItems.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onNavClick(item.href)}
                        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                          active
                            ? "nav-active"
                            : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                        }`}
                      >
                        <NavIcon name={item.icon} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="space-y-3 border-t border-[var(--border)] p-4">
                  <ThemeToggle />
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                    <p className="text-xs text-[var(--muted)]">Masuk sebagai</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[var(--text)]">
                      {userName ?? "Pengguna"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--brand)]">
                      {ROLE_LABELS[role]}
                    </p>
                    <div className="mt-3">
                      <SignOutButton />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <main
            className={`mx-auto w-full max-w-6xl flex-1 px-4 py-4 transition-opacity sm:px-6 sm:py-6 lg:px-8 lg:py-7 ${
              navigating ? "opacity-60" : "opacity-100"
            }`}
            style={{
              paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
