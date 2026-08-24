import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { STATUS_LABEL, type RequestStatus, formatDate } from "@/lib/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { QueryError } from "@/components/QueryError";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Oversight reporting on equipment request volumes, status mix, turnaround times and demand by organisational unit.",
      },
      { property: "og:title", content: "Reports · UNZA CICT" },
      {
        property: "og:description",
        content: "Volumes, turnaround and demand analysis for CICT equipment requests.",
      },
    ],
  }),
  component: ReportsPage,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-panel">
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Bars({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <div className="space-y-2">
      {data.map(([label, n]) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-48 shrink-0 truncate text-muted-foreground">{label}</span>
          <span className="h-2 flex-1 rounded-full bg-muted">
            <span
              className="block h-2 rounded-full bg-primary"
              style={{ width: `${(n / max) * 100}%` }}
            />
          </span>
          <span className="w-8 text-right tabular-nums">{n}</span>
        </div>
      ))}
      {data.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : null}
    </div>
  );
}

function ReportsPage() {
  const { isOversight } = useAuth();
  const requests = useRequests();

  const rows = useMemo(
    () => [...(requests.data ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [requests.data],
  );

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const byUnit = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = unitName(r)?.trim() || "Unassigned unit";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [rows]);

  const byPriority = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = r.priority || "normal";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const turnaround = useMemo(() => {
    const done = rows.filter((r) => r.submittedAt && r.cictDecidedAt);
    if (done.length === 0) return null;
    const days =
      done.reduce(
        (sum, r) =>
          sum +
          (new Date(r.cictDecidedAt!).getTime() - new Date(r.submittedAt!).getTime()) / 86_400_000,
        0,
      ) / done.length;
    return { days, count: done.length };
  }, [rows]);

  const openCount = rows.filter((r) =>
    ["pending_manager", "pending_cict", "needs_clarification"].includes(r.status),
  ).length;
  const approved = rows.filter((r) => r.status === "approved").length;

  if (!isOversight) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl">Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reports are available to CICT, procurement and audit roles only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps">Oversight</p>
        <h1 className="mt-1 font-display text-3xl">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Institution-wide view of request volumes, workload and turnaround for equipment
          specification.
        </p>
      </div>

      {requests.isError && (
        <QueryError
          message="Could not load report data. Your connection or the server may be unavailable."
          onRetry={() => requests.refetch()}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total requests" value={String(rows.length)} />
        <Stat label="Open" value={String(openCount)} hint="Awaiting manager or CICT action" />
        <Stat label="Approved specifications" value={String(approved)} />
        <Stat
          label="Average turnaround"
          value={turnaround ? `${turnaround.days.toFixed(1)} d` : "—"}
          hint={turnaround ? `Across ${turnaround.count} completed requests` : "No completed requests yet"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-6 shadow-panel">
          <h2 className="font-display text-xl">By status</h2>
          <div className="mt-4">
            <Bars
              data={byStatus.map(([s, n]) => [STATUS_LABEL[s as RequestStatus] ?? s, n])}
            />
          </div>
        </section>
        <section className="rounded-md border border-border bg-card p-6 shadow-panel">
          <h2 className="font-display text-xl">By priority</h2>
          <div className="mt-4">
            <Bars data={byPriority.map(([p, n]) => [p.charAt(0).toUpperCase() + p.slice(1), n])} />
          </div>
        </section>
      </div>

      <section className="rounded-md border border-border bg-card p-6 shadow-panel">
        <h2 className="font-display text-xl">Demand by organisational unit</h2>
        <div className="mt-4">
          <Bars data={byUnit} />
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-6 shadow-panel">
        <h2 className="font-display text-xl">Most recent requests</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Reference</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Unit</th>
                <th className="py-2 pr-3">Submitted</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-mono text-xs">{r.reference}</td>
                  <td className="py-2 pr-3">{r.title || "Untitled"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{unitName(r) ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {formatDate(r.submittedAt ?? r.createdAt)}
                  </td>
                  <td className="py-2">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No requests recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
