"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileBarChart,
  Grid2x2,
  Home,
  LogOut,
  Scissors,
  Settings,
  Users,
} from "lucide-react";
import { AbrinakLogo } from "@/components/icons/abrinak-logo";
import { cn } from "@/lib/utils";

const SIDEBAR_MOTTO = "نرم افزار مدیریت سالن";

type NavLinkItem = {
  type: "link";
  href: string;
  label: string;
  match: string;
  icon: ReactNode;
  disabled?: boolean;
};

type NavGroupItem = {
  type: "group";
  label: string;
  match: string;
  icon: ReactNode;
  children: { href: string; label: string; match: string }[];
};

type NavItem = NavLinkItem | NavGroupItem;

const navItems: NavItem[] = [
  {
    type: "link",
    href: "/salon/dashboard",
    label: "داشبورد",
    match: "/salon/dashboard",
    icon: <Home className="size-5" />,
    disabled: true,
  },
  {
    type: "link",
    href: "/salon/bookings",
    label: "رزروها",
    match: "/salon/bookings",
    icon: <CalendarDays className="size-5" />,
  },
  {
    type: "link",
    href: "/salon/customers",
    label: "مشتریان",
    match: "/salon/customers",
    icon: <Users className="size-5" />,
  },
  {
    type: "link",
    href: "/salon/stylists",
    label: "آرایشگران",
    match: "/salon/stylists",
    icon: <Scissors className="size-5" />,
  },
  {
    type: "link",
    href: "/salon/services",
    label: "خدمات",
    match: "/salon/services",
    icon: <Grid2x2 className="size-5" />,
  },
  {
    type: "group",
    label: "گزارش‌ها",
    match: "/salon/reports",
    icon: <FileBarChart className="size-5" />,
    children: [
      {
        href: "/salon/settlements",
        label: "وضعیت مالی آرایشگر / رکورد مالی",
        match: "/salon/settlements",
      },
      {
        href: "/salon/reports/financial-position",
        label: "وضعیت مالی سالن",
        match: "/salon/reports/financial-position",
      },
      {
        href: "/salon/reports/transactions",
        label: "تراکنش‌های مالی",
        match: "/salon/reports/transactions",
      },
    ],
  },
  {
    type: "link",
    href: "/salon/subscription",
    label: "اشتراک",
    match: "/salon/subscription",
    icon: <CreditCard className="size-5" />,
  },
  {
    type: "link",
    href: "/salon/settings",
    label: "تنظیمات",
    match: "/salon/settings",
    icon: <Settings className="size-5" />,
  },
];

function isActive(pathname: string, match: string) {
  if (match === "/salon/bookings") {
    return pathname === "/salon/bookings" || pathname.startsWith("/salon/bookings/");
  }
  if (match === "/salon/settlements") {
    return pathname === "/salon/settlements" || pathname.startsWith("/salon/settlements/");
  }
  return pathname === match || pathname.startsWith(`${match}/`);
}

function isGroupActive(pathname: string, item: NavGroupItem) {
  if (item.match === "/salon/reports") {
    return (
      pathname.startsWith("/salon/reports") ||
      pathname === "/salon/performance" ||
      pathname.startsWith("/salon/performance/") ||
      pathname === "/salon/settlements" ||
      pathname.startsWith("/salon/settlements/")
    );
  }
  return item.children.some((child) => isActive(pathname, child.match));
}

const activeItemClass =
  "bg-gradient-to-l from-[#2a1878] to-[#15084b] text-white shadow-sm shadow-[#15084b]/20";

const inactiveItemClass =
  "text-sidebar-foreground/90 hover:bg-sidebar-accent/70 hover:text-white";

