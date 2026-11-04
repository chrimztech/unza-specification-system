import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { describeFilters, stringParams, unitName, useRequests } from "@/lib/requests";
import { computeReport, formatDays } from "@/lib/report-data";
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

export const Route = createFileRoute("/_authenticated/reports_/print")({
  validateSearch: stringParams(["from", "to"] as const),
  head: () => ({ meta: [{ title: "Management report · UNZA CICT" }] }),
  component: PrintableReport,
});

function share(n: number, total: number) {
  return total ? `${Math.round((n / total) * 100)}%` : "—";
}

/** Printable management report: the Reports page as an official document. */
function PrintableReport() {
  const { from, to } = Route.useSearch();
  const { isOversight } = useAuth();
  const requests = useRequests();
  const report = useMemo(
    () => computeReport(requests.data ?? [], from, to),
    [requests.data, from, to],
  );

  if (!isOversight)
    return (
      <p className="text-sm text-muted-foreground">Reports are restricted to oversight roles.</p>
    );
  if (requests.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const period =
    from || to
      ? `${from ? formatDate(from) : "the beginning"} to ${to ? formatDate(to) : "today"}`
      : "All time";

  return (
    <div className="space-y-6">
      <PrintToolbar document="Management report" reference={period}>
        <Button asChild variant="outline">
          <Link to="/reports">Back to reports</Link>
        </Button>
      </PrintToolbar>

      <PrintSheet>
        <Letterhead documentTitle="Equipment Specification Management Report" />
        <LetterheadMeta
          rows={[
            ["Reporting period", period],
            ["Requests in period", String(report.total)],
            [
              "Filters",
              describeFilters([
                ["Raised from", from],
                ["Raised to", to],
              ]),
            ],
          ]}
        />

        <DocumentSection title="1. Summary">
          <DocumentTable
            headers={["Measure", "Value", "Notes"]}
            rows={[
              ["Total requests", report.total, "Raised in the reporting period"],
              ["Open", report.open, "Awaiting manager or CICT action"],
              [
                "In fulfilment",
                report.inFulfilment,
                "Approved, through procurement, stores and verification",
              ],
              ["Completed", report.completed, "Verified against specification and closed"],
              ["Rejected", report.rejected, "Declined by a manager or CICT"],
              [
                "Average manager turnaround",
                formatDays(report.managerTurnaround),
                "Submission to manager decision",
              ],
              [
                "Average CICT turnaround",
                formatDays(report.cictTurnaround),
                "Manager decision to CICT decision",
              ],
              [
                "Average end-to-end approval",
                formatDays(report.totalTurnaround),
                report.totalTurnaround
                  ? `Across ${report.totalTurnaround.count} decided requests`
                  : "No decided requests",
              ],
            ]}
          />
        </DocumentSection>

        <DocumentSection title="2. Requests by status">
          <DocumentTable
            headers={["Status", "Requests", "Share"]}
            rows={report.byStatus.map(([s, n]) => [
              STATUS_LABEL[s as RequestStatus] ?? s,
              n,
              share(n, report.total),
            ])}
          />
        </DocumentSection>

        <DocumentSection title="3. Requests by priority">
          <DocumentTable
            headers={["Priority", "Requests", "Share"]}
            rows={report.byPriority.map(([p, n]) => [
              p.charAt(0).toUpperCase() + p.slice(1),
              n,
              share(n, report.total),
            ])}
          />
        </DocumentSection>

        <DocumentSection title="4. Demand by organisational unit (top 10)">
          <DocumentTable
            headers={["Unit / School", "Requests", "Share"]}
            rows={report.byUnit.map(([u, n]) => [u, n, share(n, report.total)])}
          />
        </DocumentSection>

        <DocumentSection title="5. Equipment requested (top 10 categories)">
          <DocumentTable
            headers={["Category", "Units requested"]}
            rows={report.byCategory.map(([c, n]) => [c, n])}
          />
        </DocumentSection>

        <DocumentSection title="6. Requests in the period">
          <DocumentTable
            headers={["Reference", "Title", "Unit", "Raised", "Status"]}
            empty="No requests were raised in this period."
            rows={report.rows.map((r) => [
              <span className="font-mono text-[11px]">{r.reference}</span>,
              r.title || "Untitled request",
              unitName(r) || "—",
              formatDate(r.createdAt),
              STATUS_LABEL[r.status],
            ])}
          />
        </DocumentSection>

        <DocumentFooter note="Figures cover requests visible to the person who generated this report." />
      </PrintSheet>
    </div>
  );
}
