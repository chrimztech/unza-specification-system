import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { compact, downloadCsv, useRequests, unitName } from "@/lib/requests";
import { computeReport, formatDays } from "@/lib/report-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="surface p-5">
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const report = useMemo(
    () => computeReport(requests.data ?? [], from || undefined, to || undefined),
    [requests.data, from, to],
  );

  function exportCsv() {
    downloadCsv(
      `unza-cict-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Reference",
        "Title",
        "Unit",
        "Status",
        "Priority",
        "Raised",
        "Submitted",
        "Manager decided",
        "CICT decided",
      ],
      report.rows.map((r) => [
        r.reference,
        r.title || "Untitled request",
        unitName(r) || "",
        STATUS_LABEL[r.status],
        r.priority || "normal",
        formatDate(r.createdAt),
        formatDate(r.submittedAt),
        formatDate(r.managerDecidedAt),
        formatDate(r.cictDecidedAt),
      ]),
    );
  }

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Oversight</p>
          <h1 className="mt-1 font-display text-3xl">Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Institution-wide view of request volumes, workload and turnaround for equipment
            specification.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="report-from" className="label-caps mb-1.5 block">
              Raised from
            </Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="report-to" className="label-caps mb-1.5 block">
              Raised to
            </Label>
            <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={report.total === 0}>
            <Download />
            Export CSV
          </Button>
          <Button asChild>
            <Link
              to="/reports/print"
              search={compact({ from: from || undefined, to: to || undefined })}
            >
              <Printer />
              Print report
            </Link>
          </Button>
        </div>
      </div>

      {requests.isError && (
        <QueryError
          message="Could not load report data. Your connection or the server may be unavailable."
          onRetry={() => requests.refetch()}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total requests" value={String(report.total)} />
        <Stat label="Open" value={String(report.open)} hint="Awaiting manager or CICT action" />
        <Stat
          label="In fulfilment"
          value={String(report.inFulfilment)}
          hint="Approved, through procurement, stores and verification"
        />
        <Stat label="Completed" value={String(report.completed)} hint="Verified and closed" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Manager turnaround"
          value={formatDays(report.managerTurnaround)}
          hint="Submission to manager decision"
        />
        <Stat
          label="CICT turnaround"
          value={formatDays(report.cictTurnaround)}
          hint="Manager decision to CICT decision"
        />
        <Stat
          label="End-to-end approval"
          value={formatDays(report.totalTurnaround)}
          hint={
            report.totalTurnaround
              ? `Across ${report.totalTurnaround.count} decided requests`
              : "No decided requests yet"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="font-display text-xl">By status</h2>
          <div className="mt-4">
            <Bars
              data={report.byStatus.map(([s, n]) => [STATUS_LABEL[s as RequestStatus] ?? s, n])}
            />
          </div>
        </section>
        <section className="surface p-6">
          <h2 className="font-display text-xl">By priority</h2>
          <div className="mt-4">
            <Bars
              data={report.byPriority.map(([p, n]) => [p.charAt(0).toUpperCase() + p.slice(1), n])}
            />
          </div>
        </section>
        <section className="surface p-6">
          <h2 className="font-display text-xl">Demand by organisational unit</h2>
          <div className="mt-4">
            <Bars data={report.byUnit} />
          </div>
        </section>
        <section className="surface p-6">
          <h2 className="font-display text-xl">Equipment requested (units)</h2>
          <div className="mt-4">
            <Bars data={report.byCategory} />
          </div>
        </section>
      </div>

      <section className="surface p-6">
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
              {report.rows.slice(0, 15).map((r) => (
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
              {report.total === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No requests recorded for this period.
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
