import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { compact, downloadCsv, filterRequests, useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { QueryError } from "@/components/QueryError";
import { STATUS_LABEL, formatDate, type RequestStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
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

  const rows = useMemo(
    () => filterRequests(requests.data ?? [], { status, scope, q: search }, userId),
    [requests.data, status, scope, search, userId],
  );

  function exportCsv() {
    downloadCsv(
      `unza-cict-requests-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Reference",
        "Title",
        "Unit",
        "Department",
        "Requester",
        "Status",
        "Priority",
        "Raised",
        "Submitted",
        "Required by",
      ],
      rows.map((r) => [
        r.reference,
        r.title || "Untitled request",
        unitName(r) || "",
        r.department || "",
        r.requester.fullName,
        STATUS_LABEL[r.status],
        r.priority ?? "",
        formatDate(r.createdAt),
        formatDate(r.submittedAt),
        formatDate(r.requiredBy),
      ]),
    );
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
            <Download />
            Export CSV
          </Button>
          <Button asChild variant="outline">
            <Link
              to="/requests/register"
              search={compact({
                status: status === "all" ? undefined : status,
                scope: scope === "all" ? undefined : scope,
                q: search.trim() || undefined,
              })}
            >
              <Printer />
              Print register
            </Link>
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
        <div className="overflow-hidden surface">
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
