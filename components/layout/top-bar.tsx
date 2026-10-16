"use client";

import type { TabId } from "@/lib/salon/public-data";
import { customerTabs, salon, salonPhoneHref } from "@/lib/salon/public-data";
import { BookButton } from "@/components/customer/book-button";
import { AbrinakLogo } from "@/components/icons/abrinak-logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TopBarProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-14 items-center px-4 lg:hidden">
        <AbrinakLogo className="h-[3.4rem] shrink-0" />
        <p className="min-w-0 flex-1 truncate px-3 text-center text-base font-semibold">
          {salon.brandName}
        </p>
        <MobileMenu activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="mx-auto hidden h-16 max-w-6xl items-center justify-between gap-3 px-6 lg:flex">
        <div className="flex min-w-0 items-center gap-2">
          <AbrinakLogo className="h-[3.825rem] shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{salon.brandName}</p>
            <p className="text-xs text-muted-foreground">سالن زیبایی</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {customerTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                activeTab === tab.id
                  ? "bg-rose-soft font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground"
            aria-label="اشتراک‌گذاری"
          >
            <Share2 className="size-4" />
          </Button>
          <a
            href={salonPhoneHref(salon.mobile)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="تماس"
          >
            <Phone className="size-4" />
          </a>
          <BookButton className="h-10 px-4" />
        </div>
      </div>
    </header>
  );
}
