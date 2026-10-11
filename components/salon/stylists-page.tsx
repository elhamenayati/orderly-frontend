"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Info,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  fetchStylists,
  stylistContractTypeFilters,
  stylistContractTypeLabel,
  stylistScheduleSummary,
  stylistServicesLabel,
} from "@/lib/salon/stylists";
import {
  fetchServiceCategories,
  fetchServices,
} from "@/lib/salon/services";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TableRowActionsMenu,
  tableRowActionsMenuItemClassName,
} from "@/components/ui/table-row-actions-menu";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { cn } from "@/lib/utils";
import type { ContractType, Service, ServiceCategory, Stylist } from "@/types/domain";

const PAGE_SIZE = 10;

const statusFilters = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
] as const;

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";
}

function StylistActionsMenu({ stylistId }: { stylistId: string }) {
  return (
    <TableRowActionsMenu>
      <Link
        href={`/salon/stylists/${stylistId}`}
        className={tableRowActionsMenuItemClassName}
      >
        مشاهده جزئیات
      </Link>
      <Link
        href={`/salon/stylists/${stylistId}`}
        className={tableRowActionsMenuItemClassName}
      >
        ویرایش
      </Link>
    </TableRowActionsMenu>
  );
}

export function StylistsPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [rows, setRows] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState<
    ContractType | "all" | "none"
  >("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

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
        const [nextCategories, nextServices, nextRows] = await Promise.all([
          fetchServiceCategories(),
          fetchServices({ status: "active" }),
          fetchStylists({
            query,
            status: statusFilter,
            serviceId: serviceFilter,
            categoryId: categoryFilter,
            contractType: contractFilter,
          }),
        ]);
        if (cancelled) return;
        setCategories(nextCategories);
        setServices(nextServices);
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
          showToast("بارگذاری آرایشگران با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    query,
    statusFilter,
    serviceFilter,
    categoryFilter,
    contractFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, rows.length);

  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== "all" ||
    serviceFilter !== "all" ||
    categoryFilter !== "all" ||
    contractFilter !== "all";

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setServiceFilter("all");
    setCategoryFilter("all");
    setContractFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">آرایشگران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            لیست آرایشگران سالن و وضعیت همکاری آن‌ها
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          render={<Link href="/salon/stylists/new" />}
          nativeButton={false}
        >
          <Plus className="size-4" />
          افزودن آرایشگر
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-4 py-4">
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
            <label className="relative block min-w-[220px] flex-[1.4]">
              <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="جستجو بر اساس نام آرایشگر..."
                className={cn(fieldClassName, "ps-10")}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive",
                );
                setPage(1);
              }}
              className={cn(fieldClassName, "min-w-[130px] flex-[0.75]")}
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <select
              value={serviceFilter}
              onChange={(event) => {
                setServiceFilter(event.target.value);
                setPage(1);
              }}
              className={cn(fieldClassName, "min-w-[130px] flex-[0.75]")}
            >
              <option value="all">همه خدمات</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className={cn(fieldClassName, "min-w-[130px] flex-[0.75]")}
            >
              <option value="all">همه دسته‌ها</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={contractFilter}
              onChange={(event) => {
                setContractFilter(
                  event.target.value as ContractType | "all" | "none",
                );
                setPage(1);
              }}
              className={cn(fieldClassName, "min-w-[140px] flex-[0.8]")}
            >
              {stylistContractTypeFilters.map((filter) => (
                <option key={filter.value ?? "all"} value={filter.value ?? "all"}>
                  {filter.label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="size-4" />
              پاک کردن فیلترها
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>
              برای مشاهده جزئیات و تنظیمات هر آرایشگر، روی ردیف مربوطه کلیک
              کنید.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="space-y-0 p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">نام آرایشگر</th>
                  <th className="px-4 py-3 text-start font-medium">تخصص / خدمات</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-start font-medium">
                    برنامه کاری (خلاصه)
                  </th>
                  <th className="px-4 py-3 text-start font-medium">نوع قرارداد</th>
                  <th className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      آرایشگری با این فیلترها یافت نشد.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((stylist) => (
                    <StylistRow
                      key={stylist.id}
                      stylist={stylist}
                      onOpen={() => router.push(`/salon/stylists/${stylist.id}`)}
                    />
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
    </div>
  );
}

function StylistRow({
  stylist,
  onOpen,
}: {
  stylist: Stylist;
  onOpen: () => void;
}) {
  return (
    <tr
      className="cursor-pointer border-b border-border transition last:border-b-0 hover:bg-primary/5"
      onClick={onOpen}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
            <StylistAvatar
              stylistId={stylist.id}
              avatarPath={stylist.avatarPath}
              name={stylist.displayName}
              size="md"
              className="size-full"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{stylist.displayName}</span>
            <ChevronLeft className="size-4 text-muted-foreground" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {stylistServicesLabel(stylist.id)}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={cn("rounded-full", statusBadgeClass(stylist.isActive))}
        >
          {stylist.isActive ? "فعال" : "غیرفعال"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {stylistScheduleSummary(stylist.id)}
      </td>
      <td className="px-4 py-3">{stylistContractTypeLabel(stylist.id)}</td>
      <td className="px-4 py-3">
        <div
          className="flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Link
            href={`/salon/stylists/${stylist.id}`}
            className="inline-flex items-center gap-1 text-primary transition hover:text-primary/80"
          >
            <Pencil className="size-4" />
            ویرایش
          </Link>
          <StylistActionsMenu stylistId={stylist.id} />
        </div>
      </td>
    </tr>
  );
}
