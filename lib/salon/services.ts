import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { serviceCategories, services } from "@/mock_ts/services";
import { DEMO_SALON_ID } from "@/mock_ts/salon";
import type { Service, ServiceCategory } from "@/types/domain";

export type ServiceFilter = {
  query?: string;
  categoryId?: string | "all";
  status?: "all" | "active" | "inactive";
};

export type ServiceInput = {
  name: string;
  categoryId: string;
  durationMinutes: number;
  minimumDeposit: number;
  isActive: boolean;
};

function syncCategoriesToMock(items: ServiceCategory[]) {
  serviceCategories.length = 0;
  serviceCategories.push(...items);
}

function syncServicesToMock(items: Service[]) {
  services.length = 0;
  services.push(...items);
}

function mockListCategories(): ServiceCategory[] {
  return [...serviceCategories].sort((a, b) => a.sortOrder - b.sortOrder);
}

function mockListServices(filter: ServiceFilter = {}): Service[] {
  const query = filter.query?.trim().toLowerCase() ?? "";
  const categoryId = filter.categoryId ?? "all";
  const status = filter.status ?? "all";

  return [...services]
    .filter((service) => {
      if (categoryId !== "all" && service.categoryId !== categoryId) {
        return false;
      }
      if (status === "active" && !service.isActive) return false;
      if (status === "inactive" && service.isActive) return false;
      if (!query) return true;
      const category =
        serviceCategories.find((item) => item.id === service.categoryId)?.name ??
        "";
      return (
        service.name.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.name.localeCompare(b.name, "fa");
    });
}

function upsertServiceToMock(service: Service) {
  const index = services.findIndex((item) => item.id === service.id);
  if (index >= 0) {
    services[index] = service;
  } else {
    services.push(service);
  }
}

export function listServiceCategories() {
  return mockListCategories();
}

export function listServices(filter: ServiceFilter = {}) {
  return mockListServices(filter);
}

export function listActiveServices(categoryId?: string | null) {
  return listServices({
    status: "active",
    categoryId: categoryId ?? "all",
  });
}

export function listCategoriesWithActiveServices() {
  const activeCategoryIds = new Set(
    listServices({ status: "active" }).map((item) => item.categoryId),
  );
  return listServiceCategories().filter((item) =>
    activeCategoryIds.has(item.id),
  );
}

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  if (!isApiEnabled()) {
    return mockListCategories();
  }

  try {
    const items = await apiFetch<ServiceCategory[]>(
      "/salon/services/categories",
    );
    syncCategoriesToMock(items);
    return [...items];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری دسته‌بندی خدمات با خطا مواجه شد", 0);
  }
}

export async function fetchServices(
  filter: ServiceFilter = {},
): Promise<Service[]> {
  if (!isApiEnabled()) {
    return mockListServices(filter);
  }

  try {
    const all = await apiFetch<Service[]>("/salon/services");
    syncServicesToMock(all);
    return mockListServices(filter);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری خدمات با خطا مواجه شد", 0);
  }
}

export function getServiceById(id: string) {
  return services.find((item) => item.id === id);
}

function mockSaveService(input: ServiceInput, id?: string): Service {
  if (id) {
    const existing = services.find((item) => item.id === id);
    if (!existing) {
      throw new ApiError("خدمت یافت نشد", 404);
    }
    existing.name = input.name.trim();
    existing.categoryId = input.categoryId;
    existing.durationMinutes = input.durationMinutes;
    existing.minimumDeposit = input.minimumDeposit;
    existing.isActive = input.isActive;
    return existing;
  }

  const created: Service = {
    id: `svc_${Date.now().toString(36)}`,
    salonId: DEMO_SALON_ID,
    name: input.name.trim(),
    categoryId: input.categoryId,
    durationMinutes: input.durationMinutes,
    minimumDeposit: input.minimumDeposit,
    isActive: input.isActive,
  };
  services.push(created);
  return created;
}

function mockToggleServiceActive(id: string) {
  const service = services.find((item) => item.id === id);
  if (!service) {
    throw new ApiError("خدمت یافت نشد", 404);
  }
  service.isActive = !service.isActive;
  return service;
}

export function saveService(input: ServiceInput, id?: string): Service {
  return mockSaveService(input, id);
}

export async function saveServiceAsync(
  input: ServiceInput,
  id?: string,
): Promise<Service> {
  if (!isApiEnabled()) {
    return mockSaveService(input, id);
  }

  try {
    const saved = id
      ? await apiFetch<Service>(`/salon/services/${id}`, {
          method: "PUT",
          body: JSON.stringify(input),
        })
      : await apiFetch<Service>("/salon/services", {
          method: "POST",
          body: JSON.stringify(input),
        });

    upsertServiceToMock(saved);
    return saved;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ذخیره خدمت با خطا مواجه شد", 0);
  }
}

export function toggleServiceActive(id: string) {
  mockToggleServiceActive(id);
}

export async function toggleServiceActiveAsync(id: string): Promise<Service> {
  if (!isApiEnabled()) {
    return mockToggleServiceActive(id);
  }

  try {
    const updated = await apiFetch<Service>(
      `/salon/services/${id}/toggle-active`,
      { method: "PATCH" },
    );
    upsertServiceToMock(updated);
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("تغییر وضعیت خدمت با خطا مواجه شد", 0);
  }
}
