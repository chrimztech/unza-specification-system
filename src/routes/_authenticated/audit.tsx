import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { QueryError } from "@/components/QueryError";
import { formatDate, formatDateTime, STATUS_LABEL, type RequestStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit workspace · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Oversight audit workspace for CICT equipment request records, approval history and exports.",
      },
      { property: "og:title", content: "Audit workspace · UNZA CICT" },
      {
        property: "og:description",
        content: "Read-only audit view of request records, decisions and configuration history.",
      },
    ],
  }),
  component: AuditPage,
});

const STATUSES = ["all", ...Object.keys(STATUS_LABEL)] as ("all" | RequestStatus)[];

function AuditPage() {
  const { hasRole } = useAuth();
  const requests = useRequests();
  const [status, setStatus] = useState<"all" | RequestStatus>("all");
  const [unit, setUnit] = useState("all");
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...(requests.data ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [requests.data],
  );

  const units = useMemo(
    () => Array.from(new Set(sorted.map((r) => unitName(r)).filter((u): u is string => !!u))),
    [sorted],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (unit !== "all" && unitName(r) !== unit) return false;
      if (q && !`${r.reference} ${r.title ?? ""} ${unitName(r) ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [sorted, status, unit, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const pending = rows.filter((r) =>
      ["pending_manager", "pending_cict", "needs_clarification"].includes(r.status),
    ).length;
    return { total, approved, rejected, pending };
  }, [rows]);

  function exportCsv() {
    const header = [
      "Reference",
      "Title",
      "Unit",
      "Status",
      "Priority",
      "Created",
      "Submitted",
      "Manager decided",
      "CICT decided",
      "Manager note",
      "CICT note",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.reference,
          r.title || "Untitled request",
          unitName(r) || "",
          STATUS_LABEL[r.status],
          r.priority ?? "",
          formatDateTime(r.createdAt),
          formatDateTime(r.submittedAt),
          formatDateTime(r.managerDecidedAt),
          formatDateTime(r.cictDecidedAt),
          r.managerDecisionNote || "",
          r.cictDecisionNote || "",
        ]
          .map((v) => escape(String(v ?? "").replace(/\n/g, " ")))
          .join(","),
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `unza-cict-audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Oversight</p>
        <h1 className="mt-1 font-display text-3xl">Audit workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Read-only oversight view of request records, decision history and approval evidence.
        </p>
      </div>

      {!hasRole("auditor") && !hasRole("admin") && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
          <ShieldCheck className="mb-1 mr-2 inline size-4" />
          This workspace is intended for auditors and system administrators.
        </div>
      )}

      {requests.isError && (
        <QueryError message="Could not load audit records." onRetry={() => requests.refetch()} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Records visible" value={stats.total.toString()} />
        <StatCard label="Approved" value={stats.approved.toString()} />
        <StatCard label="Rejected" value={stats.rejected.toString()} />
        <StatCard label="Pending" value={stats.pending.toString()} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="w-64">
            <label className="label-caps mb-1.5 block">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, title or unit"
            />
          </div>
          <div className="w-44">
            <label className="label-caps mb-1.5 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as "all" | RequestStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
            <label className="label-caps mb-1.5 block">Organisational unit</label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-hidden surface">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-semibold">Reference</th>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Unit</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Submitted</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">View</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No requests match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      to="/requests/$id"
                      params={{ id: r.id }}
                      className="underline-offset-2 hover:underline"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/requests/$id"
                      params={{ id: r.id }}
                      className="font-medium hover:underline"
                    >
                      {r.title || "Untitled request"}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {unitName(r) || "—"}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{formatDate(r.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/requests/$id" params={{ id: r.id }}>
                        Details
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Audit exports include decision notes and timestamps for institutional record-keeping.
        Configuration changes are logged in Admin → Audit log.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
