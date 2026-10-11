"use client";

import type { TabId } from "@/lib/salon/public-data";
import { salon, salonMapUrl, salonPhoneHref } from "@/lib/salon/public-data";
import { Clock, MapPin, Phone, Share2 } from "lucide-react";

type QuickActionsProps = {
  onTabChange: (tab: TabId) => void;
};

export function QuickActions({ onTabChange }: QuickActionsProps) {
  async function shareSalon() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: salon.brandName,
        text: salon.description,
        url: window.location.href,
      });
    } catch {
      // User cancelled share.
    }
  }

  const itemClassName = "flex flex-col items-center gap-2";
  const iconClassName =
    "flex size-12 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm";

  return (
    <div className="grid grid-cols-4 gap-3 px-4 md:hidden">
      <button type="button" onClick={shareSalon} className={itemClassName}>
        <span className={iconClassName}>
          <Share2 className="size-5" />
        </span>
        <span className="text-xs text-muted-foreground">اشتراک</span>
      </button>
      <button
        type="button"
        onClick={() => onTabChange("about")}
        className={itemClassName}
      >
        <span className={iconClassName}>
          <Clock className="size-5" />
        </span>
        <span className="text-xs text-muted-foreground">ساعت کاری</span>
      </button>
      <a
        href={salonMapUrl()}
        target="_blank"
        rel="noreferrer"
        className={itemClassName}
      >
        <span className={iconClassName}>
          <MapPin className="size-5" />
        </span>
        <span className="text-xs text-muted-foreground">مسیر</span>
      </a>
      <a href={salonPhoneHref(salon.mobile)} className={itemClassName}>
        <span className={iconClassName}>
          <Phone className="size-5" />
        </span>
        <span className="text-xs text-muted-foreground">تماس</span>
      </a>
    </div>
  );
}
