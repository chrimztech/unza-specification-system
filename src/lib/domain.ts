export type RequestStatus =
  | "draft"
  | "pending_manager"
  | "pending_cict"
  | "needs_clarification"
  | "approved"
  | "procurement"
  | "purchased"
  | "in_stores"
  | "completed"
  | "return_required"
  | "rejected"
  | "withdrawn";

export const STATUS_LABEL: Record<RequestStatus, string> = {
  draft: "Draft",
  pending_manager: "Awaiting manager",
  pending_cict: "With CICT",
  needs_clarification: "Clarification needed",
  approved: "CICT approved",
  procurement: "With procurement",
  purchased: "Purchased",
  in_stores: "In stores",
  completed: "Completed",
  return_required: "Return required",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const REQUEST_TYPES = [
  "New requirement",
  "Replacement",
  "Upgrade",
  "Expansion",
  "Shared resource",
  "Project requirement",
  "Temporary need",
];

export const BUSINESS_CONTEXTS = [
  "Administration",
  "Teaching",
  "Research",
  "Laboratory",
  "Student service",
  "Grant / project",
];

export const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const POSITION_LEVELS = [
  "Support staff",
  "Officer",
  "Senior Officer",
  "Principal Officer",
  "Technician",
  "Assistant Lecturer",
  "Lecturer",
  "Senior Lecturer",
  "Principal Lecturer",
  "Researcher",
  "Specialist",
  "Manager",
  "Assistant Director",
  "Deputy Director",
  "Associate Professor",
  "Professor",
  "Head of Department",
  "Deputy Dean",
  "Dean",
  "Registrar",
  "Bursar",
  "Director",
  "Top management",
  "Executive management",
];

export const BUDGET_STATUSES = [
  "Budgeted for current year",
  "Not yet budgeted",
  "Funded by project or grant",
  "Unknown",
];

export const DECLARATION_TEXT =
  "I confirm that the information provided is accurate, that the equipment is required for authorised University of Zambia use, and that I have not knowingly submitted a duplicate request.";

export type RecommendableProfile = {
  id: string;
  categoryId: string;
  name: string;
  tier: string;
  suitsPositionLevels: string[];
};

const TIER_ORDER = ["Standard", "Enhanced", "Specialised"];

/**
 * Live client-side preview of the tier CICT is likely to recommend, before a request is saved.
 * Mirrors SpecProfileService.recommend() on the backend, including the numberOfUsers escalation:
 * a shared item's user count can push the recommendation up a tier — e.g. a printer shared by a
 * whole office needs higher-volume capacity than one person's desk printer.
 */
export function recommendTier(
  profiles: RecommendableProfile[],
  categoryId: string | null,
  positionLevel: string | null | undefined,
  numberOfUsers?: number | null,
) {
  if (!categoryId) return null;
  const forCategory = profiles.filter((p) => p.categoryId === categoryId);
  if (forCategory.length === 0) return null;
  const normalizedLevel = positionLevel?.trim().toLowerCase();
  const matched = normalizedLevel
    ? forCategory.find((p) =>
        p.suitsPositionLevels?.some((level) => level.trim().toLowerCase() === normalizedLevel),
      )
    : undefined;
  const fallback = [...forCategory].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  )[0];
  const base = matched ?? fallback ?? null;
  if (!base || !numberOfUsers || numberOfUsers <= 1) return base;

  const requiredTierIndex = numberOfUsers > 15 ? 2 : numberOfUsers > 5 ? 1 : 0;
  if (TIER_ORDER.indexOf(base.tier) >= requiredTierIndex) return base;
  const escalated = [...forCategory]
    .filter((p) => TIER_ORDER.indexOf(p.tier) >= requiredTierIndex)
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))[0];
  return escalated ?? base;
}

export function statusTone(status: RequestStatus) {
  switch (status) {
    case "approved":
    case "completed":
      return "bg-success/12 text-success border-success/30";
    case "rejected":
    case "withdrawn":
    case "return_required":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "needs_clarification":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "pending_cict":
    case "procurement":
      return "bg-info/10 text-info border-info/30";
    case "pending_manager":
    case "purchased":
    case "in_stores":
      return "bg-accent/20 text-accent-foreground border-accent/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
