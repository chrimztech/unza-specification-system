import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RequestResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";
import { formatDate, formatDateTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  Letterhead,
  LetterheadMeta,
  PrintSheet,
  SignatureBlock,
  DocumentFooter,
  PrintToolbar,
} from "@/components/Letterhead";

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
  if (!r)
    return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;

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
      <PrintToolbar document="Approved Equipment Specification Sheet" reference={r.reference}>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </PrintToolbar>

      <PrintSheet>
        <Letterhead
          documentTitle="Approved Equipment Specification Sheet"
          reference={r.reference}
        />

        <LetterheadMeta
          rows={[
            ["Request title", r.title],
            ["Requester", r.requester.fullName],
            ["Requester email", r.requester.email],
            ["Unit / School", unitName(r)],
            ["Department", r.department],
            ["Designation", r.designation],
            ["Required by", formatDate(r.requiredBy)],
            ["Cost centre", r.costCentre],
            ["Funding source", r.fundingSource],
            ["CICT approval date", formatDateTime(r.cictDecidedAt)],
          ]}
        />

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">
            Approved minimum specifications
          </h2>
          <div className="mt-3 space-y-4">
            {r.items.map((item, i) => (
              <div key={item.id} className="rounded-sm border border-neutral-300 p-4">
                <h3 className="font-semibold text-black">
                  {i + 1}. {item.categoryName ?? "Equipment"} × {item.quantity}
                  {item.approvedProfile
                    ? ` — ${item.approvedProfile.tier} (${item.approvedProfile.name})`
                    : ""}
                </h3>
                {item.purpose && <p className="mt-1 text-sm text-neutral-700">{item.purpose}</p>}
                {item.approvedProfile?.specs ? (
                  <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                    {Object.entries(item.approvedProfile.specs).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="min-w-28 text-neutral-600">{k}</dt>
                        <dd className="text-black">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-neutral-600">
                    No specification profile recorded for this item.
                  </p>
                )}
                <p className="mt-2 text-xs text-neutral-600">
                  Deployment location: {item.location || "—"} · Users:{" "}
                  {item.numberOfUsers ? `${item.numberOfUsers} users` : item.intendedUsers || "—"} ·
                  Designation: {item.designation || r.designation || "—"}
                </p>
                {item.softwareCategory && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Software category: {item.softwareCategory}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {r.cictDecisionNote && (
          <section className="border-t border-neutral-300 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-black">
              CICT technical note
            </h2>
            <p className="mt-1 text-sm text-neutral-700">{r.cictDecisionNote}</p>
          </section>
        )}

        <SignatureBlock roles={["CICT Technical Reviewer", "Head of Requesting Unit"]} />

        <div className="border-t border-neutral-300 pt-4 text-xs text-neutral-600">
          This sheet confirms the minimum technical specification approved by CICT. It is not an
          authority to spend; procurement remains subject to budget approval and University
          procurement procedures.
        </div>
        <DocumentFooter />
      </PrintSheet>
    </div>
  );
}
