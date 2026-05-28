"use client";

import useSWR from "swr";

import { api } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

export function useHealth() {
  const { data, error } = useSWR<HealthResponse>("health", () => api.health(), {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
  });
  return {
    health: data,
    isLoading: !data && !error,
    isError: Boolean(error),
  };
}
