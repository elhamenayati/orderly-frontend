"use client";

import { getActiveStylists } from "@/lib/salon/public-data";
import { StylistCard } from "@/components/home/stylists-preview";

export function StylistsTab() {
  const stylists = getActiveStylists();

  return (
    <div className="space-y-6 px-4 pb-4 md:px-0">
      <div>
        <h2 className="text-xl font-semibold">آرایشگران ما</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          تیم تخصصی لوکس بیوتی
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stylists.map((stylist) => (
          <StylistCard key={stylist.id} stylist={stylist} />
        ))}
      </div>
    </div>
  );
}
