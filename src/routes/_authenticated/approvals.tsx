import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DelegationResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "Manager approvals · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Manager approval queue for CICT equipment requests awaiting business-need confirmation.",
      },
      { property: "og:title", content: "Manager approvals · UNZA CICT" },
      {
        property: "og:description",
        content: "Review and confirm business need for equipment requests routed to you.",
      },
    ],
  }),
  component: ApprovalsPage,
});

const FILTERS = [
  { value: "pending", label: "Pending my decision" },
  { value: "all", label: "All routed to me" },
];

function ApprovalsPage() {
  const { userId, hasRole } = useAuth();
  const requests = useRequests();
  const delegations = useQuery({
    queryKey: ["delegations"],
    enabled: !!userId,
    queryFn: () => apiGet<DelegationResponse[]>("/api/delegations"),
  });
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const principals = useMemo(() => {
    const delegatedFor = (delegations.data ?? [])
      .filter((d) => d.active && d.delegate.id === userId)
      .map((d) => d.delegator.id);
    return new Set([userId, ...delegatedFor]);
  }, [delegations.data, userId]);

  const queue = useMemo(
    () => (requests.data ?? []).filter((r) => r.manager && principals.has(r.manager.id)),
    [requests.data, principals],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...queue]
      .sort((a, b) => ((a.submittedAt ?? "") < (b.submittedAt ?? "") ? 1 : -1))
      .filter((r) => {
        if (filter === "pending" && r.status !== "pending_manager") return false;
        if (
          q &&
          !`${r.reference} ${r.title ?? ""} ${unitName(r) ?? ""} ${r.requester.fullName}`
            .toLowerCase()
            .includes(q)
        )
          return false;
        return true;
      });
  }, [queue, filter, search]);

  const pendingCount = useMemo(
    () => queue.filter((r) => r.status === "pending_manager").length,
    [queue],
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Workflow</p>
        <h1 className="mt-1 font-display text-3xl">Manager approvals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Confirm the business need, ownership and accuracy of equipment requests routed to you.
        </p>
      </div>

      {!hasRole("manager") && !hasRole("admin") && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
          <ClipboardCheck className="mb-1 mr-2 inline size-4" />
          This workspace is intended for managers who approve business requests.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="label-caps">Awaiting your decision</p>
          <p className="mt-1 font-display text-3xl">{pendingCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="w-64">
            <label className="label-caps mb-1.5 block">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, title, unit or requester"
            />
          </div>
          <div className="w-52">
            <label className="label-caps mb-1.5 block">Filter</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden surface">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-semibold">Reference</th>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Unit</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Requester</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Submitted</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No requests match the current filter.
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
                  <td className="hidden px-4 py-3 sm:table-cell">{r.requester.fullName || "—"}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{formatDate(r.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="default" size="sm" asChild>
                      <Link to="/requests/$id" params={{ id: r.id }}>
                        Review
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
        Approve the business need, return for correction, or reject with a reason. CICT will review
        approved requests against technical standards.
      </p>
    </div>
  );
}