function NavLink({
  href,
  label,
  icon,
  active,
  collapsed,
  disabled = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  collapsed: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    "flex items-center rounded-xl text-sm font-medium transition",
    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
    active && !disabled ? activeItemClass : inactiveItemClass,
    disabled && "cursor-default opacity-60",
  );

  const content = (
    <>
      <span className="shrink-0 opacity-95">{icon}</span>
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1">{label}</span>
          {disabled ? (
            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/75">
              به زودی
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <span
        title={collapsed ? `${label} — به زودی` : undefined}
        className={className}
        aria-disabled
      >
        {content}
      </span>
    );
  }

  return (
    <Link href={href} title={collapsed ? label : undefined} className={className}>
      {content}
    </Link>
  );
}

function ReportsGroup({
  item,
  pathname,
  expanded,
  collapsed,
  onToggle,
  onExpandSidebar,
}: {
  item: NavGroupItem;
  pathname: string;
  expanded: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onExpandSidebar: () => void;
}) {
  const groupActive = isGroupActive(pathname, item);

  function handleToggle() {
    if (collapsed) {
      onExpandSidebar();
      onToggle();
      return;
    }
    onToggle();
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center rounded-xl text-sm font-medium transition",
          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
          groupActive && !expanded ? activeItemClass : inactiveItemClass,
          expanded && !collapsed && "bg-sidebar-accent/40 text-white",
        )}
      >
        <span className="shrink-0 opacity-95">{item.icon}</span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 text-start">{item.label}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 opacity-80 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </>
        ) : null}
      </button>

      {expanded && !collapsed ? (
        <div className="relative me-3 space-y-0.5 pe-3">
          <span
            aria-hidden
            className="absolute inset-y-1 end-0 w-px bg-sidebar-foreground/25"
          />
          {item.children.map((child) => {
            const active = isActive(pathname, child.match);
            return (
              <Link
                key={`${child.href}-${child.label}`}
                href={child.href}
                className={cn(
                  "block rounded-lg py-2 pe-2 ps-5 text-sm transition",
                  active
                    ? activeItemClass
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SalonSidebar() {
  const pathname = usePathname();
  const reportsItem = navItems.find(
    (item): item is NavGroupItem => item.type === "group",
  );
  const [collapsed, setCollapsed] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(() =>
    reportsItem ? isGroupActive(pathname, reportsItem) : false,
  );

  useEffect(() => {
    if (reportsItem && isGroupActive(pathname, reportsItem)) {
      setReportsExpanded(true);
    }
  }, [pathname, reportsItem]);

  useEffect(() => {
    if (collapsed) {
      setReportsExpanded(false);
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "flex h-dvh shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[4.75rem]" : "w-64",
      )}
    >
      <div className="shrink-0 border-b border-sidebar-border px-4 py-5">
        <Link
          href="/salon/bookings"
          className="flex flex-col items-center"
        >
          <AbrinakLogo
            inverse
            markOnly={collapsed}
            className={cn(
              collapsed ? "h-[3.4rem] w-[3.4rem] object-contain" : "h-[3.825rem]",
            )}
            priority
          />
          {!collapsed ? (
            <p className="mt-4 text-center text-sm font-medium text-sidebar-foreground/90">
              {SIDEBAR_MOTTO}
            </p>
          ) : null}
        </Link>
      </div>

      <nav className="modern-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            if (item.type === "group") {
              return (
                <ReportsGroup
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  expanded={reportsExpanded}
                  collapsed={collapsed}
                  onToggle={() => setReportsExpanded((value) => !value)}
                  onExpandSidebar={() => setCollapsed(false)}
                />
              );
            }

            return (
              <NavLink
                key={item.href + item.label}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(pathname, item.match)}
                collapsed={collapsed}
                disabled={item.disabled}
              />
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 space-y-1 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "باز کردن منو" : "جمع کردن منو"}
          className={cn(
            "flex w-full items-center rounded-xl text-sm font-medium transition",
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
            inactiveItemClass,
          )}
        >
          {collapsed ? (
            <ChevronLeft className="size-5 shrink-0" />
          ) : (
            <>
              <ChevronRight className="size-5 shrink-0" />
              <span>جمع کردن منو</span>
            </>
          )}
        </button>

        <Link
          href="/salon/login"
          title={collapsed ? "خروج" : undefined}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition",
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
            inactiveItemClass,
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed ? <span>خروج</span> : null}
        </Link>
      </div>
    </aside>
  );
}
