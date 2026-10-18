export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Normalize to `…/api/v1` so a mis-set `https://host/api` (or bare origin)
 * still hits the Go routes under `/api/v1/...`.
 */
export function getApiBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "";
  if (!raw) return "";

  let base = raw.replace(/\/$/, "");
  if (base.endsWith("/api/v1")) return base;
  if (base.endsWith("/api")) return `${base}/v1`;
  if (/^https?:\/\//i.test(base) && !base.includes("/api")) {
    return `${base}/api/v1`;
  }
  return base;
}

export function isApiEnabled() {
  return getApiBaseUrl().length > 0;
}

/** API host without `/api/v1` — used for uploaded media URLs. */
export function getApiOrigin() {
  const base = getApiBaseUrl();
  if (!base) return "";
  return base.replace(/\/api\/v1\/?$/, "");
}

/** Resolve gallery/logo paths from API uploads vs Next.js public assets. */
export function resolveMediaUrl(path: string) {
  if (!path) return path;
  if (
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  if (path.startsWith("/uploads/")) {
    const origin = getApiOrigin();
    return origin ? `${origin}${path}` : path;
  }
  return path;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("mahoura:accessToken");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError("API URL is not configured", 0);
  }

  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("اتصال به سرور برقرار نشد", 0);
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-json error body */
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError("API URL is not configured", 0);
  }

  const token = getAccessToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError("اتصال به سرور برقرار نشد", 0);
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-json error body */
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
