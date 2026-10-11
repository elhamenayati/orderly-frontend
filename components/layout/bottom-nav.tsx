"use client";

import type { TabId } from "@/lib/salon/public-data";
import { customerTabs } from "@/lib/salon/public-data";
import { Home, Sparkles, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  home: Home,
  services: Sparkles,
  stylists: Users,
  about: Info,
};

type BottomNavProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
      <div
        className="mx-auto grid max-w-lg grid-cols-4 px-1 pt-1"
        style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      >
        {customerTabs.map((tab) => {
          const Icon = icons[tab.id];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px]",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", isActive && "fill-primary/15")} />
              <span className={cn(isActive && "font-medium")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
