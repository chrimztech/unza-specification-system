import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/domain";
import type { RequestStatus } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Procurement queue for CICT-approved equipment requests: source quotations, evaluate and record purchases.",
      },
      { property: "og:title", content: "Procurement · UNZA CICT" },
      {
        property: "og:description",
        content: "Source quotations, evaluate them and record purchases for approved specifications.",
      },
    ],
  }),
  component: ProcurementPage,
});

const QUEUE_STATUSES: RequestStatus[] = ["approved", "procurement", "return_required"];

const FILTERS = [
  { value: "queue", label: "In procurement" },
  { value: "all", label: "All statuses" },
] as const;

function ProcurementPage() {
  const { hasRole } = useAuth();
  const requests = useRequests();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("queue");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...(requests.data ?? [])]
      .sort((a, b) => ((a.updatedAt ?? "") < (b.updatedAt ?? "") ? 1 : -1))
      .filter((r) => {
        if (filter === "queue" && !QUEUE_STATUSES.includes(r.status)) return false;
        if (q && !`${r.reference} ${r.title ?? ""} ${unitName(r) ?? ""}`.toLowerCase().includes(q))
          return false;
        return true;
      });
  }, [requests.data, filter, search]);

  const counts = useMemo(() => {
    const all = requests.data ?? [];
    return {
      approved: all.filter((r) => r.status === "approved").length,
      procurement: all.filter((r) => r.status === "procurement").length,
      returnRequired: all.filter((r) => r.status === "return_required").length,
    };
  }, [requests.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Procurement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Source quotations against CICT-approved specifications, evaluate them and record
          purchases.
        </p>
      </div>

      {!hasRole("procurement") && !hasRole("admin") && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
          <ShoppingCart className="mb-1 mr-2 inline size-4" />
          This workspace is intended for procurement officers.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <p className="label-caps">Newly approved</p>
          <p className="mt-1 font-display text-3xl">{counts.approved}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <p className="label-caps">Sourcing quotations</p>
          <p className="mt-1 font-display text-3xl">{counts.procurement}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-5 shadow-panel">
          <p className="label-caps">Returned by CICT Support</p>
          <p className="mt-1 font-display text-3xl">{counts.returnRequired}</p>
        </div>
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
          <div className="w-52">
            <label className="label-caps mb-1.5 block">Filter</label>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
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

      <div className="overflow-hidden rounded-md border border-border bg-card shadow-panel">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-semibold">Reference</th>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Unit</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Updated</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
                  <td className="hidden px-4 py-3 sm:table-cell">{formatDate(r.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="default" size="sm" asChild>
                      <Link to="/requests/$id" params={{ id: r.id }}>
                        {r.status === "approved" ? "Source quotations" : "Open"}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
