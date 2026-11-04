import type { RequestResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";

const OPEN = ["pending_manager", "pending_cict", "needs_clarification"];
const IN_FULFILMENT = ["approved", "procurement", "purchased", "in_stores", "return_required"];

function countBy(rows: RequestResponse[], key: (r: RequestResponse) => string) {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function averageDays(
  rows: RequestResponse[],
  start: keyof RequestResponse,
  end: keyof RequestResponse,
) {
  const done = rows.filter((r) => r[start] && r[end]);
  if (done.length === 0) return null;
  const total = done.reduce(
    (sum, r) =>
      sum +
      (new Date(r[end] as string).getTime() - new Date(r[start] as string).getTime()) / 86_400_000,
    0,
  );
  return { days: total / done.length, count: done.length };
}

/** Every figure on the Reports page, shared by the screen and the printed report. */
export function computeReport(all: RequestResponse[], from?: string, to?: string) {
  const rows = all
    .filter((r) => {
      const day = r.createdAt.slice(0, 10);
      return (!from || day >= from) && (!to || day <= to);
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const items = rows.flatMap((r) => r.items.map((i) => ({ r, i })));
  const byCategory = (() => {
    const counts = new Map<string, number>();
    for (const { i } of items) {
      const key = i.categoryName ?? "Uncategorised";
      counts.set(key, (counts.get(key) ?? 0) + (i.quantity ?? 1));
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  return {
    rows,
    total: rows.length,
    open: rows.filter((r) => OPEN.includes(r.status)).length,
    inFulfilment: rows.filter((r) => IN_FULFILMENT.includes(r.status)).length,
    completed: rows.filter((r) => r.status === "completed").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    byStatus: countBy(rows, (r) => r.status),
    byPriority: countBy(rows, (r) => r.priority || "normal"),
    byUnit: countBy(rows, (r) => unitName(r)?.trim() || "Unassigned unit").slice(0, 10),
    byCategory,
    managerTurnaround: averageDays(rows, "submittedAt", "managerDecidedAt"),
    cictTurnaround: averageDays(rows, "managerDecidedAt", "cictDecidedAt"),
    totalTurnaround: averageDays(rows, "submittedAt", "cictDecidedAt"),
  };
}

export function formatDays(t: { days: number; count: number } | null) {
  return t ? `${t.days.toFixed(1)} days` : "—";
}
