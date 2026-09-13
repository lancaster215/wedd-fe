import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

import { eventTypes } from "@/constants/eventTypes";
import { useAuth } from "@/context/auth-context";
import { apiJSON } from "@/services/api-client";

// GET /api/events/me returns a single profile (or null), not a list.
const eventSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    budget: z.union([z.string(), z.number()]),
    eventDate: z.string().datetime({ offset: true }),
    eventAddress: z.string(),
    eventType: z.string(),
    eventImage: z.string().nullish(),
  })
  .passthrough();

const eventsResponseSchema = z.object({ data: eventSchema.nullable() });

export type EventProfile = z.infer<typeof eventSchema>;

export type CreateEventInput = {
  userName: string;
  eventType: (typeof eventTypes)[number];
  eventAddress: string;
  eventDate: string;
  budget: number;
  eventImage?: string;
};

export async function createEvent(
  input: CreateEventInput,
): Promise<EventProfile> {
  const payload = await apiJSON("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return z.object({ data: eventSchema }).parse(payload).data;
}

export function useCreateEvent() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: eventKeys.mine(user?.id ?? null),
        exact: true,
      });
    },
  });
}

export type UpdateEventInput = Partial<CreateEventInput>;

export async function updateEvent(id: string, input: UpdateEventInput): Promise<EventProfile> {
  const payload = await apiJSON(`/api/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return z.object({ data: eventSchema }).parse(payload).data;
}

export function useUpdateEvent() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) => updateEvent(id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: eventKeys.mine(user?.id ?? null), exact: true });
    },
  });
}

export const eventKeys = {
  all: ["events"] as const,
  mine: (userId: string | null) => ["events", "me", userId] as const,
};

export async function getEvents(
  signal?: AbortSignal,
): Promise<EventProfile | null> {
  // apiJSON -> apiFetch reads getAuthToken() for each request.
  const payload = await apiJSON("/api/events/me", { method: "GET", signal });
  const result = eventsResponseSchema.safeParse(payload);
  if (!result.success)
    throw new Error("The server returned an invalid event response.");
  return result.data.data;
}

export function eventsQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: eventKeys.mine(userId),
    queryFn: ({ signal }) => getEvents(signal),
  });
}

export function useGetEvents() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  return useQuery({
    ...eventsQueryOptions(user?.id ?? null),
    enabled: isAuthenticated && !isInitializing,
  });
}

export default useGetEvents;
