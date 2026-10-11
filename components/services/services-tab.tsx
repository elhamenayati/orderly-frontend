"use client";

import { Droplets, Scissors, Sparkles } from "lucide-react";
import {
  countServicesInCategory,
  getActiveCategories,
  getActiveServices,
} from "@/lib/salon/public-data";
import { formatCount } from "@/lib/format";
import {
  ServiceGridCard,
  ServiceListItem,
} from "@/components/home/popular-services";
import { cn } from "@/lib/utils";

const icons = {
  cat_hair: Scissors,
  cat_skin: Droplets,
  cat_nails: Sparkles,
} as const;

type ServicesTabProps = {
  categoryFilter: string | null;
  onCategoryFilter: (categoryId: string | null) => void;
};

export function ServicesTab({
  categoryFilter,
  onCategoryFilter,
}: ServicesTabProps) {
  const categories = getActiveCategories();
  const allServices = getActiveServices();
  const filtered = categoryFilter
    ? allServices.filter((service) => service.categoryId === categoryFilter)
    : allServices;
  const activeCategory = categories.find(
    (category) => category.id === categoryFilter,
  );

  return (
    <div className="space-y-6 px-4 pb-4 md:px-0">
      <div>
        <h2 className="text-xl font-semibold">خدمات</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeCategory
            ? `${activeCategory.name} · ${formatCount(filtered.length)} خدمت`
            : `${formatCount(filtered.length)} خدمت قابل رزرو`}
        </p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="همه"
          active={categoryFilter === null}
          onClick={() => onCategoryFilter(null)}
        />
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={categoryFilter === category.id}
            onClick={() => onCategoryFilter(category.id)}
            icon={category.id as keyof typeof icons}
          />
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((service) => (
          <ServiceListItem key={service.id} service={service} />
        ))}
      </div>
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {filtered.map((service) => (
          <ServiceGridCard key={service.id} service={service} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {categories.map((category) => {
          const Icon = icons[category.id as keyof typeof icons] ?? Sparkles;
          const isActive = categoryFilter === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryFilter(isActive ? null : category.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-white p-3 text-right shadow-sm",
                isActive ? "border-primary bg-rose-soft" : "border-border",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-rose-soft text-primary">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCount(countServicesInCategory(category.id))} خدمت
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: keyof typeof icons;
}) {
  const Icon = icon ? icons[icon] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-white text-foreground",
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {label}
    </button>
  );
}
