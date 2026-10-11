import { categoryName } from "@/lib/salon/management";
import { WEEK_DAYS } from "@/lib/salon/schedule";
import {
  createStylist,
  createStylistAsync,
  type StylistInput,
} from "@/lib/salon/stylists";
import { readSalonSessionUser } from "@/lib/salon/auth";
import {
  appendStylistContractAuditLog,
  syncStylistContractAuditLogs,
  syncStylistContracts,
  syncStylistSchedule,
  syncStylistServices,
  upsertStylist,
} from "@/lib/salon/stylist-store";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { services } from "@/mock_ts/services";
import {
  stylistContractAuditLogs,
  stylistContracts,
  stylistSchedules,
  stylistServices,
  stylists,
} from "@/mock_ts/stylists";
import type {
  ContractType,
  DayOfWeek,
  FinancialPeriod,
  Stylist,
  StylistContract,
  StylistContractAuditAction,
  StylistContractAuditLog,
  StylistService,
  WeeklyScheduleSlot,
} from "@/types/domain";

export type StylistBasicInput = StylistInput & {
  gender?: Stylist["gender"];
  description?: string;
  avatarPath?: string;
};

export type WeeklyScheduleRow = {
  dayOfWeek: DayOfWeek;
  label: string;
  active: boolean;
  startTime: string;
  endTime: string;
};

export type StylistServiceAssignmentRow = {
  assignment: StylistService;
  serviceName: string;
  categoryName: string;
  durationMinutes: number;
};

export type ContractInput = {
  type: ContractType;
  effectiveFrom: string;
  effectiveTo?: string;
  financialPeriod: FinancialPeriod;
  percentage?: number;
  chairRent?: number;
  fixedSalary?: number;
  commissionPercentage?: number;
};

export type StylistReadiness = {
  bookingReady: boolean;
  settlementReady: boolean;
  bookingChecks: {
    active: boolean;
    hasService: boolean;
    hasPrice: boolean;
    hasSchedule: boolean;
  };
  settlementChecks: {
    hasContract: boolean;
  };
};

export function getStylistById(stylistId: string) {
  return stylists.find((item) => item.id === stylistId);
}

async function fetchContractAuditLogsSafe(
  stylistId: string,
): Promise<StylistContractAuditLog[]> {
  if (!isApiEnabled()) {
    return getContractAuditLogs(stylistId);
  }

  const paths = [
    `/salon/stylists/${encodeURIComponent(stylistId)}/contract-audit-logs`,
    `/salon/stylists/${encodeURIComponent(stylistId)}/contracts/audit-log`,
  ];

  for (const path of paths) {
    try {
      return await apiFetch<StylistContractAuditLog[]>(path);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 405)
      ) {
        continue;
      }
      throw error;
    }
  }

  return [];
}

export async function fetchStylistDetail(
  stylistId: string,
): Promise<Stylist | null> {
  if (!isApiEnabled()) {
    return getStylistById(stylistId) ?? null;
  }

  try {
    const [stylist, serviceItems, scheduleRes, contractItems, auditLogs] =
      await Promise.all([
        apiFetch<Stylist>(`/salon/stylists/${encodeURIComponent(stylistId)}`),
        apiFetch<StylistService[]>(
          `/salon/stylists/${encodeURIComponent(stylistId)}/services`,
        ),
        apiFetch<{ weeklySlots: WeeklyScheduleSlot[] }>(
          `/salon/stylists/${encodeURIComponent(stylistId)}/schedule`,
        ),
        apiFetch<StylistContract[]>(
          `/salon/stylists/${encodeURIComponent(stylistId)}/contracts`,
        ),
        fetchContractAuditLogsSafe(stylistId),
      ]);

    upsertStylist(stylist);
    syncStylistServices(stylistId, serviceItems);
    syncStylistSchedule(stylistId, scheduleRes.weeklySlots ?? []);
    syncStylistContracts(stylistId, contractItems);
    syncStylistContractAuditLogs(stylistId, auditLogs);
    return stylist;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری اطلاعات آرایشگر با خطا مواجه شد", 0);
  }
}

export function saveStylistBasicInfo(
  stylistId: string | null,
  input: StylistBasicInput,
): Stylist {
  if (stylistId) {
    const existing = getStylistById(stylistId);
    if (!existing) throw new Error("stylist_not_found");
    existing.displayName = input.displayName.trim();
    existing.mobile = input.mobile.trim();
    existing.isActive = input.isActive ?? existing.isActive;
    existing.gender = input.gender;
    existing.description = input.description?.trim() || undefined;
    if (input.avatarPath) {
      existing.avatarPath = input.avatarPath;
    }
    return existing;
  }
  return createStylist(input);
}

