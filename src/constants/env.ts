function requireEnv(value: string | undefined, name: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is not configured.`);
  }

  return normalizedValue;
}

const authTokenKey = requireEnv(
  process.env.EXPO_PUBLIC_AUTH_TOKEN_KEY,
  "EXPO_PUBLIC_AUTH_TOKEN_KEY",
);

if (!/^[A-Za-z0-9._-]+$/.test(authTokenKey)) {
  throw new Error(
    "EXPO_PUBLIC_AUTH_TOKEN_KEY may contain only letters, numbers, periods, hyphens, and underscores.",
  );
}

export const ENV = {
  BASE_URL: process.env.EXPO_PUBLIC_BASE_URL,
  AUTH_TOKEN_KEY: authTokenKey,
} as const;
