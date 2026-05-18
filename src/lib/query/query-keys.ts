/**
 * Central query key factories — keeps invalidation and prefetch stable across the app.
 * Example: queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() })
 */
export const queryKeys = {
  app: {
    buildId: () => ["app", "build-id"] as const,
  },
  drivers: {
    all: () => ["drivers"] as const,
    list: (filters: Record<string, unknown> = {}) => ["drivers", "list", filters] as const,
    detail: (id: string) => ["drivers", "detail", id] as const,
  },
  deliveries: {
    all: () => ["deliveries"] as const,
    live: (zoneId?: string) => ["deliveries", "live", zoneId ?? "all"] as const,
  },
  vehicles: {
    all: () => ["vehicles"] as const,
    list: (filters: Record<string, unknown> = {}) => ["vehicles", "list", filters] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
  },
  requests: {
    all: () => ["requests"] as const,
    list: (filters: Record<string, unknown> = {}) => ["requests", "list", filters] as const,
  },
  admin: {
    roles: () => ["admin", "roles"] as const,
    pendingProfiles: () => ["admin", "profiles", "pending"] as const,
  },
} as const;
