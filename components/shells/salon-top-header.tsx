"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Home } from "lucide-react";
import { AbrinakLogo } from "@/components/icons/abrinak-logo";
import { SalonHeaderToolbar } from "@/components/shells/salon-header-toolbar";

function SalonHeaderFrame({
  breadcrumbs,
  showMobileLogo = false,
}: {
  breadcrumbs?: ReactNode;
  showMobileLogo?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="min-w-0 flex-1">{breadcrumbs}</div>
      <div className="flex shrink-0 items-center gap-2">
        <SalonHeaderToolbar />
        {showMobileLogo ? (
          <AbrinakLogo className="h-12 shrink-0 opacity-90 lg:hidden" />
        ) : null}
      </div>
    </header>
  );
}

function BreadcrumbText({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center text-sm text-muted-foreground">{children}</p>
  );
}

function BreadcrumbSeparator() {
  return <span className="mx-2 text-muted-foreground">/</span>;
}

function HomeBreadcrumb() {
  return (
    <Link
      href="/salon/bookings"
      className="inline-flex items-center transition hover:text-primary"
      aria-label="خانه"
      title="خانه"
    >
      <Home className="size-4" />
    </Link>
  );
}

export function SalonTopHeader({ pathname }: { pathname: string }) {
  if (pathname === "/salon/dashboard") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <span className="text-foreground">داشبورد</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/bookings") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <span className="text-foreground">رزروها</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/bookings/new") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <Link href="/salon/bookings" className="transition hover:text-primary">
              رزروها
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">رزرو جدید</span>
          </BreadcrumbText>
        }
      />
    );
  }

  const checkoutMatch = pathname.match(/^\/salon\/bookings\/([^/]+)\/checkout$/);
  if (checkoutMatch) {
    const bookingId = checkoutMatch[1];
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <Link href="/salon/bookings" className="transition hover:text-primary">
              رزروها
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/salon/bookings/${bookingId}`}
              className="transition hover:text-primary"
            >
              جزئیات رزرو
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">تسویه</span>
          </BreadcrumbText>
        }
      />
    );
  }

  const editMatch = pathname.match(/^\/salon\/bookings\/([^/]+)\/edit$/);
  if (editMatch) {
    const bookingId = editMatch[1];
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <Link href="/salon/bookings" className="transition hover:text-primary">
              رزروها
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/salon/bookings/${bookingId}`}
              className="transition hover:text-primary"
            >
              جزئیات رزرو
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">ویرایش رزرو</span>
          </BreadcrumbText>
        }
      />
    );
  }

  const bookingDetailMatch = pathname.match(/^\/salon\/bookings\/([^/]+)$/);
  if (bookingDetailMatch) {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <Link href="/salon/bookings" className="transition hover:text-primary">
              رزروها
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">جزئیات رزرو</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/settings") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <span>تنظیمات</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">تنظیمات سالن</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/services") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <span className="text-foreground">خدمات</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/stylists") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <span className="text-foreground">آرایشگران</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/stylists/new") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <Link href="/salon/stylists" className="transition hover:text-primary">
              آرایشگران
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">افزودن آرایشگر</span>
          </BreadcrumbText>
        }
      />
    );
  }

  const stylistDetailMatch = pathname.match(/^\/salon\/stylists\/([^/]+)$/);
  if (stylistDetailMatch) {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <Link href="/salon/stylists" className="transition hover:text-primary">
              آرایشگران
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">جزئیات آرایشگر</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/customers") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <span className="text-foreground">مشتریان</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/performance") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <span>گزارش‌ها</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">گزارش کارکرد آرایشگران</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/settlements") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <span>گزارش‌ها</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">رکورد مالی آرایشگران</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/reports/sales") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <span>گزارش‌ها</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">گزارش فروش سالن</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/reports/financial-position") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <span>گزارش‌ها</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">وضعیت مالی سالن</span>
          </BreadcrumbText>
        }
      />
    );
  }

  if (pathname === "/salon/reports/transactions") {
    return (
      <SalonHeaderFrame
        showMobileLogo
        breadcrumbs={
          <BreadcrumbText>
            <span>گزارش‌ها</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">تراکنش‌های مالی</span>
          </BreadcrumbText>
        }
      />
    );
  }

  return <SalonHeaderFrame showMobileLogo />;
}
