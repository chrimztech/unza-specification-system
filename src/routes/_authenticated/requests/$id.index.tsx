import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost, ApiError } from "@/lib/api-client";
import type { RequestEventResponse, RequestResponse, SpecProfileResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { unitName } from "@/lib/requests";
import { formatDate, formatDateTime } from "@/lib/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { RequestAttachments } from "@/components/RequestAttachments";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { QueryError } from "@/components/QueryError";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/requests/$id/")({
  head: () => ({
    meta: [
      { title: "Request detail · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Review the business case, equipment items, CICT specification decision and full audit trail for this request.",
      },
      { property: "og:title", content: "Request detail · UNZA CICT" },
      {
        property: "og:description",
        content: "Approval actions and audit history for a UNZA CICT equipment request.",
      },
    ],
  }),
  component: RequestDetail,
});

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="px-4 py-3">
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

function RequestDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId, isCict } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [approvedProfiles, setApprovedProfiles] = useState<Record<string, string>>({});

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });

  const events = useQuery({
    queryKey: ["request-events", id],
    queryFn: () => apiGet<RequestEventResponse[]>(`/api/requests/${id}/events`),
  });
  const sortedEvents = useMemo(
    () => [...(events.data ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [events.data],
  );

  const specProfiles = useQuery({
    queryKey: ["spec-profiles"],
    queryFn: () => apiGet<SpecProfileResponse[]>("/api/spec-profiles"),
  });

  const r = request.data;
  if (request.isLoading) return <p className="text-sm text-muted-foreground">Loading request…</p>;
  if (request.isError) {
    const deniedOrMissing =
      request.error instanceof ApiError &&
      (request.error.status === 403 || request.error.status === 404);
    if (!deniedOrMissing) {
      return (
        <QueryError
          message="Could not load this request. Your connection or the server may be unavailable."
          onRetry={() => request.refetch()}
        />
      );
    }
  }
  if (!r)
    return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;

  const isRequester = r.requester.id === userId || r.submittedBy.id === userId;
  const isManager = r.manager?.id === userId;
  const canManagerAct = isManager && r.status === "pending_manager";
  const canCictAct = isCict && (r.status === "pending_cict" || r.status === "needs_clarification");
  const canWithdraw =
    isRequester &&
    ["draft", "pending_manager", "pending_cict", "needs_clarification"].includes(r.status);
  const canRespond = isRequester && r.status === "needs_clarification";

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["request", id] });
    queryClient.invalidateQueries({ queryKey: ["request-events", id] });
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  }

  async function runAction(label: string, action: () => Promise<unknown>, requireNote = false) {
    if (!r) return;
    if (requireNote && !note.trim()) {
      toast.error("Please record a reason for this decision.");
      return;
    }
    setBusy(true);
    try {
      await action();
      setNote("");
      toast.success(label);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const respondToClarification = () =>
    runAction(
      "Response sent to CICT",
      () =>
        apiPost(`/api/requests/${r.id}/respond-clarification`, {
          action: "respond_clarification",
          comment: note,
        }),
      true,
    );

  const managerDecision = (
    decision: "approved" | "rejected" | "returned",
    label: string,
    requireNote = false,
  ) =>
    runAction(
      label,
      () =>
        apiPost(`/api/requests/${r.id}/manager-decision`, { decision, note: note || undefined }),
      requireNote,
    );

  const cictDecision = (
    decision: "approved" | "rejected" | "needs_clarification",
    label: string,
    requireNote = false,
  ) =>
    runAction(
      label,
      () =>
        apiPost(`/api/requests/${r.id}/cict-decision`, {
          decision,
          note: note || undefined,
          itemDecisions:
            decision === "approved"
              ? Object.entries(approvedProfiles).map(([itemId, approvedProfileId]) => ({
                  itemId,
                  approvedProfileId,
                }))
              : undefined,
        }),
      requireNote,
    );

  const withdraw = () =>
    runAction("Requester withdrew the request", () => apiPost(`/api/requests/${r.id}/withdraw`));

  async function deleteDraft() {
    if (!r || !confirm("Delete this draft permanently?")) return;
    setBusy(true);
    try {
      await apiDelete(`/api/requests/${r.id}`);
      toast.success("Draft deleted");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      navigate({ to: "/requests" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete this draft");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{r.reference}</p>
          <h1 className="mt-1 font-display text-3xl">{r.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unitName(r) || "Unit not recorded"} · raised {formatDate(r.createdAt)}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/requests/$id/print" params={{ id: r.id }}>
            Printable request form
          </Link>
        </Button>
        {[
          "approved",
          "procurement",
          "purchased",
          "in_stores",
          "completed",
          "return_required",
        ].includes(r.status) && (
          <Button asChild size="sm" variant="outline">
            <Link to="/requests/$id/spec-sheet" params={{ id: r.id }}>
              Specification sheet
            </Link>
          </Button>
        )}
        {["purchased", "in_stores", "completed", "return_required"].includes(r.status) && (
          <Button asChild size="sm" variant="outline">
            <Link to="/requests/$id/purchase-order" params={{ id: r.id }}>
              Purchase order
            </Link>
          </Button>
        )}
        {["in_stores", "completed", "return_required"].includes(r.status) && (
          <Button asChild size="sm" variant="outline">
            <Link to="/requests/$id/stores-receipt" params={{ id: r.id }}>
              Stores receipt
            </Link>
          </Button>
        )}
        {["completed", "return_required"].includes(r.status) && (
          <Button asChild size="sm" variant="outline">
            <Link to="/requests/$id/verification-certificate" params={{ id: r.id }}>
              Verification certificate
            </Link>
          </Button>
        )}
      </div>

      {isRequester && r.status === "draft" && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-secondary/40 p-4">
          <p className="mr-auto text-sm text-muted-foreground">
            This request is still a draft — it has not been sent to anyone yet.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link to="/requests/$id/edit" params={{ id: r.id }}>
              Complete & submit
            </Link>
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={deleteDraft}>
            Delete draft
          </Button>
        </div>
      )}

      {r.status === "approved" && (
        <div className="rounded-md border border-success/30 bg-success/10 p-5">
          <h2 className="font-display text-lg text-success">Approved specification sheet</h2>
          <p className="mt-1 text-sm">
            CICT technical approval recorded {formatDateTime(r.cictDecidedAt)}. This confirms the
            required minimum specification; it is not authority to spend.
          </p>
          {r.cictDecisionNote && <p className="mt-2 text-sm">{r.cictDecisionNote}</p>}
          <Button asChild className="mt-4" size="sm">
            <Link to="/requests/$id/spec-sheet" params={{ id: r.id }}>
              Open printable spec sheet
            </Link>
          </Button>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="surface">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg">Business case</h2>
            <dl className="divide-y divide-border">
              <Field label="Requester" value={r.requester.fullName} />
              <Field label="Requester email" value={r.requester.email} />
              <Field label="Unit / School" value={r.orgUnit?.name ?? r.orgUnitName} />
              <Field label="Department" value={r.department} />
              <Field label="Designation of intended user" value={r.designation} />
              <Field label="Request type" value={r.requestType} />
              <Field label="Business context" value={r.businessContext} />
              <Field label="Justification" value={r.justification} />
              <Field label="Impact if not provided" value={r.impactIfNotProvided} />
              <Field
                label="Requested on behalf of"
                value={
                  r.onBehalfOf ? `${r.onBehalfOf.fullName} (${r.onBehalfOf.email})` : r.requestedFor
                }
              />
              <Field label="Existing asset tag" value={r.existingAssetTag} />
              <Field label="Replacement reason" value={r.replacementReason} />
            </dl>
          </div>

          <div className="surface">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg">
              Equipment items
            </h2>
            <div className="divide-y divide-border">
              {r.items.map((item, index) => {
                const categoryProfiles = (specProfiles.data ?? []).filter(
                  (p) => p.categoryId === item.categoryId,
                );
                return (
                  <div key={item.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold">
                        {index + 1}. {item.categoryName ?? "Uncategorised"} × {item.quantity}
                      </h3>
                      {item.isShared && (
                        <span className="text-xs text-muted-foreground">Shared resource</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.purpose}</p>
                    <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <span>
                        Users:{" "}
                        {item.numberOfUsers
                          ? `${item.numberOfUsers} users`
                          : item.intendedUsers || "—"}
                      </span>
                      <span>Location: {item.location || "—"}</span>
                      <span>Designation: {item.designation || r.designation || "—"}</span>
                      <span>Software: {item.requiredSoftware || "—"}</span>
                      {item.softwareCategory && (
                        <span>Software category: {item.softwareCategory}</span>
                      )}
                      <span>Proposed: {item.proposedSpec || "—"}</span>
                    </div>
                    {item.approvedProfile ? (
                      <div className="mt-3 rounded-sm border border-success/30 bg-success/10 p-3 text-sm">
                        <strong>{item.approvedProfile.tier}</strong> — {item.approvedProfile.name}
                        <dl className="mt-2 space-y-0.5 text-xs">
                          {Object.entries(
                            (item.approvedProfile.specs ?? {}) as Record<string, string>,
                          ).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <dt className="min-w-28 text-muted-foreground">{k}</dt>
                              <dd>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ) : item.recommendedProfile ? (
                      <p className="mt-3 text-xs text-info">
                        Indicative tier: {item.recommendedProfile.tier} —{" "}
                        {item.recommendedProfile.name}
                      </p>
                    ) : null}

                    {canCictAct && categoryProfiles.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <Label className="text-xs">Approved specification profile</Label>
                        <Select
                          value={approvedProfiles[item.id] ?? item.recommendedProfile?.id ?? ""}
                          onValueChange={(v) =>
                            setApprovedProfiles((prev) => ({ ...prev, [item.id]: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select profile" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryProfiles.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.tier} — {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface">
            <h2 className="border-b border-border px-4 py-3 font-display text-lg">
              Funding & timing
            </h2>
            <dl className="divide-y divide-border">
              <Field label="Priority" value={r.priority} />
              <Field label="Priority reason" value={r.priorityReason} />
              <Field label="Required by" value={formatDate(r.requiredBy)} />
              <Field label="Budget status" value={r.budgetStatus} />
              <Field label="Funding source" value={r.fundingSource} />
              <Field label="Cost centre" value={r.costCentre} />
            </dl>
          </div>

          {(canManagerAct || canCictAct || canWithdraw || canRespond) && (
            <div className="surface p-4">
              <h2 className="font-display text-lg">Actions</h2>
              {(canManagerAct || canCictAct || canRespond) && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="note">{canRespond ? "Response to CICT" : "Decision note"}</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Recorded permanently on the audit trail."
                  />
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {canRespond && (
                  <Button disabled={busy} onClick={respondToClarification}>
                    Send response to CICT
                  </Button>
                )}
                {canManagerAct && (
                  <>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        managerDecision("approved", "Manager approved the business need")
                      }
                    >
                      Approve business need
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        managerDecision("returned", "Returned to requester for correction", true)
                      }
                    >
                      Return for correction
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() =>
                        managerDecision("rejected", "Manager rejected the request", true)
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canCictAct && (
                  <>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        cictDecision("approved", "CICT approved the technical specification")
                      }
                    >
                      Approve specification
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        cictDecision("needs_clarification", "CICT requested clarification", true)
                      }
                    >
                      Request clarification
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => cictDecision("rejected", "CICT rejected the request", true)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canWithdraw && (
                  <Button variant="ghost" disabled={busy} onClick={withdraw}>
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          )}

          <RequestAttachments requestId={id} />

          <div className="surface p-4">
            <h2 className="font-display text-lg">Audit trail</h2>
            <ol className="mt-3 space-y-4">
              {sortedEvents.map((e) => (
                <li key={e.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium">{e.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.actorName} · {formatDateTime(e.createdAt)}
                  </p>
                  {e.comment && <p className="mt-1 text-sm">{e.comment}</p>}
                </li>
              ))}
              {sortedEvents.length === 0 && (
                <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
              )}
            </ol>
          </div>
        </div>
      </section>

      <ProcurementPipeline requestId={r.id} status={r.status} onChanged={refresh} />
    </div>
  );
}
