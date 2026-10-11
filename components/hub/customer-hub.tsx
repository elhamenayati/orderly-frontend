"use client";

import { useEffect, useState } from "react";
import type { TabId } from "@/lib/salon/public-data";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeTab } from "@/components/home/home-tab";
import { ServicesTab } from "@/components/services/services-tab";
import { StylistsTab } from "@/components/stylists/stylists-tab";
import { AboutTab } from "@/components/about/about-tab";

export function CustomerHub() {
  const [tab, setTab] = useState<TabId>("home");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);

  function handleTabChange(next: TabId) {
    if (next === "services" && tab !== "services") {
      setCategoryFilter(null);
    }
    setTab(next);
  }

  function openServices(categoryId?: string | null) {
    setCategoryFilter(categoryId ?? null);
    setTab("services");
  }

  return (
    <div className="min-h-dvh bg-background">
      <TopBar activeTab={tab} onTabChange={handleTabChange} />
      <main className="mx-auto w-full max-w-6xl pb-24 pt-0 md:px-6 md:pb-12 md:pt-8">
        {tab === "home" ? (
          <HomeTab onTabChange={setTab} onOpenServices={openServices} />
        ) : null}
        {tab === "services" ? (
          <ServicesTab
            categoryFilter={categoryFilter}
            onCategoryFilter={setCategoryFilter}
          />
        ) : null}
        {tab === "stylists" ? <StylistsTab /> : null}
        {tab === "about" ? <AboutTab /> : null}
      </main>
      <BottomNav activeTab={tab} onTabChange={handleTabChange} />
    </div>
  );
}
