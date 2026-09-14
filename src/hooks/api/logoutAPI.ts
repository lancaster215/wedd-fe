import { ENV } from "@/constants/env";
import { APIErrorResponse } from "@/constants/types";

export type LogoutAPIResponse = {
  data: {
    success: boolean;
  };
  message: string;
};

export class LogoutAPIError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "LogoutAPIError";
  }
}

export default async function logoutAPI(): Promise<LogoutAPIResponse> {
  if (!ENV.BASE_URL) {
    throw new LogoutAPIError("EXPO_PUBLIC_BASE_URL is not configured.", 0);
  }

  const response = await fetch(`${ENV.BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const payload = (await response.json()) as
    | LogoutAPIResponse
    | APIErrorResponse;

  if (!response.ok) {
    const apiError = (payload as APIErrorResponse).error;
    throw new LogoutAPIError(
      apiError?.message ?? `Login failed with status ${response.status}.`,
      response.status,
      apiError?.code,
      apiError?.details,
    );
  }

  return payload as LogoutAPIResponse;
}
