"use client";

import { signOut, useSession } from "next-auth/react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-card border-b border-card-border flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">{session?.user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
