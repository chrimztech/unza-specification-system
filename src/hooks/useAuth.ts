import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { hasValidSession } from "@/lib/session";
import type { AppRole, UserResponse } from "@/lib/api-types";

export type { AppRole };

export function useAuth() {
  const enabled = hasValidSession();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    enabled,
    queryFn: () => apiGet<UserResponse>("/api/auth/me"),
    retry: false,
  });

  const profile = meQuery.data ?? null;
  const roles = profile?.roles ?? [];
  const hasRole = (role: AppRole) => roles.includes(role);

  return {
    ready: true,
    userId: profile?.id ?? null,
    email: profile?.email ?? null,
    profile,
    profileLoading: enabled && meQuery.isLoading,
    roles,
    hasRole,
    isCict: hasRole("cict_reviewer") || hasRole("cict_manager") || hasRole("admin"),
    isOversight:
      hasRole("cict_reviewer") ||
      hasRole("cict_manager") ||
      hasRole("admin") ||
      hasRole("procurement") ||
      hasRole("stores") ||
      hasRole("cict_support") ||
      hasRole("auditor"),
    displayName: (profile?.fullName && profile.fullName.trim()) || profile?.email || "Staff member",
  };
}
