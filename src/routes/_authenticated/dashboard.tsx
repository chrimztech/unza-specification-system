import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequests, unitName } from "@/lib/requests";
import { StatusBadge } from "@/components/StatusBadge";
import { QueryError } from "@/components/QueryError";
import { formatDate } from "@/lib/domain";
import type { RequestResponse } from "@/lib/api-types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Track your CICT equipment requests, manager approvals and CICT technical review queues.",
      },
      { property: "og:title", content: "Dashboard · UNZA CICT Specification System" },
      {
        property: "og:description",
        content: "Requests awaiting your action across the UNZA CICT specification workflow.",
      },
    ],
  }),
  component: Dashboard,
});

function RequestTable({ rows, empty }: { rows: RequestResponse[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <div className="surface overflow-hidden">
      <table className="data-table text-sm">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Title</th>
            <th className="hidden md:table-cell">Unit</th>
            <th className="hidden sm:table-cell">Required by</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs text-muted-foreground">
                <Link
                  to="/requests/$id"
                  params={{ id: r.id }}
                  className="underline-offset-4 hover:text-primary hover:underline"
                >
                  {r.reference}
                </Link>
              </td>
              <td>
                <Link
                  to="/requests/$id"
                  params={{ id: r.id }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {r.title || "Untitled request"}
                </Link>
                {r.priority && r.priority !== "normal" && (
                  <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
                    {r.priority}
                  </span>
                )}
              </td>
              <td className="hidden text-muted-foreground md:table-cell">{unitName(r) || "—"}</td>
              <td className="hidden text-muted-foreground sm:table-cell">
                {formatDate(r.requiredBy)}
              </td>
              <td>
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function Dashboard() {
  const { userId, isCict, isOversight, displayName } = useAuth();
  const requests = useRequests();

  const mine = useMemo(
    () => (requests.data ?? []).filter((r) => r.requester.id === userId || r.submittedBy.id === userId),
    [requests.data, userId],
  );
  const managerQueue = useMemo(
    () =>
      (requests.data ?? [])
        .filter((r) => r.manager?.id === userId && r.status === "pending_manager")
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [requests.data, userId],
  );
  const cictQueue = useMemo(
    () =>
      isOversight
        ? (requests.data ?? [])
            .filter((r) => r.status === "pending_cict" || r.status === "needs_clarification")
            .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
        : [],
    [requests.data, isOversight],
  );

  const stats = [
    { label: "My requests", value: mine.length, hint: "Raised by or for you" },
    {
      label: "Awaiting my approval",
      value: managerQueue.length,
      hint: "Business need confirmation",
    },
    { label: "In CICT review", value: cictQueue.length, hint: "Technical assessment" },
    {
      label: "Approved specifications",
      value: mine.filter((r) => r.status === "approved").length,
      hint: "Ready for procurement",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="crest-header crest-header-motif overflow-hidden rounded-xl px-7 py-8 text-primary-foreground shadow-lift">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-foreground/70">
              Workspace
            </p>
            <h1 className="mt-2 font-display text-4xl">Good day, {displayName.split(" ")[0]}</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
              Everything routed to you across the specification workflow — approvals, technical
              review and approved specification sheets.
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="rounded-full shadow-panel transition-transform hover:scale-[1.03]"
          >
            <Link to="/requests/new">Start a new request</Link>
          </Button>
        </div>
      </section>

      {requests.isError && (
        <QueryError
          message="Could not load your requests. Your connection or the server may be unavailable."
          onRetry={() => requests.refetch()}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-tile p-5 pl-6">
            <div className="label-caps">{s.label}</div>
            <div className="mt-2 font-display text-4xl tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      {managerQueue.length > 0 && (
        <section className="space-y-4">
          <h2 className="gold-underline font-display text-xl">Awaiting your manager approval</h2>
          <RequestTable rows={managerQueue} empty="Nothing awaiting your approval." />
        </section>
      )}

      {isOversight && (
        <section className="space-y-4">
          <h2 className="gold-underline font-display text-xl">
            {isCict ? "CICT technical review queue" : "Requests in CICT review"}
          </h2>
          <RequestTable rows={cictQueue} empty="No requests are currently waiting for CICT." />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="gold-underline font-display text-xl">My requests</h2>
        <RequestTable
          rows={mine}
          empty="You have not raised any requests yet. Start one to see it here."
        />
      </section>
    </div>
  );
}
