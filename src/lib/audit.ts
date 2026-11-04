import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { AuditLogPageResponse, AuditLogResponse } from "@/lib/api-types";

export type AuditFilters = {
  from?: string | undefined;
  to?: string | undefined;
  actor?: string | undefined;
  entityType?: string | undefined;
  q?: string | undefined;
};

const CATEGORY_LABEL: Record<string, string> = {
  Auth: "Sign-in",
  Request: "Request workflow",
  RequestQuotation: "Quotation",
  QuotationEvaluation: "Quotation evaluation",
  RequestPurchase: "Purchase",
  RequestStoresReceipt: "Stores receipt",
  RequestVerification: "Verification",
  RequestAttachment: "Attachment",
  User: "User account",
  UserRole: "User role",
  OrgUnit: "Organisational unit",
  EquipmentCategory: "Equipment category",
  SpecProfile: "Specification profile",
  LookupValue: "List value",
  AppSetting: "System setting",
  Delegation: "Delegation",
  Document: "Document printed",
  AuditLog: "Audit log",
  Database: "Database",
};

const ACTION_LABEL: Record<string, string> = {
  sign_in: "Signed in",
  sign_in_failed: "Sign-in failed",
  sign_in_blocked: "Sign-in blocked (too many attempts)",
  document_printed: "Printed / saved as PDF",
  staff_account_created: "Staff account created",
  staff_account_updated: "Staff account updated",
  role_assigned: "Role assigned",
  role_removed: "Role removed",
  needs_return: "Flagged for return",
};

export function categoryLabel(entityType: string) {
  return CATEGORY_LABEL[entityType] ?? entityType.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function actionLabel(action: string) {
  if (ACTION_LABEL[action]) return ACTION_LABEL[action];
  const text = action.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Entries an auditor should notice at a glance. */
export function isWarning(e: AuditLogResponse) {
  return (
    e.action === "sign_in_failed" ||
    e.action === "sign_in_blocked" ||
    e.action === "delete" ||
    e.action === "database_restored"
  );
}

export function actorLabel(e: AuditLogResponse) {
  return e.actorName || e.actorEmail || "System";
}

function query(f: AuditFilters, page: number, size: number) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  for (const [k, v] of Object.entries(f)) if (v && v !== "all") params.set(k, v);
  return `/api/audit-log?${params.toString()}`;
}

export function fetchAuditPage(f: AuditFilters, page: number, size: number) {
  return apiGet<AuditLogPageResponse>(query(f, page, size));
}

/** The most entries a single export or printout will include. */
export const AUDIT_EXPORT_LIMIT = 2000;

export function useAuditPage(f: AuditFilters, page: number, size: number, enabled = true) {
  return useQuery({
    queryKey: ["audit-log", f, page, size],
    queryFn: () => fetchAuditPage(f, page, size),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useAuditCategories(enabled = true) {
  return useQuery({
    queryKey: ["audit-log", "entity-types"],
    queryFn: () => apiGet<string[]>("/api/audit-log/entity-types"),
    enabled,
    staleTime: 60_000,
  });
}
