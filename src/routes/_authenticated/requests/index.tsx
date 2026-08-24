import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { QueryError } from "@/components/QueryError";
import { STATUS_LABEL, formatDate, type RequestStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/requests/")({
  head: () => ({
    meta: [
      { title: "All requests · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Search and filter every CICT equipment request visible to you, with status, unit and required-by date.",
      },
      { property: "og:title", content: "All requests · UNZA CICT" },
      {
        property: "og:description",
        content: "Filter UNZA CICT equipment requests by status, unit and reference.",
      },
    ],
  }),
  component: RequestsIndex,
});

const STATUSES = Object.keys(STATUS_LABEL) as RequestStatus[];

function RequestsIndex() {
  const { userId, isOversight } = useAuth();
  const requests = useRequests();
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...(requests.data ?? [])]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        if (scope === "mine" && r.requester.id !== userId && r.submittedBy.id !== userId) return false;
        if (scope === "approvals" && r.manager?.id !== userId) return false;
        if (q && !`${r.reference} ${r.title ?? ""} ${unitName(r) ?? ""}`.toLowerCase().includes(q))
          return false;
        return true;
      });
  }, [requests.data, status, scope, search, userId]);

  function exportCsv() {
    const header = ["Reference", "Title", "Unit", "Status", "Priority", "Raised", "Required by"];
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
          formatDate(r.createdAt),
          formatDate(r.requiredBy),
        ]
          .map((v) => escape(String(v ?? "")))
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `unza-cict-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Register</p>
          <h1 className="mt-1 font-display text-3xl">Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOversight
              ? "Every request across the University visible to your oversight role."
              : "Requests you raised or are responsible for approving."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </Button>
          <Button asChild>
            <Link to="/requests/new">New request</Link>
          </Button>
        </div>

      </div>

      {requests.isError && (
        <QueryError message="Could not load requests." onRetry={() => requests.refetch()} />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Search reference, title or unit"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everything I can see</SelectItem>
            <SelectItem value="mine">Raised by me</SelectItem>
            <SelectItem value="approvals">Where I am the manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {requests.isLoading ? "Loading requests…" : "No requests match these filters."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-panel">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-semibold">Reference</th>
                <th className="px-4 py-2.5 font-semibold">Title</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Unit</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Raised</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Required by</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to="/requests/$id" params={{ id: r.id }} className="hover:underline">
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
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {formatDate(r.requiredBy)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
