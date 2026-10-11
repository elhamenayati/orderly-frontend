import { serviceCategories, services } from "@/mock_ts/services";
import {
  stylistContracts,
  stylistSchedules,
  stylistServices,
  stylists,
} from "@/mock_ts/stylists";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import { formatToman } from "@/lib/format/money";
import { formatDuration } from "@/lib/format";
import type { ContractType, Service, Stylist } from "@/types/domain";

const DAY_LABELS: Record<number, string> = {
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
  6: "شنبه",
};

export const contractTypeLabels: Record<ContractType, string> = {
  percentage: "درصدی",
  chair_rent: "کرایه صندلی",
  fixed_salary: "حقوق ثابت",
  fixed_salary_plus_commission: "حقوق ثابت + پورسانت",
};

export function categoryName(categoryId: string) {
  return serviceCategories.find((item) => item.id === categoryId)?.name ?? "—";
}

export function serviceName(serviceId: string) {
  return services.find((item) => item.id === serviceId)?.name ?? "—";
}

export function stylistById(stylistId: string): Stylist | undefined {
  return stylists.find((item) => item.id === stylistId);
}

export function assignmentsForStylist(stylistId: string) {
  return stylistServices
    .filter((item) => item.stylistId === stylistId)
    .map((assignment) => {
      const service = services.find((item) => item.id === assignment.serviceId);
      return { assignment, service };
    })
    .filter((row) => row.service);
}

export function scheduleForStylist(stylistId: string) {
  return stylistSchedules.find((item) => item.stylistId === stylistId);
}

export function contractForStylist(stylistId: string) {
  return stylistContracts.find(
    (item) => item.stylistId === stylistId && item.isActive,
  );
}

export function formatScheduleRows(stylistId: string) {
  const schedule = scheduleForStylist(stylistId);
  if (!schedule || schedule.weeklySlots.length === 0) {
    return [];
  }

  const rows: { days: string; time: string }[] = [];
  for (const slot of schedule.weeklySlots) {
    const time = `${formatTimeDisplay(slot.startTime)} – ${formatTimeDisplay(slot.endTime)}`;
    if (rows.some((row) => row.time === time)) continue;
    const days = schedule.weeklySlots
      .filter(
        (item) =>
          item.startTime === slot.startTime && item.endTime === slot.endTime,
      )
      .map((item) => item.dayOfWeek)
      .sort((a, b) => a - b);
    rows.push({
      days: formatDayRange(days),
      time,
    });
  }
  return rows;
}

function formatDayRange(days: number[]) {
  if (days.length === 1) return DAY_LABELS[days[0]];
  const sorted = [...days].sort((a, b) => a - b);
  const isConsecutive =
    sorted[sorted.length - 1] - sorted[0] === sorted.length - 1;
  if (isConsecutive && sorted.length > 1) {
    return `${DAY_LABELS[sorted[0]]} تا ${DAY_LABELS[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((day) => DAY_LABELS[day]).join("، ");
}

export function contractSummary(stylistId: string) {
  const contract = contractForStylist(stylistId);
  if (!contract) return "قرارداد فعال ثبت نشده";

  const label = contractTypeLabels[contract.type];
  if (contract.type === "percentage" && contract.percentage !== undefined) {
    return `${label} · سهم سالن ${contract.percentage}٪ · سهم آرایشگر ${100 - contract.percentage}٪`;
  }
  if (contract.type === "chair_rent" && contract.chairRent !== undefined) {
    return `${label} · ${formatToman(contract.chairRent)} / روز کاری`;
  }
  if (contract.type === "fixed_salary" && contract.fixedSalary !== undefined) {
    return `${label} · ${formatToman(contract.fixedSalary)}`;
  }
  if (
    contract.type === "fixed_salary_plus_commission" &&
    contract.fixedSalary !== undefined &&
    contract.commissionPercentage !== undefined
  ) {
    return `${label} · ${formatToman(contract.fixedSalary)} + ${contract.commissionPercentage}٪`;
  }
  return label;
}

export function serviceListRows() {
  return [...services].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name, "fa");
  });
}

export function stylistListRows() {
  return [...stylists].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, "fa");
  });
}

export function serviceRowLabel(service: Service) {
  return `${categoryName(service.categoryId)} · ${formatDuration(service.durationMinutes)} · ودیعه ${formatToman(service.minimumDeposit)}`;
}
