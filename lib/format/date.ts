const faDate = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDateFa(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return faDate.format(new Date(year, month - 1, day));
}

export function weekdayFromIsoDate(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function normalizeTimeHHMM(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value.trim();
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function timeToMinutes(hhmm: string) {
  const normalized = normalizeTimeHHMM(hhmm);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}
