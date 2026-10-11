"use client";

import {
  getActiveStylists,
  stylistSpecialtyLabel,
} from "@/lib/salon/public-data";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { Card } from "@/components/ui/card";
import type { Stylist } from "@/types/domain";

type StylistsPreviewProps = {
  onViewAll: () => void;
};

export function StylistsPreview({ onViewAll }: StylistsPreviewProps) {
  const stylists = getActiveStylists();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">آرایشگران ما</h2>
        <button type="button" onClick={onViewAll} className="text-sm text-primary">
          مشاهده همه
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stylists.map((stylist) => (
          <StylistCard key={stylist.id} stylist={stylist} />
        ))}
      </div>
    </section>
  );
}

export function StylistCard({ stylist }: { stylist: Stylist }) {
  const specialty = stylistSpecialtyLabel(stylist.id);

  return (
    <Card className="shadow-none">
      <div className="flex flex-col items-center p-4 text-center">
        <StylistAvatar
          stylistId={stylist.id}
          avatarPath={stylist.avatarPath}
          name={stylist.displayName}
          size="xl"
          className="ring-2 ring-rose-soft md:size-24"
        />
        <p className="mt-3 font-medium">{stylist.displayName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{specialty}</p>
      </div>
    </Card>
  );
}
