import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { AppSettingResponse, LookupValueResponse } from "@/lib/api-types";
import {
  BUDGET_STATUSES,
  BUSINESS_CONTEXTS,
  DECLARATION_TEXT,
  POSITION_LEVELS,
  PRIORITIES,
  REQUEST_TYPES,
} from "@/lib/domain";

export type LookupList =
  | "position_level"
  | "request_type"
  | "business_context"
  | "priority"
  | "budget_status"
  | "spec_tier"
  | "asset_class"
  | "campus"
  | "role"
  | "software_category"
  | "designation";

export type LookupOption = { value: string; label: string };

const FALLBACK: Record<string, LookupOption[]> = {
  position_level: POSITION_LEVELS.map((v) => ({ value: v, label: v })),
  request_type: REQUEST_TYPES.map((v) => ({ value: v, label: v })),
  business_context: BUSINESS_CONTEXTS.map((v) => ({ value: v, label: v })),
  priority: PRIORITIES,
  budget_status: BUDGET_STATUSES.map((v) => ({ value: v, label: v })),
  spec_tier: ["Standard", "Enhanced", "Specialised"].map((v) => ({ value: v, label: v })),
  asset_class: [],
  campus: [],
  software_category: ["Design", "Teaching", "Development", "Other"].map((v) => ({
    value: v,
    label: v,
  })),
  designation: [
    "Vice-Chancellor",
    "Deputy Vice-Chancellor",
    "Registrar",
    "Bursar / CFO",
    "Dean",
    "Deputy Dean",
    "Assistant Dean",
    "Head of Department",
    "Director",
    "Deputy Director",
    "Assistant Director",
    "Top Management",
    "Executive Management",
    "Manager",
    "Professor",
    "Associate Professor",
    "Principal Lecturer",
    "Senior Lecturer",
    "Lecturer",
    "Assistant Lecturer",
    "Researcher",
    "Specialist",
    "Academic Staff",
    "Principal Officer",
    "Senior Officer",
    "Officer",
    "Technician",
    "Technical Staff",
    "Non-Academic Staff",
    "Support Staff",
    "Other",
  ].map((v) => ({ value: v, label: v })),
  role: [
    { value: "requester", label: "Requester" },
    { value: "manager", label: "Manager" },
    { value: "cict_reviewer", label: "CICT reviewer" },
    { value: "cict_manager", label: "CICT manager" },
    { value: "procurement", label: "Procurement" },
    { value: "stores", label: "Stores" },
    { value: "cict_support", label: "CICT Support" },
    { value: "auditor", label: "Auditor" },
    { value: "admin", label: "Administrator" },
  ],
};

/** All configurable drop-down lists, keyed by list name. */
export function useLookupLists(includeInactive = false) {
  return useQuery({
    queryKey: ["lookup-values", includeInactive],
    staleTime: 60_000,
    queryFn: () =>
      apiGet<LookupValueResponse[]>(`/api/lookup-values?includeInactive=${includeInactive}`),
  });
}

/** Options for one configurable list, falling back to the built-in values. */
export function useLookup(list: LookupList): LookupOption[] {
  const { data } = useLookupLists();
  const rows = (data ?? []).filter((r) => r.listKey === list);
  if (rows.length === 0) return FALLBACK[list] ?? [];
  return rows.map((r) => ({ value: r.value, label: r.label }));
}

/** Editable system settings (declaration text, contact details, SLA days…). */
export function useSettings() {
  const query = useQuery({
    queryKey: ["app-settings"],
    staleTime: 60_000,
    queryFn: () => apiGet<AppSettingResponse[]>("/api/settings"),
  });

  const map = new Map((query.data ?? []).map((r) => [r.key, r.value]));
  const DEFAULTS: Record<string, string> = {
    declaration_text: DECLARATION_TEXT,
    organisation_name: "University of Zambia",
    unit_name: "CICT · Equipment Specifications",
    support_email: "cictsupport@unza.ac.zm",
    manager_sla_days: "3",
    cict_sla_days: "5",
  };

  return {
    ...query,
    rows: query.data ?? [],
    setting: (key: string) => map.get(key) ?? DEFAULTS[key] ?? "",
  };
}
