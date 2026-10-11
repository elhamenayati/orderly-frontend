"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Info,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  Search,
  Sparkles,
} from "lucide-react";
import { categoryName } from "@/lib/salon/management";
import {
  fetchServiceCategories,
  fetchServices,
  saveServiceAsync,
  toggleServiceActiveAsync,
  type ServiceInput,
} from "@/lib/salon/services";
import { formatDuration } from "@/lib/format";
import { formatToman } from "@/lib/format/money";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { ServiceDrawer } from "@/components/salon/services/service-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types/domain";

const PAGE_SIZE = 10;

const statusFilters = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
] as const;

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function ServiceCategoryIcon({ categoryId }: { categoryId: string }) {
  const name = categoryName(categoryId);
  if (name === "مو") {
    return <Scissors className="size-4 text-primary" />;
  }
  if (name === "ناخن") {
    return <Sparkles className="size-4 text-primary" />;
  }
  return <Sparkles className="size-4 text-primary" />;
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-border bg-muted text-muted-foreground";
}

export function ServicesPage() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [rows, setRows] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [nextCategories, nextRows] = await Promise.all([
          fetchServiceCategories(),
          fetchServices({
            query,
            categoryId: categoryFilter,
            status: statusFilter,
          }),
        ]);
        if (cancelled) return;
        setCategories(nextCategories);
        setRows(nextRows);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            showToast("نشست شما منقضی شده — لطفاً دوباره وارد شوید");
            window.setTimeout(() => {
              window.location.href = "/salon/login";
            }, 1200);
            return;
          }
          showToast("بارگذاری خدمات با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, query, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, rows.length);

  function openCreate() {
    setEditingService(null);
    setDrawerOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setDrawerOpen(true);
  }

  async function handleSave(input: ServiceInput) {
    setSaving(true);
    try {
      await saveServiceAsync(input, editingService?.id);
      const nextRows = await fetchServices({
        query,
        categoryId: categoryFilter,
        status: statusFilter,
      });
      setRows(nextRows);
      showToast(editingService ? "خدمت به‌روزرسانی شد" : "خدمت اضافه شد");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "ذخیره خدمت با خطا مواجه شد",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await toggleServiceActiveAsync(service.id);
      const nextRows = await fetchServices({
        query,
        categoryId: categoryFilter,
        status: statusFilter,
      });
      setRows(nextRows);
      showToast(service.isActive ? "خدمت غیرفعال شد" : "خدمت فعال شد");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "تغییر وضعیت با خطا مواجه شد",
      );
    }
  }

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold">خدمات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          در این صفحه می‌توانید خدمات قابل رزرو سالن را مدیریت کنید.
        </p>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-4 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="جستجو در خدمات..."
                className={cn(fieldClassName, "ps-10")}
              />
            </label>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className={fieldClassName}
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive",
                );
                setPage(1);
              }}
              className={fieldClassName}
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              className="shrink-0"
              onClick={openCreate}
              disabled={saving || categories.length === 0}
            >
              <Plus className="size-4" />
              افزودن خدمت
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>
              {categories.length === 0 && !loading
                ? "برای افزودن خدمت، دسته‌بندی‌های خدمت سالن باید موجود باشند. صفحه را یک‌بار رفرش کنید."
                : "قیمت نهایی خدمت در این بخش تعریف نمی‌شود و قیمت پایه برای مشتری هنگام تخصیص خدمت به آرایشگر مشخص می‌شود."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="space-y-4 p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">نام خدمت</th>
                  <th className="px-4 py-3 text-start font-medium">دسته‌بندی</th>
                  <th className="px-4 py-3 text-start font-medium">مدت تقریبی</th>
                  <th className="px-4 py-3 text-start font-medium">حداقل بیعانه</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      خدمتی با این فیلترها یافت نشد.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                            <ServiceCategoryIcon categoryId={service.categoryId} />
                          </span>
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {categoryName(service.categoryId)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDuration(service.durationMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        {service.minimumDeposit > 0
                          ? formatToman(service.minimumDeposit)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("rounded-full", statusBadgeClass(service.isActive))}
                        >
                          {service.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-primary transition hover:text-primary/80"
                            onClick={() => openEdit(service)}
                          >
                            <Pencil className="size-4" />
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1 transition",
                              service.isActive
                                ? "text-destructive hover:text-destructive/80"
                                : "text-emerald-700 hover:text-emerald-600",
                            )}
                            onClick={() => void handleToggleActive(service)}
                          >
                            {service.isActive ? (
                              <>
                                <Ban className="size-4" />
                                غیرفعال‌سازی
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-4" />
                                فعال‌سازی
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>نمایش</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-background px-2"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {formatFaNumber(size)}
                  </option>
                ))}
              </select>
              <span>ردیف</span>
            </div>

            <p>
              {formatFaNumber(rangeStart)} تا {formatFaNumber(rangeEnd)} از{" "}
              {formatFaNumber(rows.length)} مورد
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                قبلی
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    className="min-w-11"
                    onClick={() => setPage(pageNumber)}
                  >
                    {formatFaNumber(pageNumber)}
                  </Button>
                ),
              )}
              <Button
                type="button"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ServiceDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editing={editingService}
        categories={categories}
        onSave={(input) => void handleSave(input)}
      />
    </div>
  );
}
