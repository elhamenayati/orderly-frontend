import type { ReactNode } from "react";

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div data-shell="customer" className="min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}
