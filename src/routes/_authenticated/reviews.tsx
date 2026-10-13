import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({
    meta: [
      { title: "CICT review queue · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "CICT technical review queue for equipment requests awaiting specification assessment.",
      },
      { property: "og:title", content: "CICT review queue · UNZA CICT" },
      {
        property: "og:description",
        content:
          "Review submitted requests against approved technical standards and specification profiles.",
      },
    ],
  }),
  component: ReviewsPage,
});

const FILTERS = [
  { value: "pending", label: "Awaiting CICT review" },
  { value: "clarification", label: "Clarification needed" },
  { value: "all", label: "All CICT queue" },
];

function ReviewsPage() {
  const { isCict, hasRole } = useAuth();
  const requests = useRequests();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const queue = useMemo(
    () =>
      (requests.data ?? [])
        .filter((r) => r.status === "pending_cict" || r.status === "needs_clarification")
        .sort((a, b) => ((a.submittedAt ?? "") < (b.submittedAt ?? "") ? 1 : -1)),
    [requests.data],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queue.filter((r) => {
      if (filter === "pending" && r.status !== "pending_cict") return false;
      if (filter === "clarification" && r.status !== "needs_clarification") return false;
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

  const stats = useMemo(() => {
    const pending = queue.filter((r) => r.status === "pending_cict").length;
    const clarification = queue.filter((r) => r.status === "needs_clarification").length;
    return { pending, clarification };
  }, [queue]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Workflow</p>
        <h1 className="mt-1 font-display text-3xl">CICT review queue</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Technical review of equipment requests against approved standards, specification profiles
          and institutional rules.
        </p>
      </div>

      {!isCict && !hasRole("admin") && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
          <ClipboardList className="mb-1 mr-2 inline size-4" />
          This workspace is intended for CICT reviewers and technical approvers.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="label-caps">Awaiting review</p>
          <p className="mt-1 font-display text-3xl">{stats.pending}</p>
        </div>
        <div className="surface p-5">
          <p className="label-caps">Awaiting clarification</p>
          <p className="mt-1 font-display text-3xl">{stats.clarification}</p>
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
        CICT technical approval is not approval to spend. Approved requests are handed over to
        Procurement under University procurement rules.
      </p>
    </div>
  );
}
