import { ApiError, apiUpload, isApiEnabled } from "@/lib/api/client";

const MAX_STYLIST_AVATAR_BYTES = 1 * 1024 * 1024;
const STYLIST_AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

export const stylistAvatarAccept = STYLIST_AVATAR_ACCEPT;
export const stylistAvatarMaxBytes = MAX_STYLIST_AVATAR_BYTES;

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

export function validateStylistAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "فقط فایل تصویری مجاز است";
  }
  if (!STYLIST_AVATAR_ACCEPT.split(",").includes(file.type)) {
    return "فرمت مجاز: JPG، PNG یا WebP";
  }
  if (file.size > MAX_STYLIST_AVATAR_BYTES) {
    return "حداکثر حجم تصویر ۱ مگابایت است";
  }
  return null;
}

export async function uploadStylistAvatar(
  stylistId: string | null,
  file: File,
): Promise<string> {
  const validationError = validateStylistAvatarFile(file);
  if (validationError) {
    throw new ApiError(validationError, 400);
  }

  if (!isApiEnabled() || !stylistId) {
    return readFileAsDataUrl(file);
  }

  const formData = new FormData();
  formData.append("file", file);
  const result = await apiUpload<{ path: string }>(
    `/salon/stylists/${encodeURIComponent(stylistId)}/avatar`,
    formData,
  );
  return result.path;
}
