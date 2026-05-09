"use client";

import { signOut, useSession } from "next-auth/react";

export function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: session } = useSession();

  return (
    <header className="h-14 sm:h-16 bg-card border-b border-card-border flex items-center justify-between px-4 sm:px-6">
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-gray-400 hover:text-white p-1.5 -ml-1"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-xs sm:text-sm text-muted hidden sm:inline">{session?.user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
