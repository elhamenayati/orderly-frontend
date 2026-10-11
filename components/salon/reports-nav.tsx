"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/salon/settlements", label: "رکورد مالی آرایشگران" },
  { href: "/salon/reports/financial-position", label: "وضعیت مالی" },
  { href: "/salon/reports/transactions", label: "تراکنش‌ها" },
];

export function SalonReportsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-xl border px-3 py-1.5 text-sm transition",
            pathname === item.href || pathname.startsWith(`${item.href}/`)
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
