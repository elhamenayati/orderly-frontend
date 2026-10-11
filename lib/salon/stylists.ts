import {
  contractForStylist,
  contractTypeLabels,
  formatScheduleRows,
} from "@/lib/salon/management";
import { stylistSpecialtyLabel } from "@/lib/salon/public-data";
import {
  syncStylistContracts,
  syncStylistSchedule,
  syncStylistServices,
  syncStylistsToMock,
  upsertStylist,
} from "@/lib/salon/stylist-store";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { serviceCategories, services } from "@/mock_ts/services";
import {
  stylistContracts,
  stylistSchedules,
  stylistServices,
  stylists,
} from "@/mock_ts/stylists";
import { DEMO_SALON_ID } from "@/mock_ts/salon";
import type {
  ContractType,
  Stylist,
  StylistContract,
  StylistService,
  WeeklyScheduleSlot,
} from "@/types/domain";

export type StylistFilter = {
  query?: string;
  status?: "all" | "active" | "inactive";
  serviceId?: string | "all";
  categoryId?: string | "all";
  contractType?: ContractType | "all" | "none";
};

export type StylistInput = {
  displayName: string;
  mobile: string;
  isActive?: boolean;
  gender?: Stylist["gender"];
  description?: string;
  avatarPath?: string;
};

function sortStylistsByName(items: Stylist[]): Stylist[] {
  return [...items].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "fa"),
  );
}

