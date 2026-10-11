"use client";

import { Droplets, Scissors, Sparkles } from "lucide-react";
import {
  countServicesInCategory,
  getActiveCategories,
} from "@/lib/salon/public-data";
import { formatCount } from "@/lib/format";

const icons = {
  cat_hair: Scissors,
  cat_skin: Droplets,
  cat_nails: Sparkles,
} as const;

type CategoriesProps = {
  onSelect: (categoryId: string) => void;
  onViewAll: () => void;
};

export function Categories({ onSelect, onViewAll }: CategoriesProps) {
  const categories = getActiveCategories();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">دسته‌بندی خدمات</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm text-primary"
        >
          مشاهده همه خدمات
        </button>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        {categories.map((category) => {
          const Icon = icons[category.id as keyof typeof icons] ?? Sparkles;
          const count = countServicesInCategory(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className="flex w-[88px] shrink-0 flex-col items-center gap-2 md:w-auto"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-rose-soft text-primary shadow-sm ring-1 ring-primary/10">
                <Icon className="size-6" />
              </span>
              <span className="text-center text-xs font-medium leading-5">
                {category.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatCount(count)} خدمت
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
