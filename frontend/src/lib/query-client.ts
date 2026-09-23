import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-error";

const NO_RETRY_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();
