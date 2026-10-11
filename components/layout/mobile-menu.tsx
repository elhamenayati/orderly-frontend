"use client";

import { useState } from "react";
import type { TabId } from "@/lib/salon/public-data";
import { customerTabs, salon } from "@/lib/salon/public-data";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OrderlyLogo } from "@/components/icons/orderly-logo";
import { Menu } from "lucide-react";

type MobileMenuProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function MobileMenu({ activeTab, onTabChange }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            aria-label="منو"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <OrderlyLogo className="h-12" />
            {salon.brandName}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-3">
          {customerTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
                setOpen(false);
              }}
              className={`rounded-xl px-3 py-3 text-right text-sm ${
                activeTab === tab.id
                  ? "bg-rose-soft font-medium text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
