"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  fetchServiceCategories,
  fetchServices,
} from "@/lib/salon/services";
import {
  activeSalonServicesByCategory,
  assignStylistServiceAsync,
} from "@/lib/salon/stylist-detail";
import { formatToman } from "@/lib/format/money";
import { ApiError } from "@/lib/api/client";
import type { Service, ServiceCategory } from "@/types/domain";

type AssignServiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylistId: string;
  onAssigned: () => void;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AssignServiceDialog({
  open,
  onOpenChange,
  stylistId,
  onAssigned,
}: AssignServiceDialogProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [priceText, setPriceText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function load() {
      try {
        const [nextCategories, nextServices] = await Promise.all([
          fetchServiceCategories(),
          fetchServices({ status: "active" }),
        ]);
        if (cancelled) return;
        setCategories(nextCategories);
        setAllServices(nextServices);
        setCategoryId(nextCategories[0]?.id ?? "");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "بارگذاری خدمات با خطا مواجه شد",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const services = useMemo(() => {
    if (allServices.length > 0) {
      return allServices.filter(
        (item) => item.isActive && item.categoryId === categoryId,
      );
    }
    return activeSalonServicesByCategory(categoryId);
  }, [allServices, categoryId]);

  useEffect(() => {
    if (!open) return;
    setServiceId("");
    setPriceText("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!serviceId && services[0]) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const startingPrice = Number.parseInt(priceText.replace(/\D/g, ""), 10);
    if (!serviceId) {
      setError("خدمت را انتخاب کنید");
      return;
    }
    if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
      setError("قیمت شروع معتبر وارد کنید");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await assignStylistServiceAsync(stylistId, serviceId, startingPrice);
      onAssigned();
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "افزودن خدمت با خطا مواجه شد",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-shell="salon" className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>افزودن خدمت به آرایشگر</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">دسته‌بندی</span>
              <select
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setServiceId("");
                }}
                className={fieldClassName}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                خدمت سالن <span className="text-destructive">*</span>
              </span>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className={fieldClassName}
              >
                <option value="">یک خدمت را انتخاب کنید</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <p className="flex items-start gap-1 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                فقط خدمات فعال سالن قابل انتخاب هستند.
              </p>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                قیمت شروع <span className="text-destructive">*</span>
              </span>
              <div className="relative">
                <input
                  inputMode="numeric"
                  value={priceText}
                  onChange={(event) =>
                    setPriceText(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="مثال: 2500000"
                  dir="ltr"
                  className={`${fieldClassName} pe-16 text-right`}
                />
                <span className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 text-xs text-muted-foreground">
                  تومان
                </span>
              </div>
              {priceText ? (
                <p className="text-xs text-muted-foreground">
                  {formatToman(Number.parseInt(priceText, 10) || 0)}
                </p>
              ) : null}
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
