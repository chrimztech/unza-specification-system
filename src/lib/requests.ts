import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RequestResponse } from "@/lib/api-types";

/** Every request visible to the signed-in user, scoped server-side. */
export function useRequests() {
  return useQuery({
    queryKey: ["requests", "all"],
    queryFn: () => apiGet<RequestResponse[]>("/api/requests"),
  });
}

export function unitName(r: Pick<RequestResponse, "orgUnit" | "orgUnitName">) {
  return r.orgUnit?.name ?? r.orgUnitName ?? null;
}
