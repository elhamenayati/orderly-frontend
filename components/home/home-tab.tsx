"use client";

import type { TabId } from "@/lib/salon/public-data";
import { BookButton } from "@/components/customer/book-button";
import { SalonHero, SalonHeader, InfoCards } from "@/components/home/salon-header";
import { QuickActions } from "@/components/home/quick-actions";
import { Categories } from "@/components/home/categories";
import { PopularServices } from "@/components/home/popular-services";
import { StylistsPreview } from "@/components/home/stylists-preview";
import { Button } from "@/components/ui/button";

type HomeTabProps = {
  onTabChange: (tab: TabId) => void;
  onOpenServices: (categoryId?: string | null) => void;
};

export function HomeTab({ onTabChange, onOpenServices }: HomeTabProps) {
  return (
    <div className="space-y-8 pb-4">
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-8">
        <SalonHero />
        <div className="hidden space-y-5 md:block">
          <SalonHeader />
          <InfoCards />
          <div className="flex gap-3">
            <BookButton className="h-11 flex-1 text-base" />
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl text-base"
              onClick={() => onTabChange("about")}
            >
              ساعت و آدرس
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5 md:hidden">
        <QuickActions onTabChange={onTabChange} />
        <div className="space-y-3 px-4">
          <BookButton className="h-12 w-full text-base" />
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
            onClick={() => onTabChange("about")}
          >
            ساعت و آدرس
          </Button>
        </div>
      </div>

      <div className="space-y-8 px-4 md:px-0">
        <Categories
          onSelect={(id) => onOpenServices(id)}
          onViewAll={() => onOpenServices(null)}
        />
        <PopularServices onViewAll={() => onOpenServices(null)} />
        <StylistsPreview onViewAll={() => onTabChange("stylists")} />
      </div>
    </div>
  );
}
