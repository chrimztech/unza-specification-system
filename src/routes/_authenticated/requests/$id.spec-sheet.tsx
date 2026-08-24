import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RequestResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";
import { formatDate, formatDateTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/requests/$id/spec-sheet")({
  head: () => ({
    meta: [
      { title: "Approved specification sheet · UNZA CICT" },
      {
        name: "description",
        content:
          "Printable CICT-approved minimum specification sheet for an approved UNZA equipment request.",
      },
      { property: "og:title", content: "Approved specification sheet · UNZA CICT" },
      {
        property: "og:description",
        content: "Official CICT technical specification sheet for procurement.",
      },
    ],
  }),
  component: SpecSheet,
});

function SpecSheet() {
  const { id } = Route.useParams();

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });

  const r = request.data;
  if (request.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!r) return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;

  if (r.status !== "approved") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A specification sheet is issued only after CICT technical approval.
        </p>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={() => window.print()}>Print / save as PDF</Button>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </div>

      <article className="rounded-md border border-border bg-card p-8 shadow-panel print:border-0 print:shadow-none">
        <header className="border-b border-border pb-5">
          <p className="label-caps">University of Zambia · Centre for ICT</p>
          <h1 className="mt-2 font-display text-2xl">Approved equipment specification sheet</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{r.reference}</p>
        </header>

        <dl className="grid gap-4 border-b border-border py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="label-caps">Request title</dt>
            <dd className="mt-1">{r.title}</dd>
          </div>
          <div>
            <dt className="label-caps">Unit</dt>
            <dd className="mt-1">{unitName(r) || "—"}</dd>
          </div>
          <div>
            <dt className="label-caps">Required by</dt>
            <dd className="mt-1">{formatDate(r.requiredBy)}</dd>
          </div>
          <div>
            <dt className="label-caps">Cost centre</dt>
            <dd className="mt-1">{r.costCentre || "—"}</dd>
          </div>
          <div>
            <dt className="label-caps">Funding source</dt>
            <dd className="mt-1">{r.fundingSource || "—"}</dd>
          </div>
          <div>
            <dt className="label-caps">CICT approval</dt>
            <dd className="mt-1">{formatDateTime(r.cictDecidedAt)}</dd>
          </div>
        </dl>

        <section className="py-5">
          <h2 className="font-display text-lg">Approved minimum specifications</h2>
          <div className="mt-3 space-y-4">
            {r.items.map((item, i) => (
              <div key={item.id} className="rounded-sm border border-border p-4">
                <h3 className="font-semibold">
                  {i + 1}. {item.categoryName ?? "Equipment"} × {item.quantity}
                  {item.approvedProfile ? ` — ${item.approvedProfile.tier} (${item.approvedProfile.name})` : ""}
                </h3>
                {item.purpose && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.purpose}</p>
                )}
                {item.approvedProfile?.specs ? (
                  <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                    {Object.entries(item.approvedProfile.specs).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="min-w-28 text-muted-foreground">{k}</dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No specification profile recorded for this item.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Deployment location: {item.location || "—"} · Users: {item.intendedUsers || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {r.cictDecisionNote && (
          <section className="border-t border-border py-5">
            <h2 className="label-caps">CICT technical note</h2>
            <p className="mt-1 text-sm">{r.cictDecisionNote}</p>
          </section>
        )}

        <footer className="border-t border-border pt-5 text-xs text-muted-foreground">
          This sheet confirms the minimum technical specification approved by CICT. It is not an
          authority to spend; procurement remains subject to budget approval and University
          procurement procedures.
        </footer>
      </article>
    </div>
  );
}
