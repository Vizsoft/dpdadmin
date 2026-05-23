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
  liveTracking: {
    all: () => ["live-tracking"] as const,
    history: (driverId: string, date: string) =>
      ["live-tracking", "history", driverId, date] as const,
  },
  partners: {
    all: () => ["partners"] as const,
    list: () => ["partners", "list"] as const,
    detail: (id: string) => ["partners", "detail", id] as const,
  },
  restaurants: {
    all: () => ["restaurants"] as const,
    list: () => ["restaurants", "list"] as const,
    partnerOptions: () => ["restaurants", "partner-options"] as const,
    zoneOptions: () => ["restaurants", "zone-options"] as const,
  },
  deliveries: {
    all: () => ["deliveries"] as const,
    list: (filters: Record<string, unknown> = {}) => ["deliveries", "list", filters] as const,
    detail: (id: string) => ["deliveries", "detail", id] as const,
    live: (zoneId?: string) => ["deliveries", "live", zoneId ?? "all"] as const,
  },
  verifications: {
    all: () => ["verifications"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["verifications", "list", filters] as const,
    detail: (id: string) => ["verifications", "detail", id] as const,
    importBatches: () => ["verifications", "import-batches"] as const,
    lookup: () => ["verifications", "lookup"] as const,
  },
  zones: {
    all: () => ["zones"] as const,
    list: () => ["zones", "list"] as const,
    detail: (id: string) => ["zones", "detail", id] as const,
    drivers: (zoneId: string) => ["zones", "drivers", zoneId] as const,
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
  attendance: {
    all: () => ["attendance"] as const,
    list: (filters: Record<string, unknown> = {}) => ["attendance", "list", filters] as const,
    kpis: (date: string) => ["attendance", "kpis", date] as const,
  },
  admin: {
    roles: () => ["admin", "roles"] as const,
    pendingProfiles: () => ["admin", "profiles", "pending"] as const,
  },
  dpd: {
    all: () => ["dpd"] as const,
    restaurants: () => ["dpd", "restaurants"] as const,
    deliveryRules: () => ["dpd", "delivery-rules"] as const,
    incentiveRules: () => ["dpd", "incentive-rules"] as const,
    scopeOptions: () => ["dpd", "scope-options"] as const,
  },
} as const;
