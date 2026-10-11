import { ApiError, apiFetch, apiUpload, isApiEnabled } from "@/lib/api/client";
import { updateSalonSessionBrandName } from "@/lib/salon/auth";
import { salon, salonSchedule } from "@/mock_ts/salon";
import { syncClosedDatesFromExceptions, WEEK_DAYS } from "@/lib/salon/schedule";
import type {
  SalonScheduleException,
  SalonScheduleExceptionType,
  WeeklyScheduleSlot,
} from "@/types/domain";

export type SalonProfileInput = {
  brandName: string;
  phone: string;
  address: string;
  galleryImagePaths: string[];
};

export type WeeklyHoursInput = Array<{
  dayOfWeek: WeeklyScheduleSlot["dayOfWeek"];
  active: boolean;
  startTime: string;
  endTime: string;
}>;

export type ScheduleExceptionInput = {
  date: string;
  dateTo?: string;
  type: SalonScheduleExceptionType;
  startTime?: string;
  endTime?: string;
  note?: string;
};

export type SalonSettingsData = {
  profile: SalonProfileInput;
  weeklyHours: WeeklyHoursInput;
};

type ApiScheduleException = SalonScheduleException;

let exceptionCounter = 100;

function nextExceptionId() {
  exceptionCounter += 1;
  return `exc_${exceptionCounter}`;
}

function notifySalonProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("salon-profile-updated"));
}

function applyProfileToMock(profile: SalonProfileInput) {
  salon.brandName = profile.brandName.trim();
  salon.phone = profile.phone.trim();
  salon.mobile = profile.phone.trim();
  salon.address = profile.address.trim();
  salon.galleryImagePaths = [...profile.galleryImagePaths];
  salon.legalName = salon.brandName;
  notifySalonProfileUpdated();
  updateSalonSessionBrandName(salon.brandName);
}

function applyWeeklyHoursToMock(rows: WeeklyHoursInput) {
  salonSchedule.weeklySlots = rows
    .filter((row) => row.active)
    .map((row) => ({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
    }));
}

function applyExceptionToDomain(item: ApiScheduleException): SalonScheduleException {
  return {
    id: item.id,
    salonId: item.salonId,
    date: item.date,
    dateTo: item.dateTo,
    type: item.type,
    startTime: item.startTime,
    endTime: item.endTime,
    note: item.note,
    status: "active",
  };
}

function applySettingsToMock(data: SalonSettingsData) {
  applyProfileToMock(data.profile);
  applyWeeklyHoursToMock(data.weeklyHours);
}

function weeklyRowsFromMock(): WeeklyHoursInput {
  return WEEK_DAYS.map(({ dayOfWeek }) => {
    const slot = salonSchedule.weeklySlots.find(
      (item) => item.dayOfWeek === dayOfWeek,
    );
    return {
      dayOfWeek,
      active: Boolean(slot),
      startTime: slot?.startTime ?? "09:00",
      endTime: slot?.endTime ?? "19:00",
    };
  });
}

function mockSettingsData(): SalonSettingsData {
  return {
    profile: {
      brandName: salon.brandName,
      phone: salon.phone ?? salon.mobile,
      address: salon.address,
      galleryImagePaths: salon.galleryImagePaths ?? [],
    },
    weeklyHours: weeklyRowsFromMock(),
  };
}

export async function fetchSalonSettings(): Promise<SalonSettingsData> {
  if (!isApiEnabled()) {
    return mockSettingsData();
  }

  const data = await apiFetch<SalonSettingsData>("/salon/settings");
  applySettingsToMock(data);
  return data;
}

export function saveSalonProfile(input: SalonProfileInput) {
  applyProfileToMock(input);
}

export function saveWeeklyHours(rows: WeeklyHoursInput) {
  applyWeeklyHoursToMock(rows);
}

export async function listScheduleExceptions(): Promise<SalonScheduleException[]> {
  if (!isApiEnabled()) {
    return [...salonSchedule.exceptions].sort((a, b) => b.date.localeCompare(a.date));
  }

  const items = await apiFetch<ApiScheduleException[]>("/salon/settings/exceptions");
  salonSchedule.exceptions = items.map(applyExceptionToDomain);
  syncClosedDatesFromExceptions();
  return [...salonSchedule.exceptions];
}

