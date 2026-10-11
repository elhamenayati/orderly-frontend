"use client";

import { Clock } from "lucide-react";
import {
  getActiveServices,
  minStartingPriceForService,
} from "@/lib/salon/public-data";
import { serviceCategories } from "@/mock_ts/services";
import { formatDuration, formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import type { Service } from "@/types/domain";

type PopularServicesProps = {
  onViewAll: () => void;
};

export function PopularServices({ onViewAll }: PopularServicesProps) {
  const services = getActiveServices().slice(0, 4);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">خدمات</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm text-primary"
        >
          مشاهده همه
        </button>
      </div>
      <div className="space-y-3 md:hidden">
        {services.map((service) => (
          <ServiceListItem key={service.id} service={service} />
        ))}
      </div>
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {services.map((service) => (
          <ServiceGridCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}

function categoryName(categoryId: string) {
  return serviceCategories.find((item) => item.id === categoryId)?.name ?? "";
}

export function ServiceListItem({ service }: { service: Service }) {
  const price = minStartingPriceForService(service.id);

  return (
    <Card className="py-0 shadow-none">
      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{service.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {categoryName(service.categoryId)}
          </p>
          {price !== null ? (
            <p className="mt-1 text-sm font-semibold text-primary">
              از {formatPrice(price)}
            </p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {formatDuration(service.durationMinutes)}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ServiceGridCard({ service }: { service: Service }) {
  const price = minStartingPriceForService(service.id);

  return (
    <Card className="shadow-none">
      <div className="space-y-1 p-4">
        <p className="font-medium">{service.name}</p>
        <p className="text-xs text-muted-foreground">
          {categoryName(service.categoryId)}
        </p>
        {price !== null ? (
          <p className="text-sm font-semibold text-primary">
            از {formatPrice(price)}
          </p>
        ) : null}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {formatDuration(service.durationMinutes)}
        </p>
      </div>
    </Card>
  );
}
