import { salon, salonSchedule } from "@/mock_ts/salon";
import { serviceCategories, services } from "@/mock_ts/services";
import { stylistServices, stylists } from "@/mock_ts/stylists";
import { formatFaNumber } from "@/lib/format/number";
import type { Service, ServiceCategory, Stylist } from "@/types/domain";

const DAY_LABELS: Record<number, string> = {
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
  6: "شنبه",
};

export type TabId = "home" | "services" | "stylists" | "about";

export const customerTabs: { id: TabId; label: string }[] = [
  { id: "home", label: "خانه" },
  { id: "services", label: "خدمات" },
  { id: "stylists", label: "آرایشگران" },
  { id: "about", label: "اطلاعات" },
];

export function formatTimeDisplay(hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const minuteText = formatFaNumber(minutes).padStart(2, "۰");
  return `${formatFaNumber(hours)}:${minuteText}`;
}

export function salonPhoneHref(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return `tel:+98${digits.startsWith("0") ? digits.slice(1) : digits}`;
}

export function salonMapUrl() {
  if (salon.latitude && salon.longitude) {
    return `https://maps.google.com/?q=${salon.latitude},${salon.longitude}`;
  }
  return `https://maps.google.com/?q=${encodeURIComponent(salon.address)}`;
}

export function getActiveServices(): Service[] {
  return services.filter((item) => item.isActive);
}

export function getActiveCategories(): ServiceCategory[] {
  const activeServiceCategoryIds = new Set(
    getActiveServices().map((item) => item.categoryId),
  );
  return serviceCategories
    .filter((item) => activeServiceCategoryIds.has(item.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function countServicesInCategory(categoryId: string) {
  return getActiveServices().filter((item) => item.categoryId === categoryId)
    .length;
}

export function minStartingPriceForService(serviceId: string): number | null {
  const prices = stylistServices
    .filter(
      (item) =>
        item.serviceId === serviceId && item.isActive && item.startingPrice >= 0,
    )
    .map((item) => item.startingPrice);
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function getActiveStylists(): Stylist[] {
  return stylists.filter((item) => item.isActive);
}

export function stylistSpecialtyLabel(stylistId: string) {
  const assigned = stylistServices
    .filter((item) => item.stylistId === stylistId && item.isActive)
    .map((item) => services.find((service) => service.id === item.serviceId))
    .filter((item): item is Service => Boolean(item?.isActive));

  if (assigned.length === 0) return "آرایشگر";
  const names = [...new Set(assigned.map((item) => item.name))];
  return names.slice(0, 2).join("، ");
}

export function formatSalonHoursSummary() {
  const formatted = formatSalonHoursList();
  if (formatted.length === 0) return "ساعات کاری ثبت نشده";
  return formatted.map((item) => `${item.days} ${item.time}`).join(" · ");
}

export function formatSalonHoursList() {
  const openDays = new Set(salonSchedule.weeklySlots.map((slot) => slot.dayOfWeek));
  const rows: { days: string; time: string }[] = [];

  for (const slot of salonSchedule.weeklySlots) {
    const time = `${formatTimeDisplay(slot.startTime)} – ${formatTimeDisplay(slot.endTime)}`;
    const existing = rows.find((row) => row.time === time);
    if (existing) continue;
    const matchingDays = salonSchedule.weeklySlots
      .filter((item) => item.startTime === slot.startTime && item.endTime === slot.endTime)
      .map((item) => item.dayOfWeek)
      .sort((a, b) => a - b);

    rows.push({
      days: formatDayRange(matchingDays),
      time,
    });
  }

  if (!openDays.has(5)) {
    rows.push({ days: "جمعه", time: "تعطیل" });
  }

  return rows;
}

function formatDayRange(days: number[]) {
  if (days.length === 1) return DAY_LABELS[days[0]];
  if (days.length === 7) return "هر روز";

  const sorted = [...days].sort((a, b) => a - b);
  const isConsecutive =
    sorted[sorted.length - 1] - sorted[0] === sorted.length - 1;
  if (isConsecutive && sorted.length > 1) {
    return `${DAY_LABELS[sorted[0]]} تا ${DAY_LABELS[sorted[sorted.length - 1]]}`;
  }

  return sorted.map((day) => DAY_LABELS[day]).join("، ");
}

export { salon };
