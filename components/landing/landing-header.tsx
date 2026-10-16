"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AbrinakLogo } from "@/components/icons/abrinak-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_SHELL } from "@/lib/landing/shell";

const NAV_LINKS = [
  { href: "#features", label: "امکانات" },
  { href: "#workflow", label: "نحوه کار" },
  { href: "#blog", label: "وبلاگ" },
  { href: "#contact", label: "تماس با ما" },
] as const;

const HEADER_BTN =
  "h-10 min-w-[7.5rem] rounded-lg px-3.5 text-[13px] font-medium";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-transparent pt-3 sm:pt-4">
      <div
        className={cn(
          LANDING_SHELL,
          "rounded-xl border border-white/50 bg-white/50 shadow-none backdrop-blur-md transition-colors",
          scrolled && "bg-white/75",
        )}
      >
        <div className="relative flex h-[60px] items-center justify-between gap-4 px-4 sm:px-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="Abrinak">
            <AbrinakLogo
              priority
              className="!h-auto w-[118px] object-contain"
            />
          </Link>

          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
            aria-label="منوی اصلی"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13.5px] font-medium text-[#0d0530]/85 transition hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div dir="ltr" className="hidden items-center gap-2.5 sm:flex">
            <Button
              render={<a href="#demo" />}
              nativeButton={false}
              className={HEADER_BTN}
            >
              درخواست دمو
            </Button>
            <Button
              render={<Link href="/salon/login" />}
              nativeButton={false}
              variant="outline"
              className={cn(
                HEADER_BTN,
                "border-primary bg-white text-primary hover:bg-primary/5 hover:text-primary",
              )}
            >
              ورود به پنل
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border lg:hidden"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-border/50 px-4 pb-4 pt-3 sm:px-5 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="منوی موبایل">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  render={<a href="#demo" />}
                  nativeButton={false}
                  className={cn(HEADER_BTN, "w-full")}
                  onClick={() => setOpen(false)}
                >
                  درخواست دمو
                </Button>
                <Button
                  render={<Link href="/salon/login" />}
                  nativeButton={false}
                  variant="outline"
                  className={cn(
                    HEADER_BTN,
                    "w-full border-primary text-primary",
                  )}
                >
                  ورود به پنل
                </Button>
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
