"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/query-keys";
import { fetchPartners } from "@/features/partners/use-partners";
import { fetchZones } from "@/features/zones/use-zones";
import type { PartnerOption, VehicleOption, ZoneOption } from "./types";

export async function fetchAvailableVehicles(): Promise<VehicleOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, bike_id, reg_number")
    .is("current_driver_id", null)
    .eq("status", "active")
    .order("bike_id");

  if (error) throw error;
  return (data ?? []).map((v) => ({
    id: v.id,
    bike_id: v.bike_id,
    reg_number: v.reg_number,
  }));
}

export type DriverFormOptions = {
  partners: PartnerOption[];
  zones: ZoneOption[];
  vehicles: VehicleOption[];
};

export async function fetchDriverFormOptions(): Promise<DriverFormOptions> {
  const [partners, zones, vehicles] = await Promise.all([
    fetchPartners(),
    fetchZones(),
    fetchAvailableVehicles(),
  ]);

  return {
    partners: partners.map((p) => ({
      id: p.id,
      name: p.name,
      logo_url: p.logo_url,
    })),
    zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      code: z.code,
    })),
    vehicles,
  };
}

export function useDriverFormOptions() {
  return useQuery({
    queryKey: [...queryKeys.drivers.all(), "form-options"] as const,
    queryFn: fetchDriverFormOptions,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
