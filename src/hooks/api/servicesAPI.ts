import { useAuth } from "@/context/auth-context";
import { apiJSON } from "@/services/api-client";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

const vendorSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  location: z.string(),
  averageRating: z.number(),
  ratingsCount: z.number(),
});

const serviceSchema = z.object({
  id: z.string(),
  vendorProfileId: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  price_model: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  gallery: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["image", "video"]),
      url: z.string(),
      mimeType: z.string().nullish(),
      position: z.number(),
    }),
  ),
  vendorProfile: vendorSchema,
});

const servicesResponseSchema = z.object({ data: z.array(serviceSchema) });

export type ServiceProfile = z.infer<typeof serviceSchema>;

export const serviceKeys = {
  all: ["services"] as const,
  mine: (userId: string | null) => ["services", "me", userId] as const,
};

const PAGE_SIZE = 20;

export async function getServices(
  vendorProfileId: string,
  offset = 0,
  signal?: AbortSignal,
): Promise<ServiceProfile[]> {
  const query = new URLSearchParams({
    vendorProfileId,
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  const payload = await apiJSON(`/api/services?${query}`, {
    method: "GET",
    signal,
  });
  const result = servicesResponseSchema.safeParse(payload);
  if (!result.success)
    throw new Error("The server returned an invalid services response.");
  return result.data.data;
}

export function useGetServices() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  return useInfiniteQuery({
    queryKey: serviceKeys.mine(user?.id ?? null),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const profile = z
        .object({ data: vendorSchema })
        .parse(await apiJSON("/api/vendors/me", { signal }));
      const services = await getServices(profile.data.id, pageParam, signal);
      return { services, vendor: profile.data };
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.services.length === PAGE_SIZE
        ? pages.length * PAGE_SIZE
        : undefined,
    enabled: isAuthenticated && !isInitializing && user?.role === "VENDOR",
  });
}

export function useUpdateService() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: FormData }) => {
      const payload = await apiJSON(
        id ? `/api/services/${encodeURIComponent(id)}` : "/api/services",
        { method: "POST", body },
      );
      return z.object({ data: serviceSchema }).parse(payload).data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export async function deleteService(id: string): Promise<void> {
  await apiJSON(`/api/services/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function useDeleteService() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: deleteService,
    onSuccess: async (_, id) => {
      const queryKey = serviceKeys.mine(user?.id ?? null);
      await client.cancelQueries({ queryKey, exact: true });
      client.setQueryData<ReturnType<typeof useGetServices>["data"]>(queryKey, (data) =>
        data ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            services: page.services.filter((service) => service.id !== id),
          })),
        } : data,
      );
      await client.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export default useGetServices;