export async function saveStylistBasicInfoAsync(
  stylistId: string | null,
  input: StylistBasicInput,
): Promise<Stylist> {
  if (!isApiEnabled()) {
    return saveStylistBasicInfo(stylistId, input);
  }

  const payload = {
    displayName: input.displayName.trim(),
    mobile: input.mobile.trim(),
    isActive: input.isActive ?? true,
    gender: input.gender,
    description: input.description?.trim() || undefined,
    avatarPath:
      input.avatarPath && !input.avatarPath.startsWith("data:")
        ? input.avatarPath
        : undefined,
  };

  try {
    const saved = stylistId
      ? await apiFetch<Stylist>(
          `/salon/stylists/${encodeURIComponent(stylistId)}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        )
      : await createStylistAsync(input);

    upsertStylist(saved);
    return saved;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ذخیره اطلاعات آرایشگر با خطا مواجه شد", 0);
  }
}

export function listStylistAssignments(
  stylistId: string,
): StylistServiceAssignmentRow[] {
  return stylistServices
    .filter((item) => item.stylistId === stylistId)
    .map((assignment) => {
      const service = services.find((item) => item.id === assignment.serviceId);
      return {
        assignment,
        serviceName: service?.name ?? "—",
        categoryName: service ? categoryName(service.categoryId) : "—",
        durationMinutes: service?.durationMinutes ?? 0,
      };
    })
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName, "fa"));
}

function mockAssignStylistService(
  stylistId: string,
  serviceId: string,
  startingPrice: number,
) {
  const service = services.find((item) => item.id === serviceId);
  if (!service?.isActive) throw new Error("service_not_active");

  const existing = stylistServices.find(
    (item) => item.stylistId === stylistId && item.serviceId === serviceId,
  );
  if (existing) {
    existing.startingPrice = startingPrice;
    existing.isActive = true;
    return existing;
  }

  const created: StylistService = {
    id: `ss_${Date.now().toString(36)}`,
    stylistId,
    serviceId,
    startingPrice,
    isActive: true,
  };
  stylistServices.push(created);
  return created;
}

export function assignStylistService(
  stylistId: string,
  serviceId: string,
  startingPrice: number,
) {
  return mockAssignStylistService(stylistId, serviceId, startingPrice);
}

export async function assignStylistServiceAsync(
  stylistId: string,
  serviceId: string,
  startingPrice: number,
): Promise<StylistService> {
  if (!isApiEnabled()) {
    return mockAssignStylistService(stylistId, serviceId, startingPrice);
  }

  try {
    const saved = await apiFetch<StylistService>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/services`,
      {
        method: "POST",
        body: JSON.stringify({ serviceId, startingPrice }),
      },
    );

    const rest = stylistServices.filter(
      (item) =>
        !(
          item.stylistId === stylistId &&
          (item.id === saved.id || item.serviceId === saved.serviceId)
        ),
    );
    stylistServices.length = 0;
    stylistServices.push(...rest, saved);
    return saved;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("افزودن خدمت با خطا مواجه شد", 0);
  }
}

function mockUpdateStylistServicePrice(
  assignmentId: string,
  startingPrice: number,
) {
  const assignment = stylistServices.find((item) => item.id === assignmentId);
  if (!assignment) throw new Error("assignment_not_found");
  assignment.startingPrice = startingPrice;
  return assignment;
}

export function updateStylistServicePrice(
  assignmentId: string,
  startingPrice: number,
) {
  return mockUpdateStylistServicePrice(assignmentId, startingPrice);
}

export async function updateStylistServicePriceAsync(
  stylistId: string,
  assignmentId: string,
  startingPrice: number,
): Promise<StylistService> {
  if (!isApiEnabled()) {
    return mockUpdateStylistServicePrice(assignmentId, startingPrice);
  }

  try {
    const saved = await apiFetch<StylistService>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/services/${encodeURIComponent(assignmentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ startingPrice }),
      },
    );

    const index = stylistServices.findIndex((item) => item.id === assignmentId);
    if (index >= 0) {
      stylistServices[index] = saved;
    } else {
      stylistServices.push(saved);
    }
    return saved;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("به‌روزرسانی قیمت با خطا مواجه شد", 0);
  }
}

function mockDeactivateStylistService(assignmentId: string) {
  const assignment = stylistServices.find((item) => item.id === assignmentId);
  if (!assignment) return;
  assignment.isActive = false;
}

export function deactivateStylistService(assignmentId: string) {
  mockDeactivateStylistService(assignmentId);
}

