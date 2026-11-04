import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Files,
  Plus,
} from "lucide-react";
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

type StatProps = {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  tone: string;
};

function StatCard({ label, value, hint, icon, tone }: StatProps) {
  return (
    <div className="surface group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>{icon}</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground/80">{hint}</p>
    </div>
  );
}

function RequestTable({
  rows,
  empty,
  title,
  description,
  action,
}: {
  rows: RequestResponse[];
  empty: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {rows.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>

      {rows.length === 0 ? (
        <div className="grid min-h-40 place-items-center px-6 py-10 text-center">
          <div>
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="mt-3 text-sm font-medium">{empty}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              There is nothing requiring attention here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table min-w-[720px] text-sm">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Request</th>
                <th>Unit</th>
                <th>Required by</th>
                <th>Status</th>
                <th aria-label="Open request" />
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => (
                <tr key={request.id}>
                  <td className="font-mono text-xs text-muted-foreground">{request.reference}</td>
                  <td>
                    <Link
                      to="/requests/$id"
                      params={{ id: request.id }}
                      className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {request.title || "Untitled request"}
                    </Link>
                    {request.priority && request.priority !== "normal" && (
                      <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning-foreground">
                        {request.priority}
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground">{unitName(request) || "—"}</td>
                  <td className="text-muted-foreground">{formatDate(request.requiredBy)}</td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="w-12">
                    <Link
                      to="/requests/$id"
                      params={{ id: request.id }}
                      aria-label={`Open ${request.reference}`}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Dashboard() {
  const { userId, isCict, isOversight, displayName, hasRole } = useAuth();
  const requests = useRequests();

  const mine = useMemo(
    () =>
      (requests.data ?? []).filter(
        (request) => request.requester.id === userId || request.submittedBy.id === userId,
      ),
    [requests.data, userId],
  );
  const managerQueue = useMemo(
    () =>
      (requests.data ?? [])
        .filter((request) => request.manager?.id === userId && request.status === "pending_manager")
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [requests.data, userId],
  );
  const cictQueue = useMemo(
    () =>
      isOversight
        ? (requests.data ?? [])
            .filter(
              (request) =>
                request.status === "pending_cict" || request.status === "needs_clarification",
            )
            .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
        : [],
    [requests.data, isOversight],
  );
  // Downstream stage queues: each role holder (and administrators) sees the requests waiting on them.
  const isAdmin = hasRole("admin");
  const seesProcurement = hasRole("procurement") || isAdmin;
  const seesStores = hasRole("stores") || isAdmin;
  const seesVerification = hasRole("cict_support") || isAdmin;
  const stageQueue = useMemo(() => {
    const all = requests.data ?? [];
    const oldestFirst = (a: RequestResponse, b: RequestResponse) =>
      a.createdAt < b.createdAt ? -1 : 1;
    return {
      procurement: seesProcurement
        ? all
            .filter((r) => ["approved", "procurement", "return_required"].includes(r.status))
            .sort(oldestFirst)
        : null,
      stores: seesStores ? all.filter((r) => r.status === "purchased").sort(oldestFirst) : null,
      verification: seesVerification
        ? all.filter((r) => r.status === "in_stores").sort(oldestFirst)
        : null,
    };
  }, [requests.data, seesProcurement, seesStores, seesVerification]);
  const recentMine = useMemo(
    () => [...mine].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8),
    [mine],
  );

  const firstName = displayName.split(" ")[0] || "there";
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const inTechnicalReview = mine.filter(
    (request) => request.status === "pending_cict" || request.status === "needs_clarification",
  ).length;

  const stats: StatProps[] = [
    {
      label: "My requests",
      value: mine.length,
      hint: "Raised by you or on your behalf",
      icon: <Files className="size-5" />,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: "Awaiting my approval",
      value: managerQueue.length,
      hint: "Business cases requiring action",
      icon: <ClipboardCheck className="size-5" />,
      tone: "bg-warning/15 text-warning-foreground",
    },
    {
      label: "In technical review",
      value: inTechnicalReview,
      hint: "Currently being assessed by CICT",
      icon: <Clock3 className="size-5" />,
      tone: "bg-info/10 text-info",
    },
    {
      label: "Approved",
      value: mine.filter((request) => request.status === "approved").length,
      hint: "Specifications ready for procurement",
      icon: <FileCheck2 className="size-5" />,
      tone: "bg-success/10 text-success",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card px-6 py-7 shadow-panel sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_75%_35%,color-mix(in_oklab,var(--color-accent)_28%,transparent),transparent_48%)] lg:block" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{today}</p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Review activity across your equipment requests and continue any work that needs your
              attention.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md">
            <Link to="/requests/new">
              <Plus />
              Create request
            </Link>
          </Button>
        </div>
      </section>

      {requests.isError && (
        <QueryError
          message="Could not load your requests. Your connection or the server may be unavailable."
          onRetry={() => requests.refetch()}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {managerQueue.length > 0 && (
        <RequestTable
          rows={managerQueue}
          title="Awaiting your approval"
          description="Business needs routed to you for a decision"
          empty="You are all caught up"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/approvals">
                View approvals <ArrowRight />
              </Link>
            </Button>
          }
        />
      )}

      {isOversight && (
        <RequestTable
          rows={cictQueue}
          title={isCict ? "CICT technical review" : "Requests in CICT review"}
          description="Requests awaiting assessment or clarification"
          empty="The review queue is clear"
          action={
            isCict ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/reviews">
                  Open queue <ArrowRight />
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}

      {stageQueue.procurement && (
        <RequestTable
          rows={stageQueue.procurement}
          title="Procurement queue"
          description="Approved specifications to source, quotations in progress, and returns to re-source"
          empty="Nothing waiting on procurement"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/procurement">
                Open procurement <ArrowRight />
              </Link>
            </Button>
          }
        />
      )}

      {stageQueue.stores && (
        <RequestTable
          rows={stageQueue.stores}
          title="Awaiting receipt in stores"
          description="Purchased equipment to be received and recorded by stores"
          empty="Nothing waiting on stores"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/stores">
                Open stores <ArrowRight />
              </Link>
            </Button>
          }
        />
      )}

      {stageQueue.verification && (
        <RequestTable
          rows={stageQueue.verification}
          title="Awaiting CICT verification"
          description="Equipment in stores to be checked against the approved specification"
          empty="Nothing waiting on verification"
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/verification">
                Open verification <ArrowRight />
              </Link>
            </Button>
          }
        />
      )}

      <RequestTable
        rows={recentMine}
        title="Recent requests"
        description="The latest equipment requests raised by or for you"
        empty="You have not raised any requests yet"
        action={
          <Button asChild size="sm" variant="ghost">
            <Link to="/requests">
              View all <ArrowRight />
            </Link>
          </Button>
        }
      />
    </div>
  );
}
