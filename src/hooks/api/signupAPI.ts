import { ENV } from "@/constants/env";
import { APIErrorResponse } from "@/constants/types";
import { LoginAPIError } from "./loginAPI";

type SignupAPIResponse = {
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
  };
  message: string;
};

type SignupAPIPayload = {
  firstName: string;
  lastname: string;
  email: string;
  password: string;
  age: number;
  birthDate: string;
  newsletterOptIn: boolean;
};

export default async function signupAPI(
  data: SignupAPIPayload,
): Promise<SignupAPIResponse> {
  if (!ENV.BASE_URL) {
    throw new LoginAPIError("EXPO_PUBLIC_BASE_URL is not configured.", 0);
  }

  const response = await fetch(`${ENV.BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      firstName: data.firstName,
      lastname: data.lastname,
      email: data.email,
      password: data.password,
      age: data.age,
      birthDate: data.birthDate,
      newsletterOptIn: true,
    }),
  });

  const payload = (await response.json()) as
    | SignupAPIResponse
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

  return payload as SignupAPIResponse;
}