export async function deactivateStylistServiceAsync(
  stylistId: string,
  assignmentId: string,
): Promise<void> {
  if (!isApiEnabled()) {
    mockDeactivateStylistService(assignmentId);
    return;
  }

  try {
    const saved = await apiFetch<StylistService>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/services/${encodeURIComponent(assignmentId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      },
    );
    const index = stylistServices.findIndex((item) => item.id === assignmentId);
    if (index >= 0) {
      stylistServices[index] = saved;
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("حذف خدمت با خطا مواجه شد", 0);
  }
}

export function weeklyScheduleRows(stylistId: string): WeeklyScheduleRow[] {
  const schedule = stylistSchedules.find((item) => item.stylistId === stylistId);
  return WEEK_DAYS.map(({ dayOfWeek, label }) => {
    const slot = schedule?.weeklySlots.find((item) => item.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      label,
      active: Boolean(slot),
      startTime: slot?.startTime ?? "09:00",
      endTime: slot?.endTime ?? "18:00",
    };
  });
}

function mockSaveWeeklySchedule(stylistId: string, rows: WeeklyScheduleRow[]) {
  let schedule = stylistSchedules.find((item) => item.stylistId === stylistId);
  if (!schedule) {
    schedule = { stylistId, weeklySlots: [], unavailableDates: [] };
    stylistSchedules.push(schedule);
  }

  schedule.weeklySlots = rows
    .filter((row) => row.active)
    .map(
      (row): WeeklyScheduleSlot => ({
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      }),
    );
}

export function saveWeeklySchedule(stylistId: string, rows: WeeklyScheduleRow[]) {
  mockSaveWeeklySchedule(stylistId, rows);
}

export async function saveWeeklyScheduleAsync(
  stylistId: string,
  rows: WeeklyScheduleRow[],
): Promise<void> {
  const weeklySlots = rows
    .filter((row) => row.active)
    .map(
      (row): WeeklyScheduleSlot => ({
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      }),
    );

  if (!isApiEnabled()) {
    mockSaveWeeklySchedule(stylistId, rows);
    return;
  }

  try {
    const result = await apiFetch<{ weeklySlots: WeeklyScheduleSlot[] }>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/schedule`,
      {
        method: "PUT",
        body: JSON.stringify({ weeklySlots }),
      },
    );
    syncStylistSchedule(stylistId, result.weeklySlots ?? weeklySlots);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ذخیره برنامه کاری با خطا مواجه شد", 0);
  }
}

export function getActiveContract(stylistId: string) {
  return stylistContracts.find(
    (item) => item.stylistId === stylistId && item.isActive,
  );
}

export function getContractHistory(stylistId: string) {
  return stylistContracts
    .filter((item) => item.stylistId === stylistId && !item.isActive)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
}

export function getContractAuditLogs(stylistId: string) {
  return stylistContractAuditLogs
    .filter((item) => item.stylistId === stylistId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mockActorName() {
  return readSalonSessionUser()?.displayName?.trim() || "کاربر سالن";
}

function mockAppendContractAuditLog(
  stylistId: string,
  contractId: string,
  action: StylistContractAuditAction,
  previousData: StylistContract | undefined,
  newData: StylistContract,
) {
  const user = readSalonSessionUser();
  appendStylistContractAuditLog({
    id: `ctrlog_${Date.now().toString(36)}`,
    stylistId,
    contractId,
    action,
    changedByUserId: user?.userId,
    changedByName: mockActorName(),
    previousData,
    newData,
    createdAt: new Date().toISOString(),
  });
}

function buildContractPayload(input: ContractInput) {
  const payload: Record<string, unknown> = {
    type: input.type,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo || undefined,
    financialPeriod: input.financialPeriod,
    financialPeriodStartDay: 1,
  };

  switch (input.type) {
    case "percentage":
      payload.percentage = input.percentage;
      break;
    case "chair_rent":
      payload.chairRent = input.chairRent;
      break;
    case "fixed_salary":
      payload.fixedSalary = input.fixedSalary;
      break;
    case "fixed_salary_plus_commission":
      payload.fixedSalary = input.fixedSalary;
      payload.commissionPercentage = input.commissionPercentage;
      break;
  }

  return payload;
}

function mockSaveStylistContract(stylistId: string, input: ContractInput) {
  const current = getActiveContract(stylistId);
  if (current) {
    const previous = { ...current };
    current.isActive = false;
    current.effectiveTo = input.effectiveFrom;
    mockAppendContractAuditLog(
      stylistId,
      previous.id,
      "superseded",
      previous,
      { ...current },
    );
  }

  const created: StylistContract = {
    id: `ctr_${Date.now().toString(36)}`,
    stylistId,
    type: input.type,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    financialPeriod: input.financialPeriod,
    financialPeriodStartDay: 1,
    percentage: input.percentage,
    chairRent: input.chairRent,
    fixedSalary: input.fixedSalary,
    commissionPercentage: input.commissionPercentage,
    isActive: true,
  };
  stylistContracts.push(created);
  mockAppendContractAuditLog(stylistId, created.id, "created", undefined, created);
  return created;
}

export function saveStylistContract(stylistId: string, input: ContractInput) {
  return mockSaveStylistContract(stylistId, input);
}

export async function saveStylistContractAsync(
  stylistId: string,
  input: ContractInput,
): Promise<StylistContract> {
  if (!isApiEnabled()) {
    return mockSaveStylistContract(stylistId, input);
  }

  try {
    const saved = await apiFetch<StylistContract>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/contracts`,
      {
        method: "POST",
        body: JSON.stringify(buildContractPayload(input)),
      },
    );
    const contracts = await apiFetch<StylistContract[]>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/contracts`,
    );
    syncStylistContracts(stylistId, contracts);
    syncStylistContractAuditLogs(
      stylistId,
      await fetchContractAuditLogsSafe(stylistId),
    );
    return saved;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ذخیره قرارداد با خطا مواجه شد", 0);
  }
}

function mockUpdateActiveContract(stylistId: string, input: ContractInput) {
  const current = getActiveContract(stylistId);
  if (!current) return mockSaveStylistContract(stylistId, input);

  const previous = { ...current };
  current.type = input.type;
  current.effectiveFrom = input.effectiveFrom;
  current.effectiveTo = input.effectiveTo;
  current.financialPeriod = input.financialPeriod;
  current.financialPeriodStartDay = 1;
  current.percentage = input.percentage;
  current.chairRent = input.chairRent;
  current.fixedSalary = input.fixedSalary;
  current.commissionPercentage = input.commissionPercentage;
  mockAppendContractAuditLog(stylistId, current.id, "updated", previous, {
    ...current,
  });
  return current;
}

export function updateActiveContract(stylistId: string, input: ContractInput) {
  return mockUpdateActiveContract(stylistId, input);
}

export async function updateActiveContractAsync(
  stylistId: string,
  input: ContractInput,
): Promise<StylistContract> {
  if (!isApiEnabled()) {
    return mockUpdateActiveContract(stylistId, input);
  }

  const current = getActiveContract(stylistId);
  if (!current) {
    return saveStylistContractAsync(stylistId, input);
  }

  try {
    const saved = await apiFetch<StylistContract>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/contracts/${encodeURIComponent(current.id)}`,
      {
        method: "PUT",
        body: JSON.stringify(buildContractPayload(input)),
      },
    );
    const contracts = await apiFetch<StylistContract[]>(
      `/salon/stylists/${encodeURIComponent(stylistId)}/contracts`,
    );
    syncStylistContracts(stylistId, contracts);
    syncStylistContractAuditLogs(
      stylistId,
      await fetchContractAuditLogsSafe(stylistId),
    );
    return saved;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("به‌روزرسانی قرارداد با خطا مواجه شد", 0);
  }
}

