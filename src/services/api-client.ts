import { ENV } from "@/constants/env";
import { getAuthToken } from "@/services/auth-token";

export class APIError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "APIError";
  }
}

export async function apiJSON(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await apiFetch(path, init);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload as { error?: { message?: unknown } } | null;
    throw new APIError(
      typeof error?.error?.message === "string"
        ? error.error.message
        : `Request failed with status ${response.status}.`,
      response.status,
    );
  }
  return payload;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!ENV.BASE_URL) {
    throw new Error("EXPO_PUBLIC_BASE_URL is not configured.");
  }

  const headers = new Headers(init.headers);
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${ENV.BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}
