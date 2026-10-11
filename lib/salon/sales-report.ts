import { categoryName, serviceName, stylistById } from "@/lib/salon/management";
import { fetchBookings } from "@/lib/salon/bookings";
import { fetchServices } from "@/lib/salon/services";
import { fetchStylists } from "@/lib/salon/stylists";
import {
  completedBookingLines,
  type CompletedLineRow,
} from "@/lib/salon/reports";
import { serviceCategories, services } from "@/mock_ts/services";
import { stylists } from "@/mock_ts/stylists";

export type SalonSalesFilters = {
  periodStart: string;
  periodEnd: string;
  categoryId?: string;
  serviceId?: string;
  stylistId?: string;
};

export type SalonSalesKpis = {
  actualSales: number;
  completedBookings: number;
  serviceCount: number;
  averageBookingValue: number;
};

export type SalonSalesBreakdownRow = {
  id: string;
  label: string;
  sublabel?: string;
  count: number;
  sales: number;
  sharePercent: number;
  averageValue: number;
};

export type SalonSalesTrendPoint = {
  bookingDate: string;
  sales: number;
  bookingCount: number;
  serviceCount: number;
};

function serviceCategoryId(serviceId: string) {
  return services.find((item) => item.id === serviceId)?.categoryId;
}

export function filteredCompletedLines(
  filters: SalonSalesFilters,
): CompletedLineRow[] {
  return completedBookingLines({
    periodStart: filters.periodStart,
    periodEnd: filters.periodEnd,
  }).filter((line) => {
    if (filters.stylistId && filters.stylistId !== "all") {
      if (line.stylistId !== filters.stylistId) return false;
    }
    if (filters.serviceId && filters.serviceId !== "all") {
      if (line.serviceId !== filters.serviceId) return false;
    }
    if (filters.categoryId && filters.categoryId !== "all") {
      if (serviceCategoryId(line.serviceId) !== filters.categoryId) return false;
    }
    return true;
  });
}

export function salonSalesKpis(filters: SalonSalesFilters): SalonSalesKpis {
  const lines = filteredCompletedLines(filters);
  const bookingIds = new Set(lines.map((line) => line.bookingId));
  const actualSales = lines.reduce((sum, line) => sum + line.finalActualAmount, 0);
  const completedBookings = bookingIds.size;

  return {
    actualSales,
    completedBookings,
    serviceCount: lines.length,
    averageBookingValue:
      completedBookings > 0 ? Math.round(actualSales / completedBookings) : 0,
  };
}

function aggregateBreakdown(
  lines: CompletedLineRow[],
  keyFn: (line: CompletedLineRow) => {
    id: string;
    label: string;
    sublabel?: string;
  },
): SalonSalesBreakdownRow[] {
  const buckets = new Map<
    string,
    { label: string; sublabel?: string; count: number; sales: number }
  >();

  for (const line of lines) {
    const { id, label, sublabel } = keyFn(line);
    const bucket = buckets.get(id) ?? { label, sublabel, count: 0, sales: 0 };
    bucket.count += 1;
    bucket.sales += line.finalActualAmount;
    buckets.set(id, bucket);
  }

  const totalSales = lines.reduce((sum, line) => sum + line.finalActualAmount, 0);

  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      sublabel: bucket.sublabel,
      count: bucket.count,
      sales: bucket.sales,
      sharePercent: totalSales > 0 ? (bucket.sales / totalSales) * 100 : 0,
      averageValue:
        bucket.count > 0 ? Math.round(bucket.sales / bucket.count) : 0,
    }))
    .sort((a, b) => b.sales - a.sales);
}

export function salonSalesBreakdownByService(filters: SalonSalesFilters) {
  return aggregateBreakdown(filteredCompletedLines(filters), (line) => ({
    id: line.serviceId,
    label: serviceName(line.serviceId),
    sublabel: categoryName(serviceCategoryId(line.serviceId) ?? ""),
  }));
}

export function salonSalesBreakdownByCategory(filters: SalonSalesFilters) {
  return aggregateBreakdown(filteredCompletedLines(filters), (line) => {
    const categoryId = serviceCategoryId(line.serviceId) ?? "unknown";
    return {
      id: categoryId,
      label: categoryName(categoryId),
    };
  });
}

export function salonSalesBreakdownByStylist(filters: SalonSalesFilters) {
  return aggregateBreakdown(filteredCompletedLines(filters), (line) => ({
    id: line.stylistId,
    label: stylistById(line.stylistId)?.displayName ?? "—",
  }));
}

export function salonSalesBreakdownByDate(filters: SalonSalesFilters) {
  return aggregateBreakdown(filteredCompletedLines(filters), (line) => ({
    id: line.bookingDate,
    label: line.bookingDate,
  }));
}

export function salonSalesTrendByDate(filters: SalonSalesFilters) {
  const lines = filteredCompletedLines(filters);
  const byDate = new Map<
    string,
    { sales: number; bookingIds: Set<string>; serviceCount: number }
  >();

  for (const line of lines) {
    const bucket = byDate.get(line.bookingDate) ?? {
      sales: 0,
      bookingIds: new Set<string>(),
      serviceCount: 0,
    };
    bucket.sales += line.finalActualAmount;
    bucket.bookingIds.add(line.bookingId);
    bucket.serviceCount += 1;
    byDate.set(line.bookingDate, bucket);
  }

  return [...byDate.entries()]
    .map(([bookingDate, bucket]) => ({
      bookingDate,
      sales: bucket.sales,
      bookingCount: bucket.bookingIds.size,
      serviceCount: bucket.serviceCount,
    }))
    .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
}

export function salonSalesFilterOptions() {
  return {
    categories: [
      { id: "all", name: "همه دسته‌بندی‌ها" },
      ...serviceCategories.map((item) => ({ id: item.id, name: item.name })),
    ],
    services: [
      { id: "all", name: "همه خدمات" },
      ...services.map((item) => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
      })),
    ],
    stylists: [
      { id: "all", name: "همه آرایشگران" },
      ...stylists
        .filter((item) => item.isActive)
        .map((item) => ({ id: item.id, name: item.displayName })),
    ],
  };
}

export async function loadSalesReportData(options: {
  periodStart: string;
  periodEnd: string;
}) {
  await Promise.all([
    fetchStylists({ status: "active" }),
    fetchServices(),
    fetchBookings({
      status: "completed",
      dateFrom: options.periodStart,
      dateTo: options.periodEnd,
    }),
  ]);
}
