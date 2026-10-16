"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSalonSession, readSalonSessionUser } from "@/lib/salon/auth";
import { fetchSalonSettings } from "@/lib/salon/settings";
import {
  isCorruptedDisplayText,
  resolveSalonHeaderName,
  resolveSalonHeaderRole,
} from "@/lib/salon/session-display";
import { formatFaNumber } from "@/lib/format/number";
import { cn } from "@/lib/utils";

const DEMO_UNREAD_NOTIFICATIONS = 3;

function UserAvatar({
  name,
  avatarPath,
  className,
}: {
  name: string;
  avatarPath?: string;
  className?: string;
}) {
  return (
    <Image
      src={avatarPath || "/images/salon/default-avatar.png"}
      alt={name}
      width={44}
      height={44}
      className={cn(
        "size-10 shrink-0 rounded-full bg-white object-cover p-0.5",
        className,
      )}
    />
  );
}

function HeaderIconButton({
  label,
  children,
  badge,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -top-0.5 -end-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
          {formatFaNumber(badge)}
        </span>
      ) : null}
    </button>
  );
}

function AccountDropdown({
  open,
  salonName,
  role,
  onClose,
}: {
  open: boolean;
  salonName: string;
  role: string;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!open) return null;

  function logout() {
    clearSalonSession();
    onClose();
    router.push("/salon/login");
  }

  return (
    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-48 translate-x-3 rounded-xl border border-border bg-card py-1 shadow-md">
      <div dir="rtl">
        <div className="border-b border-border px-3 py-2.5 text-right">
          <p className="text-sm font-semibold">{salonName}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <Link
          href="/salon/settings"
          onClick={onClose}
          className="flex items-center justify-start gap-2 px-3 py-2.5 text-right text-sm transition hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
        >
          <Settings className="size-4 shrink-0 text-muted-foreground" />
          تنظیمات سالن
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-start gap-2 px-3 py-2.5 text-right text-sm text-destructive transition hover:bg-destructive/5 focus-visible:bg-destructive/5 focus-visible:outline-none"
        >
          <LogOut className="size-4 shrink-0" />
          خروج
        </button>
      </div>
    </div>
  );
}

export function SalonAccountMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof readSalonSessionUser>>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refreshUser() {
      setUser(readSalonSessionUser());
    }

    refreshUser();

    const current = readSalonSessionUser();
    if (
      !current?.salonBrandName ||
      isCorruptedDisplayText(current.salonBrandName)
    ) {
      void fetchSalonSettings()
        .then(() => refreshUser())
        .catch(() => {
          /* settings fetch optional for header label */
        });
    }

    window.addEventListener("salon-profile-updated", refreshUser);
    return () => {
      window.removeEventListener("salon-profile-updated", refreshUser);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const salonName = resolveSalonHeaderName(user?.salonBrandName);
  const role = resolveSalonHeaderRole(user?.role);
  const avatarPath = user?.avatarPath;

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <UserAvatar name={salonName} avatarPath={avatarPath} />
        <span className="hidden min-w-0 text-start md:block">
          <span className="block truncate text-sm font-semibold leading-5">
            {salonName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {role}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition",
            open && "rotate-180",
          )}
        />
      </button>
      <AccountDropdown
        open={open}
        onClose={() => setOpen(false)}
        salonName={salonName}
        role={role}
      />
    </div>
  );
}

function QuickCreateBookingButton() {
  const pathname = usePathname();
  const isBookingForm =
    pathname === "/salon/bookings/new" ||
    pathname.match(/^\/salon\/bookings\/[^/]+\/edit$/);

  if (isBookingForm) return null;

  return (
    <Button
      render={<Link href="/salon/bookings/new" />}
      nativeButton={false}
      variant="outline"
      className="shrink-0 gap-1.5 border-[#0D0530] bg-white text-[#0D0530] hover:bg-[#0D0530]/5"
      title="رزرو جدید"
    >
      <Plus className="size-4" />
      رزرو جدید
    </Button>
  );
}

export function SalonHeaderToolbar() {
  return (
    <div
      dir="ltr"
      className="flex shrink-0 items-center gap-1 sm:gap-2"
    >
      <SalonAccountMenu />
      <div aria-hidden className="mx-1 hidden h-8 w-px bg-border sm:block" />
      <HeaderIconButton label="اعلان‌ها" badge={DEMO_UNREAD_NOTIFICATIONS}>
        <Bell className="size-[18px]" />
      </HeaderIconButton>
      <HeaderIconButton label="پیام‌ها">
        <MessageCircle className="size-[18px]" />
      </HeaderIconButton>
      <HeaderIconButton label="راهنما">
        <CircleHelp className="size-[18px]" />
      </HeaderIconButton>
      <QuickCreateBookingButton />
    </div>
  );
}
