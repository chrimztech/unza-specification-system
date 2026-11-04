import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  describeFilters,
  filterRequests,
  stringParams,
  unitName,
  useRequests,
} from "@/lib/requests";
import { STATUS_LABEL, formatDate, type RequestStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  DocumentFooter,
  DocumentSection,
  DocumentTable,
  Letterhead,
  LetterheadMeta,
  PrintSheet,
  PrintToolbar,
} from "@/components/Letterhead";

const PARAMS = ["status", "scope", "q", "unit", "from", "to"] as const;

export const Route = createFileRoute("/_authenticated/requests/register")({
  validateSearch: stringParams(PARAMS),
  head: () => ({ meta: [{ title: "Request register · UNZA CICT" }] }),
  component: RequestRegister,
});

const SCOPE_LABEL: Record<string, string> = {
  mine: "Raised by me",
  approvals: "Where I am the manager",
};

/** Printable register of requests, honouring the filters chosen on the requests page. */
function RequestRegister() {
  const search = Route.useSearch();
  const { userId } = useAuth();
  const requests = useRequests();
  const rows = useMemo(
    () => filterRequests(requests.data ?? [], search, userId),
    [requests.data, search, userId],
  );

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  if (requests.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <PrintToolbar document="Request register">
        <Button asChild variant="outline">
          <Link to="/requests">Back to requests</Link>
        </Button>
      </PrintToolbar>

      <PrintSheet wide>
        <Letterhead documentTitle="Equipment Request Register" />
        <LetterheadMeta
          rows={[
            [
              "Filters",
              describeFilters([
                [
                  "Status",
                  search.status ? STATUS_LABEL[search.status as RequestStatus] : undefined,
                ],
                ["Scope", search.scope ? SCOPE_LABEL[search.scope] : undefined],
                ["Unit", search.unit],
                ["Search", search.q],
                ["Raised from", search.from],
                ["Raised to", search.to],
              ]),
            ],
            ["Requests listed", String(rows.length)],
          ]}
        />

        <DocumentSection title="Summary by status">
          <DocumentTable
            headers={["Status", "Requests"]}
            rows={byStatus.map(([s, n]) => [STATUS_LABEL[s as RequestStatus] ?? s, n])}
          />
        </DocumentSection>

        <DocumentSection title="Requests">
          <DocumentTable
            headers={[
              "#",
              "Reference",
              "Title",
              "Unit",
              "Requester",
              "Raised",
              "Required by",
              "Status",
            ]}
            empty="No requests match these filters."
            rows={rows.map((r, i) => [
              i + 1,
              <span className="font-mono text-[11px]">{r.reference}</span>,
              r.title || "Untitled request",
              unitName(r) || "—",
              r.requester.fullName,
              formatDate(r.createdAt),
              formatDate(r.requiredBy),
              STATUS_LABEL[r.status],
            ])}
          />
        </DocumentSection>

        <DocumentFooter />
      </PrintSheet>
    </div>
  );
}