export function addScheduleException(input: ScheduleExceptionInput) {
  const exception: SalonScheduleException = {
    id: nextExceptionId(),
    salonId: salon.id,
    date: input.date,
    dateTo: input.dateTo,
    type: input.type,
    startTime: input.type === "special_hours" ? input.startTime : undefined,
    endTime: input.type === "special_hours" ? input.endTime : undefined,
    note: input.note?.trim() || undefined,
    status: "active",
  };
  salonSchedule.exceptions.push(exception);
  syncClosedDatesFromExceptions();
  return exception;
}

export async function addScheduleExceptionAsync(input: ScheduleExceptionInput) {
  if (!isApiEnabled()) {
    return addScheduleException(input);
  }

  const item = await apiFetch<ApiScheduleException>("/salon/settings/exceptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const exception = applyExceptionToDomain(item);
  salonSchedule.exceptions.push(exception);
  syncClosedDatesFromExceptions();
  return exception;
}

export function updateScheduleException(id: string, input: ScheduleExceptionInput) {
  const target = salonSchedule.exceptions.find((item) => item.id === id);
  if (!target) return null;

  target.date = input.date;
  target.dateTo = input.dateTo;
  target.type = input.type;
  target.startTime = input.type === "special_hours" ? input.startTime : undefined;
  target.endTime = input.type === "special_hours" ? input.endTime : undefined;
  target.note = input.note?.trim() || undefined;
  syncClosedDatesFromExceptions();
  return target;
}

export async function updateScheduleExceptionAsync(
  id: string,
  input: ScheduleExceptionInput,
) {
  if (!isApiEnabled()) {
    return updateScheduleException(id, input);
  }

  const item = await apiFetch<ApiScheduleException>(
    `/salon/settings/exceptions/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
  const exception = applyExceptionToDomain(item);
  const index = salonSchedule.exceptions.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    salonSchedule.exceptions[index] = exception;
  }
  syncClosedDatesFromExceptions();
  return exception;
}

export function deleteScheduleException(id: string) {
  const index = salonSchedule.exceptions.findIndex((item) => item.id === id);
  if (index === -1) return false;
  salonSchedule.exceptions.splice(index, 1);
  syncClosedDatesFromExceptions();
  return true;
}

export async function deleteScheduleExceptionAsync(id: string) {
  if (!isApiEnabled()) {
    return deleteScheduleException(id);
  }

  await apiFetch<void>(`/salon/settings/exceptions/${id}`, {
    method: "DELETE",
  });
  return deleteScheduleException(id);
}

export async function saveSalonSettings(input: SalonSettingsData) {
  if (!isApiEnabled()) {
    applySettingsToMock(input);
    return input;
  }

  try {
    const saved = await apiFetch<SalonSettingsData>("/salon/settings", {
      method: "PUT",
      body: JSON.stringify(input),
    });
    applySettingsToMock(saved);
    return saved;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("ذخیره تنظیمات با خطا مواجه شد", 0);
  }
}

const MAX_GALLERY_IMAGE_BYTES = 5 * 1024 * 1024;
const GALLERY_ACCEPT = "image/jpeg,image/png,image/webp";

export const salonGalleryAccept = GALLERY_ACCEPT;
export const salonGalleryMaxBytes = MAX_GALLERY_IMAGE_BYTES;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new ApiError("خواندن تصویر با خطا مواجه شد", 0));
    };
    reader.onerror = () => {
      reject(new ApiError("خواندن تصویر با خطا مواجه شد", 0));
    };
    reader.readAsDataURL(file);
  });
}

export function validateSalonGalleryFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "فقط فایل تصویری مجاز است";
  }
  if (!GALLERY_ACCEPT.split(",").includes(file.type)) {
    return "فرمت مجاز: JPG، PNG یا WebP";
  }
  if (file.size > MAX_GALLERY_IMAGE_BYTES) {
    return "حداکثر حجم تصویر ۵ مگابایت است";
  }
  return null;
}

export async function uploadSalonGalleryImage(file: File): Promise<string> {
  const validationError = validateSalonGalleryFile(file);
  if (validationError) {
    throw new ApiError(validationError, 400);
  }

  if (!isApiEnabled()) {
    return readFileAsDataUrl(file);
  }

  const formData = new FormData();
  formData.append("file", file);
  const result = await apiUpload<{ path: string }>(
    "/salon/settings/gallery",
    formData,
  );
  return result.path;
}
