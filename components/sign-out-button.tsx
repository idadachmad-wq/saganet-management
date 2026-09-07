"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="btn btn-ghost w-full text-sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Keluar
    </button>
  );
}
