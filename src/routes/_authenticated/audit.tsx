import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, Printer, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { compact, downloadCsv, filterRequests, unitName, useRequests } from "@/lib/requests";
import {
  AUDIT_EXPORT_LIMIT,
  actionLabel,
  actorLabel,
  categoryLabel,
  fetchAuditPage,
  isWarning,
  useAuditCategories,
  useAuditPage,
  type AuditFilters,
} from "@/lib/audit";
import { ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { QueryError } from "@/components/QueryError";
import { formatDate, formatDateTime, STATUS_LABEL, type RequestStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit log · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Tamper-resistant record of sign-ins, request decisions, procurement, configuration changes and documents printed.",
      },
    ],
  }),
  component: AuditPage,
});

const PAGE_SIZE = 50;

/** Delays a fast-changing value (typing) so the server isn't queried on every keystroke. */
function useDebounced<T>(value: T, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function AuditPage() {
  const { hasRole } = useAuth();
  const allowed = hasRole("auditor") || hasRole("admin");

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Oversight</p>
        <h1 className="mt-1 font-display text-3xl">Audit log</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          A permanent record of who did what, when and from where: sign-ins, every request decision,
          procurement and stores records, configuration and role changes, and official documents
          printed. Entries cannot be edited or deleted.
        </p>
      </div>

      {!allowed ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
          <ShieldCheck className="mb-1 mr-2 inline size-4" />
          The audit log is available to auditors and system administrators only.
        </div>
      ) : (
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity log</TabsTrigger>
            <TabsTrigger value="records">Request records</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="mt-6">
            <ActivityLog />
          </TabsContent>
          <TabsContent value="records" className="mt-6">
            <RequestRecords />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ActivityLog() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [actorInput, setActorInput] = useState("");
  const [qInput, setQInput] = useState("");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const actor = useDebounced(actorInput.trim());
  const q = useDebounced(qInput.trim());

  const filters: AuditFilters = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      entityType: entityType === "all" ? undefined : entityType,
      actor: actor || undefined,
      q: q || undefined,
    }),
    [from, to, entityType, actor, q],
  );
  useEffect(() => setPage(0), [filters]);

  const log = useAuditPage(filters, page, PAGE_SIZE);
  const categories = useAuditCategories();
  const total = log.data?.total ?? 0;
  const items = log.data?.items ?? [];
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await fetchAuditPage(filters, 0, AUDIT_EXPORT_LIMIT);
      downloadCsv(
        `unza-cict-audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "Date & time",
          "Name",
          "Email",
          "Category",
          "Action",
          "Details",
          "Record ID",
          "IP address",
        ],
        all.items.map((e) => [
          formatDateTime(e.createdAt),
          e.actorName ?? "",
          e.actorEmail ?? "",
          categoryLabel(e.entityType),
          actionLabel(e.action),
          e.details ?? "",
          e.entityId ?? "",
          e.ipAddress ?? "",
        ]),
      );
      if (all.total > all.items.length)
        toast.warning(
          `Exported the newest ${all.items.length} of ${all.total} entries. Narrow the dates to export the rest.`,
        );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not export the audit log.");
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setFrom("");
    setTo("");
    setEntityType("all");
    setActorInput("");
    setQInput("");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="audit-from" className="label-caps mb-1.5 block">
            From
          </Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="audit-to" className="label-caps mb-1.5 block">
            To
          </Label>
          <Input id="audit-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Label className="label-caps mb-1.5 block">Category</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="audit-actor" className="label-caps mb-1.5 block">
            User
          </Label>
          <Input
            id="audit-actor"
            value={actorInput}
            onChange={(e) => setActorInput(e.target.value)}
            placeholder="Name or email"
          />
        </div>
        <div>
          <Label htmlFor="audit-q" className="label-caps mb-1.5 block">
            Search
          </Label>
          <Input
            id="audit-q"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Reference, detail, action…"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {log.isLoading
            ? "Loading…"
            : total === 0
              ? "No entries match these filters."
              : `Showing ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + items.length} of ${total.toLocaleString()} entries, newest first.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={exporting || total === 0}
          >
            <Download />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button asChild size="sm" disabled={total === 0}>
            <Link to="/audit/print" search={compact(filters)}>
              <Printer />
              Print / PDF
            </Link>
          </Button>
        </div>
      </div>

      {log.isError && (
        <QueryError message="Could not load the audit log." onRetry={() => log.refetch()} />
      )}

      <div className="surface overflow-x-auto">
        <table className="data-table min-w-[960px] text-sm">
          <thead>
            <tr>
              <th>Date &amp; time</th>
              <th>User</th>
              <th>Category</th>
              <th>Action</th>
              <th>Details</th>
              <th>IP address</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className={isWarning(e) ? "bg-destructive/5" : undefined}>
                <td className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(e.createdAt)}
                </td>
                <td>
                  <div className="font-medium">{actorLabel(e)}</div>
                  {e.actorName && e.actorEmail && (
                    <div className="text-xs text-muted-foreground">{e.actorEmail}</div>
                  )}
                </td>
                <td className="whitespace-nowrap text-muted-foreground">
                  {categoryLabel(e.entityType)}
                </td>
                <td className={isWarning(e) ? "font-semibold text-destructive" : "font-medium"}>
                  {actionLabel(e.action)}
                </td>
                <td className="max-w-md">
                  {e.entityType === "Request" && e.entityId ? (
                    <Link
                      to="/requests/$id"
                      params={{ id: e.entityId }}
                      className="hover:text-primary hover:underline"
                    >
                      {e.details || "Open request"}
                    </Link>
                  ) : (
                    e.details || "—"
                  )}
                </td>
                <td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {e.ipAddress || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
            Newer
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {lastPage + 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            Older
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

const STATUSES = ["all", ...Object.keys(STATUS_LABEL)] as ("all" | RequestStatus)[];

function RequestRecords() {
  const { userId } = useAuth();
  const requests = useRequests();
  const [status, setStatus] = useState<"all" | RequestStatus>("all");
  const [unit, setUnit] = useState("all");
  const [search, setSearch] = useState("");

  const units = useMemo(
    () =>
      Array.from(
        new Set((requests.data ?? []).map((r) => unitName(r)).filter((u): u is string => !!u)),
      ).sort(),
    [requests.data],
  );
  const rows = useMemo(
    () => filterRequests(requests.data ?? [], { status, unit, q: search }, userId),
    [requests.data, status, unit, search, userId],
  );

  function exportCsv() {
    downloadCsv(
      `unza-cict-request-records-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Reference",
        "Title",
        "Unit",
        "Requester",
        "Status",
        "Priority",
        "Created",
        "Submitted",
        "Manager",
        "Manager decided",
        "Manager note",
        "CICT decided by",
        "CICT decided",
        "CICT note",
      ],
      rows.map((r) => [
        r.reference,
        r.title || "Untitled request",
        unitName(r) || "",
        r.requester.fullName,
        STATUS_LABEL[r.status],
        r.priority ?? "",
        formatDateTime(r.createdAt),
        formatDateTime(r.submittedAt),
        r.manager?.fullName ?? "",
        formatDateTime(r.managerDecidedAt),
        r.managerDecisionNote || "",
        r.cictDecidedBy?.fullName ?? "",
        formatDateTime(r.cictDecidedAt),
        r.cictDecisionNote || "",
      ]),
    );
  }

  return (
    <div className="space-y-5">
      {requests.isError && (
        <QueryError message="Could not load request records." onRetry={() => requests.refetch()} />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="w-64">
            <Label className="label-caps mb-1.5 block">Search</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, title or unit"
            />
          </div>
          <div className="w-48">
            <Label className="label-caps mb-1.5 block">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "all" | RequestStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-56">
            <Label className="label-caps mb-1.5 block">Organisational unit</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download />
            Export CSV
          </Button>
          <Button asChild variant="outline">
            <Link
              to="/requests/register"
              search={compact({
                status: status === "all" ? undefined : status,
                unit: unit === "all" ? undefined : unit,
                q: search.trim() || undefined,
              })}
            >
              <Printer />
              Print register
            </Link>
          </Button>
        </div>
      </div>

      <div className="surface overflow-x-auto">
        <table className="data-table min-w-[760px] text-sm">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Title</th>
              <th>Unit</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  {requests.isLoading ? "Loading…" : "No requests match the current filters."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">
                    <Link to="/requests/$id" params={{ id: r.id }} className="hover:underline">
                      {r.reference}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to="/requests/$id"
                      params={{ id: r.id }}
                      className="font-medium hover:underline"
                    >
                      {r.title || "Untitled request"}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{unitName(r) || "—"}</td>
                  <td className="text-muted-foreground">{formatDate(r.submittedAt)}</td>
                  <td>
                    <StatusBadge status={r.status} />
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
