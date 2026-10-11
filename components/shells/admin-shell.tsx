"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Store,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { AdminHeaderToolbar } from "@/components/shells/admin-header-toolbar";
import { cn } from "@/lib/utils";

type NavItem = {
  href?: string;
  label: string;
  icon: ReactNode;
  match?: string;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "داشبورد",
    icon: <LayoutDashboard className="size-4" />,
    match: "/admin/dashboard",
    disabled: true,
  },
  {
    href: "/admin/salons",
    label: "سالن‌ها",
    icon: <Store className="size-4" />,
    match: "/admin/salons",
  },
  {
    label: "مدیران سالن‌ها",
    icon: <UserCog className="size-4" />,
    disabled: true,
  },
  {
    label: "کارکنان‌ها",
    icon: <Users className="size-4" />,
    disabled: true,
  },
  {
    label: "اشتراک‌ها",
    icon: <CreditCard className="size-4" />,
    disabled: true,
  },
  {
    label: "درگاه‌ها",
    icon: <Wallet className="size-4" />,
    disabled: true,
  },
  {
    label: "گزارش‌ها",
    icon: <BarChart3 className="size-4" />,
    disabled: true,
  },
  {
    label: "تیکت‌ها",
    icon: <Headphones className="size-4" />,
    disabled: true,
  },
  {
    label: "تنظیمات",
    icon: <Settings className="size-4" />,
    disabled: true,
  },
  {
    label: "کاربران پلتفرم",
    icon: <Users className="size-4" />,
    disabled: true,
  },
  {
    label: "نقش‌ها و دسترسی‌ها",
    icon: <Shield className="size-4" />,
    disabled: true,
  },
];

function isActive(pathname: string, match?: string) {
  if (!match) return false;
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showNav = !pathname.startsWith("/admin/login");
  const [collapsed, setCollapsed] = useState(false);

  if (!showNav) {
    return (
      <div data-shell="admin" className="min-h-dvh bg-background text-foreground">
        {children}
      </div>
    );
  }

  function logout() {
    sessionStorage.removeItem("mahoura:adminAuth");
    router.push("/admin/login");
  }

  return (
    <div
      data-shell="admin"
      className="flex min-h-dvh bg-background text-foreground"
    >
      <aside
        className={cn(
          "flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width]",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
            <Shield className="size-4" />
          </span>
          {!collapsed ? (
            <p className="text-sm font-semibold leading-5">پنل مدیریت پلتفرم</p>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = isActive(pathname, item.match);
            const className = cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              active
                ? "bg-teal-600 text-white"
                : "text-sidebar-foreground/85 hover:bg-white/10",
              item.disabled && !active && "opacity-60",
            );

            if (item.href && !item.disabled) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  {item.icon}
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            }

            return (
              <span
                key={item.label}
                className={cn(className, "cursor-default")}
                aria-disabled
              >
                {item.icon}
                {!collapsed ? <span>{item.label}</span> : null}
              </span>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/70 transition hover:bg-white/10"
            aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
          >
            {collapsed ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                  م
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">مدیر پلتفرم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
              >
                <LogOut className="size-4" />
                خروج
              </button>
            </>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-border bg-card px-6 py-3">
          <AdminHeaderToolbar />
        </header>
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