function buildStylistQuery(filter: StylistFilter) {
  const params = new URLSearchParams();
  const query = filter.query?.trim();
  if (query) params.set("query", query);
  if (filter.status && filter.status !== "all") {
    params.set("status", filter.status);
  }
  if (filter.serviceId && filter.serviceId !== "all") {
    params.set("serviceId", filter.serviceId);
  }
  if (filter.categoryId && filter.categoryId !== "all") {
    params.set("categoryId", filter.categoryId);
  }
  if (filter.contractType && filter.contractType !== "all") {
    params.set("contractType", filter.contractType);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function mockListStylists(filter: StylistFilter = {}): Stylist[] {
  const query = filter.query?.trim().toLowerCase() ?? "";
  const status = filter.status ?? "all";
  const serviceId = filter.serviceId ?? "all";
  const categoryId = filter.categoryId ?? "all";
  const contractType = filter.contractType ?? "all";

  const filtered = stylists.filter((stylist) => {
    if (status === "active" && !stylist.isActive) return false;
    if (status === "inactive" && stylist.isActive) return false;

    if (query) {
      const haystack = `${stylist.displayName} ${stylist.mobile}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (serviceId !== "all") {
      const hasService = stylistServices.some(
        (item) =>
          item.stylistId === stylist.id &&
          item.serviceId === serviceId &&
          item.isActive,
      );
      if (!hasService) return false;
    }

    if (categoryId !== "all") {
      const assignedServiceIds = stylistServices
        .filter((item) => item.stylistId === stylist.id && item.isActive)
        .map((item) => item.serviceId);
      const hasCategory = services.some(
        (service) =>
          assignedServiceIds.includes(service.id) &&
          service.categoryId === categoryId,
      );
      if (!hasCategory) return false;
    }

    if (contractType !== "all") {
      const contract = contractForStylist(stylist.id);
      if (contractType === "none") {
        if (contract) return false;
      } else if (!contract || contract.type !== contractType) {
        return false;
      }
    }

    return true;
  });
  return sortStylistsByName(filtered);
}

async function enrichStylistListContext(stylistIds: string[]) {
  if (stylistIds.length === 0) return;

  const contexts = await Promise.all(
    stylistIds.map(async (stylistId) => {
      const [serviceItems, scheduleRes, contractItems] = await Promise.all([
        apiFetch<StylistService[]>(
          `/salon/stylists/${encodeURIComponent(stylistId)}/services`,
        ),
        apiFetch<{ weeklySlots: WeeklyScheduleSlot[] }>(
          `/salon/stylists/${encodeURIComponent(stylistId)}/schedule`,
        ),
        apiFetch<StylistContract[]>(
          `/salon/stylists/${encodeURIComponent(stylistId)}/contracts`,
        ),
      ]);

      return {
        stylistId,
        serviceItems,
        weeklySlots: scheduleRes.weeklySlots ?? [],
        contractItems,
      };
    }),
  );

  for (const context of contexts) {
    syncStylistServices(context.stylistId, context.serviceItems);
    syncStylistSchedule(context.stylistId, context.weeklySlots);
    syncStylistContracts(context.stylistId, context.contractItems);
  }
}

export function listStylists(filter: StylistFilter = {}): Stylist[] {
  return mockListStylists(filter);
}

export async function fetchStylists(
  filter: StylistFilter = {},
): Promise<Stylist[]> {
  if (!isApiEnabled()) {
    return mockListStylists(filter);
  }

  try {
    const items = await apiFetch<Stylist[]>(
      `/salon/stylists${buildStylistQuery(filter)}`,
    );
    syncStylistsToMock(items);
    await enrichStylistListContext(items.map((item) => item.id));
    return sortStylistsByName(items);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری آرایشگران با خطا مواجه شد", 0);
  }
}

function mockCreateStylist(input: StylistInput): Stylist {
  const stylist: Stylist = {
    id: `sty_${Date.now().toString(36)}`,
    salonId: DEMO_SALON_ID,
    displayName: input.displayName.trim(),
    mobile: input.mobile.trim(),
    avatarPath: input.avatarPath ?? "/images/salon/stylist-placeholder.svg",
    gender: input.gender,
    description: input.description?.trim() || undefined,
    isActive: input.isActive ?? true,
  };
  stylists.push(stylist);
  stylistSchedules.push({
    stylistId: stylist.id,
    weeklySlots: [],
    unavailableDates: [],
  });
  return stylist;
}

export function createStylist(input: StylistInput): Stylist {
  return mockCreateStylist(input);
}

function buildStylistPayload(input: StylistInput) {
  const avatarPath =
    input.avatarPath && !input.avatarPath.startsWith("data:")
      ? input.avatarPath
      : undefined;

  return {
    displayName: input.displayName.trim(),
    mobile: input.mobile.trim(),
    isActive: input.isActive ?? true,
    gender: input.gender,
    description: input.description?.trim() || undefined,
    avatarPath,
  };
}

export async function createStylistAsync(input: StylistInput): Promise<Stylist> {
  if (!isApiEnabled()) {
    return mockCreateStylist(input);
  }

  try {
    const created = await apiFetch<Stylist>("/salon/stylists", {
      method: "POST",
      body: JSON.stringify(buildStylistPayload(input)),
    });
    upsertStylist(created);
    syncStylistSchedule(created.id, []);
    syncStylistServices(created.id, []);
    syncStylistContracts(created.id, []);
    return created;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ایجاد آرایشگر با خطا مواجه شد", 0);
  }
}

export function stylistServicesLabel(stylistId: string) {
  const assigned = stylistServices
    .filter((item) => item.stylistId === stylistId && item.isActive)
    .map((item) => services.find((service) => service.id === item.serviceId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (assigned.length === 0) {
    return stylistSpecialtyLabel(stylistId);
  }

  return [...new Set(assigned.map((item) => item.name))].join("، ");
}

export function stylistContractTypeLabel(stylistId: string) {
  const contract = contractForStylist(stylistId);
  if (!contract) return "—";
  return contractTypeLabels[contract.type];
}

export function stylistScheduleSummary(stylistId: string) {
  const rows = formatScheduleRows(stylistId);
  if (rows.length === 0) return "—";
  return rows.map((row) => `${row.days} | ${row.time}`).join(" · ");
}

export function listStylistFilterServices() {
  return services.filter((item) => item.isActive);
}

export function listStylistFilterCategories() {
  return [...serviceCategories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export const stylistContractTypeFilters: Array<{
  value: StylistFilter["contractType"];
  label: string;
}> = [
  { value: "all", label: "همه قراردادها" },
  { value: "percentage", label: "درصدی" },
  { value: "chair_rent", label: "اجاره صندلی" },
  { value: "fixed_salary", label: "حقوق ثابت" },
  {
    value: "fixed_salary_plus_commission",
    label: "حقوق ثابت + پورسانت",
  },
  { value: "none", label: "بدون قرارداد" },
];
