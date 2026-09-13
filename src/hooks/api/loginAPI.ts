import { ENV } from "@/constants/env";
import { APIErrorResponse } from "@/constants/types";

export type LoginAPIPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "VENDOR" | "ADMIN";
  status: string;
};

export type LoginAPIResponse = {
  data: {
    token: string;
    user: AuthUser;
    session: {
      id: string;
      expiresAt: string;
    };
  };
  message: string;
};

export class LoginAPIError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "LoginAPIError";
  }
}

export default async function loginAPI(
  data: LoginAPIPayload,
): Promise<LoginAPIResponse> {
  if (!ENV.BASE_URL) {
    throw new LoginAPIError("EXPO_PUBLIC_BASE_URL is not configured.", 0);
  }

  const response = await fetch(`${ENV.BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });

  const payload = (await response.json()) as
    | LoginAPIResponse
    | APIErrorResponse;

  if (!response.ok) {
    const apiError = (payload as APIErrorResponse).error;
    throw new LoginAPIError(
      apiError?.message ?? `Login failed with status ${response.status}.`,
      response.status,
      apiError?.code,
      apiError?.details,
    );
  }

  return payload as LoginAPIResponse;
}
