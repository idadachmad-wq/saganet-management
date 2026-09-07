import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { parseRole, permissionsFor } from "@/lib/rbac";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Auth.js config error (mis. AUTH_SECRET kosong) → jangan anggap login
  const authPayload = req.auth as
    | { user?: { id?: string; role?: string }; message?: string }
    | null
    | undefined;
  if (authPayload && typeof authPayload.message === "string") {
    if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Configuration");
    return NextResponse.redirect(url);
  }

  const user = authPayload?.user;
  const isLoggedIn = !!(user?.id && user.role);

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/manifest");

  if (!isLoggedIn && !isPublic && pathname !== "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && user) {
    const perms = permissionsFor(parseRole(user.role));
    const isFinanceRoute =
      pathname.startsWith("/keuangan") || pathname.startsWith("/bagi-hasil");
    if (isFinanceRoute && !perms.canViewFinance) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/pengguna") && !perms.canManageUsers) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
