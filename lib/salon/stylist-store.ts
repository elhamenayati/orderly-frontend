import {
  stylistContractAuditLogs,
  stylistContracts,
  stylistSchedules,
  stylistServices,
  stylists,
} from "@/mock_ts/stylists";
import type {
  Stylist,
  StylistContract,
  StylistContractAuditLog,
  StylistService,
  WeeklyScheduleSlot,
} from "@/types/domain";

export function syncStylistsToMock(items: Stylist[]) {
  stylists.length = 0;
  stylists.push(...items);
}

export function upsertStylist(stylist: Stylist) {
  const index = stylists.findIndex((item) => item.id === stylist.id);
  if (index >= 0) {
    stylists[index] = stylist;
  } else {
    stylists.push(stylist);
  }
}

export function syncStylistServices(stylistId: string, items: StylistService[]) {
  const rest = stylistServices.filter((item) => item.stylistId !== stylistId);
  stylistServices.length = 0;
  stylistServices.push(...rest, ...items);
}

export function syncStylistSchedule(
  stylistId: string,
  weeklySlots: WeeklyScheduleSlot[],
) {
  const existing = stylistSchedules.find((item) => item.stylistId === stylistId);
  if (existing) {
    existing.weeklySlots = weeklySlots;
    return;
  }
  stylistSchedules.push({
    stylistId,
    weeklySlots,
    unavailableDates: [],
  });
}

export function syncStylistContracts(stylistId: string, contracts: StylistContract[]) {
  const rest = stylistContracts.filter((item) => item.stylistId !== stylistId);
  stylistContracts.length = 0;
  stylistContracts.push(...rest, ...contracts);
}

export function syncStylistContractAuditLogs(
  stylistId: string,
  logs: StylistContractAuditLog[],
) {
  const rest = stylistContractAuditLogs.filter((item) => item.stylistId !== stylistId);
  stylistContractAuditLogs.length = 0;
  stylistContractAuditLogs.push(...rest, ...logs);
}

export function appendStylistContractAuditLog(log: StylistContractAuditLog) {
  stylistContractAuditLogs.unshift(log);
}
