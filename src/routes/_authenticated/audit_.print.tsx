import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { describeFilters, stringParams } from "@/lib/requests";
import { AUDIT_EXPORT_LIMIT, actionLabel, categoryLabel, useAuditPage } from "@/lib/audit";
import { formatDate, formatDateTime } from "@/lib/domain";
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

export const Route = createFileRoute("/_authenticated/audit_/print")({
  validateSearch: stringParams(["from", "to", "actor", "entityType", "q"] as const),
  head: () => ({ meta: [{ title: "Audit trail report · UNZA CICT" }] }),
  component: PrintableAuditTrail,
});

/** Printable audit trail for the filters chosen on the Audit log page. */
function PrintableAuditTrail() {
  const filters = Route.useSearch();
  const { hasRole } = useAuth();
  const allowed = hasRole("auditor") || hasRole("admin");
  const log = useAuditPage(filters, 0, AUDIT_EXPORT_LIMIT, allowed);

  if (!allowed)
    return (
      <p className="text-sm text-muted-foreground">
        The audit log is available to auditors and system administrators only.
      </p>
    );
  if (log.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const items = log.data?.items ?? [];
  const total = log.data?.total ?? 0;
  const period =
    filters.from || filters.to
      ? `${filters.from ? formatDate(filters.from) : "the beginning"} to ${filters.to ? formatDate(filters.to) : "today"}`
      : "All time";

  return (
    <div className="space-y-6">
      <PrintToolbar document="Audit trail report" reference={period}>
        <Button asChild variant="outline">
          <Link to="/audit">Back to audit log</Link>
        </Button>
      </PrintToolbar>

      <PrintSheet wide>
        <Letterhead
          documentTitle="Audit Trail Report"
          subtitle="Confidential: for audit and oversight use"
        />
        <LetterheadMeta
          rows={[
            ["Period", period],
            [
              "Filters",
              describeFilters([
                ["Category", filters.entityType ? categoryLabel(filters.entityType) : undefined],
                ["User", filters.actor],
                ["Search", filters.q],
              ]),
            ],
            [
              "Entries",
              total > items.length
                ? `${items.length} newest of ${total} matching (narrow the dates to print the rest)`
                : String(total),
            ],
          ]}
        />

        <DocumentSection title="Activity">
          <DocumentTable
            headers={["Date & time", "User", "Category", "Action", "Details", "IP address"]}
            empty="No audit entries match these filters."
            rows={items.map((e) => [
              <span className="whitespace-nowrap">{formatDateTime(e.createdAt)}</span>,
              <>
                <div className="font-semibold">{e.actorName || e.actorEmail || "System"}</div>
                {e.actorName && e.actorEmail && (
                  <div className="text-neutral-600">{e.actorEmail}</div>
                )}
              </>,
              categoryLabel(e.entityType),
              actionLabel(e.action),
              e.details || "—",
              <span className="font-mono">{e.ipAddress || "—"}</span>,
            ])}
          />
        </DocumentSection>

        <DocumentFooter note="The audit log is append-only: entries cannot be edited or deleted by any user, including administrators." />
      </PrintSheet>
    </div>
  );
}
