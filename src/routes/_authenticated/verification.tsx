import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/verification")({
  head: () => ({
    meta: [
      { title: "Verification · UNZA CICT Specification System" },
      {
        name: "description",
        content: "CICT Support verification queue for equipment received into stores.",
      },
      { property: "og:title", content: "Verification · UNZA CICT" },
      {
        property: "og:description",
        content:
          "Confirm delivered equipment matches the approved specification, or flag for return.",
      },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const { hasRole } = useAuth();
  const requests = useRequests();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...(requests.data ?? [])]
      .filter((r) => r.status === "in_stores")
      .sort((a, b) => ((a.updatedAt ?? "") < (b.updatedAt ?? "") ? 1 : -1))
      .filter((r) => {
        if (q && !`${r.reference} ${r.title ?? ""} ${unitName(r) ?? ""}`.toLowerCase().includes(q))
          return false;
        return true;
      });
  }, [requests.data, search]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Workflow</p>
        <h1 className="mt-1 font-display text-3xl">Verification</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Equipment received into stores, awaiting CICT Support verification against the approved
          specification.
        </p>
      </div>

      {!hasRole("cict_support") && !hasRole("admin") && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
          <ShieldCheck className="mb-1 mr-2 inline size-4" />
          This workspace is intended for CICT Support staff who verify delivered equipment.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="label-caps">Awaiting verification</p>
          <p className="mt-1 font-display text-3xl">{rows.length}</p>
        </div>
      </div>

      <div className="w-64">
        <label className="label-caps mb-1.5 block">Search</label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Reference, title or unit"
        />
      </div>

      <div className="overflow-hidden surface">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-semibold">Reference</th>
              <th className="px-4 py-2.5 font-semibold">Title</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Unit</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Received</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No equipment is currently awaiting verification.
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
                        Verify
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