export const contractAuditActionLabels: Record<
  StylistContractAuditAction,
  string
> = {
  created: "ایجاد",
  updated: "ویرایش",
  superseded: "جایگزینی",
};

export function stylistReadiness(stylistId: string): StylistReadiness {
  const stylist = getStylistById(stylistId);
  const assignments = stylistServices.filter(
    (item) => item.stylistId === stylistId && item.isActive,
  );
  const schedule = stylistSchedules.find((item) => item.stylistId === stylistId);
  const hasService = assignments.some((item) => {
    const service = services.find((svc) => svc.id === item.serviceId);
    return service?.isActive;
  });
  const hasPrice = assignments.some(
    (item) => item.startingPrice > 0 && item.isActive,
  );
  const hasSchedule = Boolean(schedule && schedule.weeklySlots.length > 0);
  const hasContract = Boolean(getActiveContract(stylistId));

  const bookingReady = Boolean(
    stylist?.isActive && hasService && hasPrice && hasSchedule,
  );

  return {
    bookingReady,
    settlementReady: hasContract,
    bookingChecks: {
      active: Boolean(stylist?.isActive),
      hasService,
      hasPrice,
      hasSchedule,
    },
    settlementChecks: {
      hasContract,
    },
  };
}

export function activeSalonServicesByCategory(categoryId: string) {
  return services.filter(
    (item) => item.isActive && item.categoryId === categoryId,
  );
}

export function unassignedActiveServices(stylistId: string, categoryId?: string) {
  const assignedIds = new Set(
    stylistServices
      .filter((item) => item.stylistId === stylistId && item.isActive)
      .map((item) => item.serviceId),
  );
  return services.filter(
    (item) =>
      item.isActive &&
      !assignedIds.has(item.id) &&
      (!categoryId || item.categoryId === categoryId),
  );
}

export const financialPeriodLabels: Record<FinancialPeriod, string> = {
  monthly: "ماهانه",
  weekly: "هفتگی",
  daily: "روزانه",
};
