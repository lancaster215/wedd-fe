import { QueryClient } from "@tanstack/react-query";

import { APIError } from "@/services/api-client";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) =>
          !(error instanceof APIError && error.status >= 400 && error.status < 500)
          && failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}
