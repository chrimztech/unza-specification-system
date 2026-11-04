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

/** Filters shared by the request register on screen and its printed copy. */
export type RequestFilters = {
  status?: string;
  scope?: string;
  q?: string;
  unit?: string;
  /** Raised on or after this date (yyyy-mm-dd). */
  from?: string;
  /** Raised on or before this date (yyyy-mm-dd). */
  to?: string;
};

export function filterRequests(
  all: RequestResponse[],
  f: RequestFilters,
  userId: string | null,
): RequestResponse[] {
  const q = (f.q ?? "").trim().toLowerCase();
  return [...all]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .filter((r) => {
      if (f.status && f.status !== "all" && r.status !== f.status) return false;
      if (f.scope === "mine" && r.requester.id !== userId && r.submittedBy.id !== userId)
        return false;
      if (f.scope === "approvals" && r.manager?.id !== userId) return false;
      if (f.unit && f.unit !== "all" && unitName(r) !== f.unit) return false;
      const day = r.createdAt.slice(0, 10);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
      if (q && !`${r.reference} ${r.title ?? ""} ${unitName(r) ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
}

/** Search-param validator for printable pages: keeps only non-empty string values. */
export function stringParams<K extends string>(keys: readonly K[]) {
  return (search: Record<string, unknown>): Partial<Record<K, string>> => {
    const out: Partial<Record<K, string>> = {};
    for (const k of keys) {
      const v = search[k];
      if (typeof v === "string" && v.trim() !== "") out[k] = v;
    }
    return out;
  };
}

/** Downloads rows as a CSV file that opens cleanly in Excel (UTF-8 with BOM). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) =>
    `"${String(v ?? "")
      .replace(/"/g, '""')
      .replace(/\r?\n/g, " ")}"`;
  const lines = [header.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** A human description of the active filters, printed under a report's title. */
export function describeFilters(parts: [string, string | undefined][]): string {
  const active = parts.filter(([, v]) => v && v !== "all").map(([k, v]) => `${k}: ${v}`);
  return active.length ? active.join(" · ") : "No filters (all records)";
}

/** Drops empty values, so optional search params are omitted rather than set to undefined. */
export function compact<T extends Record<string, string | undefined>>(
  o: T,
): { [K in keyof T]?: string } {
  const out: { [K in keyof T]?: string } = {};
  for (const k of Object.keys(o) as (keyof T)[]) {
    const v = o[k];
    if (v) out[k] = v;
  }
  return out;
}
