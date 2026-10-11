"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
} from "lucide-react";
import { formatFaNumber } from "@/lib/format/number";
import { cn } from "@/lib/utils";

const DEMO_UNREAD_NOTIFICATIONS = 2;

function HeaderIconButton({
  label,
  children,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -top-0.5 -end-0.5 flex min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold leading-4 text-white">
          {formatFaNumber(badge)}
        </span>
      ) : null}
    </button>
  );
}

export function AdminHeaderToolbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function logout() {
    sessionStorage.removeItem("mahoura:adminAuth");
    router.push("/admin/login");
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <HeaderIconButton label="راهنما">
        <CircleHelp className="size-[18px]" />
      </HeaderIconButton>
      <HeaderIconButton label="اعلان‌ها" badge={DEMO_UNREAD_NOTIFICATIONS}>
        <Bell className="size-[18px]" />
      </HeaderIconButton>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 transition hover:bg-muted/60"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            م
          </span>
          <span className="hidden text-sm font-medium md:block">مدیر پلتفرم</span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition",
              open && "rotate-180",
            )}
          />
        </button>
        {open ? (
          <div
            className="absolute top-[calc(100%+0.5rem)] z-50 min-w-44 rounded-xl border border-border bg-card py-1 shadow-md"
            style={{ insetInlineEnd: 0 }}
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold">مدیر پلتفرم</p>
              <p className="text-xs text-muted-foreground">Platform Admin</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive transition hover:bg-destructive/5"
            >
              <LogOut className="size-4" />
              خروج
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
