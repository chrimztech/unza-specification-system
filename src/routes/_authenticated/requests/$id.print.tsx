import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RequestEventResponse, RequestResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";
import { STATUS_LABEL, formatDate, formatDateTime, type RequestStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  DocumentFooter,
  DocumentSection,
  DocumentTable,
  Letterhead,
  LetterheadMeta,
  PrintSheet,
  PrintToolbar,
  SignatureBlock,
} from "@/components/Letterhead";

export const Route = createFileRoute("/_authenticated/requests/$id/print")({
  head: () => ({
    meta: [
      { title: "Printable request form · UNZA CICT" },
      {
        name: "description",
        content: "Printable copy of a submitted UNZA CICT equipment specification request.",
      },
    ],
  }),
  component: PrintRequestForm,
});

function PrintRequestForm() {
  const { id } = Route.useParams();

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });
  const events = useQuery({
    queryKey: ["request-events", id],
    queryFn: () => apiGet<RequestEventResponse[]>(`/api/requests/${id}/events`),
  });
  const history = [...(events.data ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  const r = request.data;
  if (request.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!r)
    return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;

  return (
    <div className="space-y-6">
      <PrintToolbar document="ICT Equipment Specification Request" reference={r.reference}>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </PrintToolbar>

      <PrintSheet>
        <Letterhead documentTitle="ICT Equipment Specification Request" reference={r.reference} />

        <LetterheadMeta
          rows={[
            ["Requesting Unit / School", unitName(r)],
            ["Department", r.department],
            ["Designation of intended user", r.designation],
            ["Requester", `${r.requester.fullName} (${r.requester.email})`],
            [
              "Requested on behalf of",
              r.onBehalfOf ? r.onBehalfOf.fullName : r.requestedFor || "Requester (self)",
            ],
            ["Date", formatDate(r.createdAt)],
            ["Status", STATUS_LABEL[r.status]],
            ["Approving manager", r.manager?.fullName],
          ]}
        />

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">Business case</h2>
          <dl className="mt-2 space-y-2 text-sm text-black">
            <div>
              <dt className="font-semibold">Title</dt>
              <dd>{r.title}</dd>
            </div>
            <div>
              <dt className="font-semibold">Request type / Business context</dt>
              <dd>
                {r.requestType || "—"} / {r.businessContext || "—"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Justification</dt>
              <dd>{r.justification || "—"}</dd>
            </div>
            {r.impactIfNotProvided && (
              <div>
                <dt className="font-semibold">Impact if not provided</dt>
                <dd>{r.impactIfNotProvided}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold">Priority / Required by</dt>
              <dd>
                {r.priority || "normal"} {r.requiredBy ? `· ${formatDate(r.requiredBy)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Funding source / Budget status</dt>
              <dd>
                {r.fundingSource || "—"} / {r.budgetStatus || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">
            Equipment specification
          </h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm text-black">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1.5 pr-3 font-semibold">Item</th>
                  <th className="py-1.5 pr-3 font-semibold">Qty</th>
                  <th className="py-1.5 pr-3 font-semibold">Purpose</th>
                  <th className="py-1.5 pr-3 font-semibold">Users / Location</th>
                  <th className="py-1.5 font-semibold">Designation</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-neutral-300 align-top">
                    <td className="py-1.5 pr-3">
                      {i + 1}. {item.categoryName ?? "Equipment"}
                    </td>
                    <td className="py-1.5 pr-3">{item.quantity}</td>
                    <td className="py-1.5 pr-3">{item.purpose || "—"}</td>
                    <td className="py-1.5 pr-3">
                      {item.numberOfUsers
                        ? `${item.numberOfUsers} users`
                        : item.intendedUsers || "—"}
                      {item.location ? ` · ${item.location}` : ""}
                    </td>
                    <td className="py-1.5">{item.designation || r.designation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <DocumentSection title="Approval record">
          <DocumentTable
            headers={["Stage", "Decided by", "Date", "Note"]}
            rows={[
              [
                "Manager approval",
                r.manager?.fullName ?? "—",
                formatDateTime(r.managerDecidedAt),
                r.managerDecisionNote || "—",
              ],
              [
                "CICT technical review",
                r.cictDecidedBy?.fullName ?? "—",
                formatDateTime(r.cictDecidedAt),
                r.cictDecisionNote || "—",
              ],
            ]}
          />
        </DocumentSection>

        <DocumentSection title="Workflow history">
          <DocumentTable
            headers={["Date & time", "By", "Action", "Status", "Comment"]}
            empty="No workflow activity recorded."
            rows={history.map((e) => [
              <span className="whitespace-nowrap">{formatDateTime(e.createdAt)}</span>,
              e.actorName || "System",
              e.action.replace(/_/g, " "),
              e.toStatus ? (STATUS_LABEL[e.toStatus as RequestStatus] ?? e.toStatus) : "—",
              e.comment || "—",
            ])}
          />
        </DocumentSection>

        <SignatureBlock roles={["Requester", "Approving Manager", "CICT Technical Reviewer"]} />
        <DocumentFooter />
      </PrintSheet>
    </div>
  );
}
