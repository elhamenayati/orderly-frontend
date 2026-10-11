"use client";

import { useEffect, useState } from "react";
import { Info, Scissors } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { salon } from "@/mock_ts/salon";
import { cn } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types/domain";
import type { ServiceInput } from "@/lib/salon/services";

type ServiceDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Service | null;
  categories: ServiceCategory[];
  onSave: (input: ServiceInput) => void;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function emptyForm(categories: ServiceCategory[]): ServiceInput {
  return {
    name: "",
    categoryId: categories[0]?.id ?? "",
    durationMinutes: 45,
    minimumDeposit: 0,
    isActive: true,
  };
}

function formFromService(service: Service): ServiceInput {
  return {
    name: service.name,
    categoryId: service.categoryId,
    durationMinutes: service.durationMinutes,
    minimumDeposit: service.minimumDeposit,
    isActive: service.isActive,
  };
}

export function ServiceDrawer({
  open,
  onOpenChange,
  editing,
  categories,
  onSave,
}: ServiceDrawerProps) {
  const [form, setForm] = useState<ServiceInput>(() => emptyForm(categories));
  const [durationText, setDurationText] = useState("45");
  const [depositText, setDepositText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const next = formFromService(editing);
      setForm(next);
      setDurationText(String(next.durationMinutes));
      setDepositText(next.minimumDeposit ? String(next.minimumDeposit) : "");
    } else {
      const next = emptyForm(categories);
      setForm(next);
      setDurationText(String(next.durationMinutes));
      setDepositText("");
    }
    setError(null);
  }, [open, editing, categories]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const durationMinutes = Number.parseInt(durationText, 10);
    const minimumDeposit = depositText
      ? Number.parseInt(depositText.replace(/\D/g, ""), 10)
      : 0;

    if (!form.categoryId) {
      setError("دسته‌بندی را انتخاب کنید");
      return;
    }
    if (!form.name.trim()) {
      setError("نام خدمت را وارد کنید");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError("مدت تقریبی معتبر وارد کنید");
      return;
    }
    if (!Number.isFinite(minimumDeposit) || minimumDeposit < 0) {
      setError("حداقل بیعانه معتبر نیست");
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      durationMinutes,
      minimumDeposit,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-shell="salon"
        className="w-full sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Scissors className="size-5" />
              </span>
              <SheetTitle>
                {editing ? "ویرایش خدمت" : "افزودن خدمت"}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                دسته‌بندی <span className="text-destructive">*</span>
              </span>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm({ ...form, categoryId: event.target.value })
                }
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
                نام خدمت <span className="text-destructive">*</span>
              </span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="مثلاً: کوتاهی مو"
                className={fieldClassName}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                مدت تقریبی / پیش‌فرض{" "}
                <span className="text-destructive">*</span>
              </span>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  value={durationText}
                  onChange={(event) =>
                    setDurationText(event.target.value.replace(/\D/g, ""))
                  }
                  className={cn(fieldClassName, "flex-1")}
                />
                <select
                  defaultValue="minutes"
                  className={cn(fieldClassName, "w-28 shrink-0")}
                  disabled
                >
                  <option value="minutes">دقیقه</option>
                </select>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">حداقل مبلغ بیعانه</span>
              <input
                inputMode="numeric"
                value={depositText}
                onChange={(event) =>
                  setDepositText(event.target.value.replace(/\D/g, ""))
                }
                placeholder="اختیاری"
                dir="ltr"
                className={cn(fieldClassName, "text-start")}
              />
            </label>

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-sky-700" />
                <div>
                  <p className="font-medium">شرایط کنسلی</p>
                  <p className="mt-1 text-sky-800/90">
                    این خدمت از قوانین کنسلی عمومی سالن پیروی می‌کند. در MVP
                    امکان تعریف قوانین اختصاصی برای هر خدمت وجود ندارد.
                  </p>
                  <p className="mt-2 text-xs text-sky-700/90">
                    {salon.cancellationPolicy}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border px-4 py-3">
              <label className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">وضعیت</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    خدمات غیرفعال در فرآیند رزرو نمایش داده نمی‌شوند.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm({ ...form, isActive: event.target.checked })
                    }
                    className="size-5 accent-primary"
                  />
                  <span className="text-sm">{form.isActive ? "فعال" : "غیرفعال"}</span>
                </span>
              </label>
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-input hover:border-primary/40 hover:text-primary"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              ذخیره
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
