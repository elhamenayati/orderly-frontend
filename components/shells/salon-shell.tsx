"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SalonSidebar } from "@/components/shells/salon-sidebar";
import { SalonTopHeader } from "@/components/shells/salon-top-header";

export function SalonShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = !pathname.startsWith("/salon/login");

  if (!showNav) {
    return (
      <div data-shell="salon" className="min-h-dvh bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div
      data-shell="salon"
      className="flex h-dvh overflow-hidden bg-background text-foreground"
    >
      <SalonSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <SalonTopHeader pathname={pathname} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
