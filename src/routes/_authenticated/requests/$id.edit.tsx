import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPut, ApiError } from "@/lib/api-client";
import type { EquipmentCategoryResponse, RequestResponse, UserResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { useLookup } from "@/hooks/useLookups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/requests/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit draft request · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Amend a draft CICT equipment request — business case, equipment items, funding and approving manager — before submitting it for approval.",
      },
      { property: "og:title", content: "Edit draft request · UNZA CICT" },
      {
        property: "og:description",
        content: "Amend and resubmit a draft UNZA CICT equipment specification request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditRequest,
});

type Item = {
  key: string;
  id?: string;
  category_id: string;
  quantity: number;
  purpose: string;
  intended_users: string;
  location: string;
  is_shared: boolean;
  required_software: string;
  proposed_spec: string;
};

function emptyItem(): Item {
  return {
    key: crypto.randomUUID(),
    category_id: "",
    quantity: 1,
    purpose: "",
    intended_users: "",
    location: "",
    is_shared: false,
    required_software: "",
    proposed_spec: "",
  };
}

function EditRequest() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const requestTypes = useLookup("request_type");
  const businessContexts = useLookup("business_context");
  const priorities = useLookup("priority");
  const budgetStatuses = useLookup("budget_status");

  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [onBehalfOfOther, setOnBehalfOfOther] = useState(false);
  const [form, setForm] = useState({
    reference: "",
    title: "",
    request_type: "",
    business_context: "",
    justification: "",
    impact_if_not_provided: "",
    on_behalf_of_id: "",
    requested_for: "",
    existing_asset_tag: "",
    replacement_reason: "",
    priority: "normal",
    priority_reason: "",
    required_by: "",
    budget_status: "",
    funding_source: "",
    cost_centre: "",
    manager_id: "",
  });
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  const request = useQuery({
    queryKey: ["request-edit", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });

  const categories = useQuery({
    queryKey: ["categories-full"],
    queryFn: () => apiGet<EquipmentCategoryResponse[]>("/api/equipment-categories"),
  });
  const activeCategories = useMemo(
    () => (categories.data ?? []).filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories.data],
  );

  const managers = useQuery({
    queryKey: ["managers"],
    enabled: !!userId,
    queryFn: () => apiGet<UserResponse[]>("/api/users"),
  });
  const managerOptions = useMemo(
    () => (managers.data ?? []).filter((m) => m.id !== userId),
    [managers.data, userId],
  );

  const r = request.data ?? null;

  useEffect(() => {
    if (!r || loaded) return;
    setForm({
      reference: r.reference ?? "",
      title: r.title ?? "",
      request_type: r.requestType ?? "",
      business_context: r.businessContext ?? "",
      justification: r.justification ?? "",
      impact_if_not_provided: r.impactIfNotProvided ?? "",
      on_behalf_of_id: r.onBehalfOf?.id ?? "",
      requested_for: r.onBehalfOf ? "" : r.requestedFor ?? "",
      existing_asset_tag: r.existingAssetTag ?? "",
      replacement_reason: r.replacementReason ?? "",
      priority: r.priority ?? "normal",
      priority_reason: r.priorityReason ?? "",
      required_by: r.requiredBy ?? "",
      budget_status: r.budgetStatus ?? "",
      funding_source: r.fundingSource ?? "",
      cost_centre: r.costCentre ?? "",
      manager_id: r.manager?.id ?? "",
    });
    setOnBehalfOfOther(!r.onBehalfOf && !!r.requestedFor);
    const rows = [...r.items].sort((a, b) => a.sortOrder - b.sortOrder);
    setItems(
      rows.length
        ? rows.map((i) => ({
            key: i.id,
            id: i.id,
            category_id: i.categoryId ?? "",
            quantity: i.quantity ?? 1,
            purpose: i.purpose ?? "",
            intended_users: i.intendedUsers ?? "",
            location: i.location ?? "",
            is_shared: !!i.isShared,
            required_software: i.requiredSoftware ?? "",
            proposed_spec: i.proposedSpec ?? "",
          }))
        : [emptyItem()],
    );
    setLoaded(true);
  }, [r, loaded]);

  const costById = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of activeCategories) map.set(c.id, Number(c.indicativeUnitCost ?? 0));
    return map;
  }, [activeCategories]);

  const estimatedTotal = useMemo(
    () => items.reduce((sum, i) => sum + (costById.get(i.category_id) ?? 0) * (i.quantity || 0), 0),
    [items, costById],
  );

  if (request.isLoading) return <p className="text-sm text-muted-foreground">Loading draft…</p>;
  if (!r) return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;

  const isOwner = r.requester.id === userId || r.submittedBy.id === userId;
  if (!isOwner || r.status !== "draft") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Only the requester can edit this request, and only while it is still a draft.
        </p>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </div>
    );
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(item: Item) {
    setItems((prev) => prev.filter((i) => i.key !== item.key));
  }

  const issues = [
    form.reference.trim().length > 2 ? "" : "Enter the CICT Help Desk ticket number for this request.",
    form.title.trim().length > 2 ? "" : "Add a descriptive request title.",
    form.request_type ? "" : "Select the request type.",
    form.justification.trim().length > 10 ? "" : "Give a business justification.",
    items.length ? "" : "Add at least one equipment item.",
    items.every((i) => i.category_id) ? "" : "Every item needs an equipment category.",
    items.every((i) => i.purpose.trim()) ? "" : "Describe what each item will be used for.",
  ].filter(Boolean);

  async function save(submit: boolean) {
    if (!userId || !r) return;
    if (submit && (issues.length > 0 || !form.manager_id)) {
      toast.error(issues[0] ?? "Choose the approving manager.");
      return;
    }
    setBusy(true);
    try {
      await apiPut<RequestResponse>(`/api/requests/${r.id}?submit=${submit}`, {
        reference: form.reference,
        title: form.title,
        requestType: form.request_type,
        businessContext: form.business_context,
        justification: form.justification,
        impactIfNotProvided: form.impact_if_not_provided || undefined,
        onBehalfOfId: form.on_behalf_of_id || undefined,
        requestedFor: form.on_behalf_of_id ? undefined : form.requested_for || undefined,
        existingAssetTag: form.existing_asset_tag || undefined,
        replacementReason: form.replacement_reason || undefined,
        priority: form.priority,
        priorityReason: form.priority_reason || undefined,
        requiredBy: form.required_by || undefined,
        budgetStatus: form.budget_status || undefined,
        fundingSource: form.funding_source || undefined,
        costCentre: form.cost_centre || undefined,
        managerId: form.manager_id || undefined,
        estimatedBudget: estimatedTotal || undefined,
        declarationAccepted: submit ? true : r.declarationAccepted,
        items: items.map((item, index) => ({
          id: item.id,
          categoryId: item.category_id || undefined,
          quantity: item.quantity,
          purpose: item.purpose,
          intendedUsers: item.intended_users || undefined,
          location: item.location || undefined,
          isShared: item.is_shared,
          requiredSoftware: item.required_software || undefined,
          proposedSpec: item.proposed_spec || undefined,
          sortOrder: index,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ["request", r.id] });
      queryClient.invalidateQueries({ queryKey: ["request-edit", r.id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success(submit ? "Submitted for manager approval" : "Draft saved");
      navigate({ to: "/requests/$id", params: { id: r.id } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the draft");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Edit draft request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Amend the business case, equipment items and funding details before submitting for
          approval.
        </p>
      </header>

      {issues.length > 0 && (
        <ul className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {issues.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      )}

      <section className="space-y-4 rounded-md border border-border bg-card p-5 shadow-panel">
        <h2 className="font-display text-xl">Business case</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="reference">CICT Help Desk ticket number</Label>
            <Input
              id="reference"
              value={form.reference}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="e.g. HD-2026-00123"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Request title</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Request type</Label>
            <Select value={form.request_type} onValueChange={(v) => set("request_type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Business context</Label>
            <Select value={form.business_context} onValueChange={(v) => set("business_context", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                {businessContexts.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="justification">Justification</Label>
            <Textarea
              id="justification"
              rows={3}
              value={form.justification}
              onChange={(e) => set("justification", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="impact">Impact if not provided</Label>
            <Textarea
              id="impact"
              rows={2}
              value={form.impact_if_not_provided}
              onChange={(e) => set("impact_if_not_provided", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requested_for">Requested on behalf of</Label>
            <Select
              value={onBehalfOfOther ? "__other__" : form.on_behalf_of_id || "__self__"}
              onValueChange={(v) => {
                if (v === "__other__") {
                  setOnBehalfOfOther(true);
                  set("on_behalf_of_id", "");
                } else if (v === "__self__") {
                  setOnBehalfOfOther(false);
                  set("on_behalf_of_id", "");
                  set("requested_for", "");
                } else {
                  setOnBehalfOfOther(false);
                  set("on_behalf_of_id", v);
                  set("requested_for", "");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Myself" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__self__">Myself</SelectItem>
                {managerOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName || "Unnamed staff"}
                    {m.jobTitle ? ` — ${m.jobTitle}` : ""}
                  </SelectItem>
                ))}
                <SelectItem value="__other__">Someone not listed…</SelectItem>
              </SelectContent>
            </Select>
            {onBehalfOfOther && (
              <Input
                className="mt-1.5"
                value={form.requested_for}
                onChange={(e) => set("requested_for", e.target.value)}
                placeholder="Name of the staff member or team"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset">Existing asset tag</Label>
            <Input
              id="asset"
              value={form.existing_asset_tag}
              onChange={(e) => set("existing_asset_tag", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="replacement">Replacement reason</Label>
            <Input
              id="replacement"
              value={form.replacement_reason}
              onChange={(e) => set("replacement_reason", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-border bg-card p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Equipment items</h2>
          <Button variant="outline" size="sm" onClick={() => setItems((p) => [...p, emptyItem()])}>
            Add item
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={item.key} className="space-y-3 rounded-sm border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Item {index + 1}</h3>
              {items.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeItem(item)}>
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={item.category_id}
                  onValueChange={(v) => patchItem(item.key, { category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    patchItem(item.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Purpose</Label>
                <Textarea
                  rows={2}
                  value={item.purpose}
                  onChange={(e) => patchItem(item.key, { purpose: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Intended users</Label>
                <Input
                  value={item.intended_users}
                  onChange={(e) => patchItem(item.key, { intended_users: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location / office</Label>
                <Input
                  value={item.location}
                  onChange={(e) => patchItem(item.key, { location: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Required software</Label>
                <Input
                  value={item.required_software}
                  onChange={(e) => patchItem(item.key, { required_software: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Proposed specification</Label>
                <Input
                  value={item.proposed_spec}
                  onChange={(e) => patchItem(item.key, { proposed_spec: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={item.is_shared}
                  onChange={(e) => patchItem(item.key, { is_shared: e.target.checked })}
                />
                Shared resource used by more than one member of staff
              </label>
            </div>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Indicative value: ZMW {estimatedTotal.toLocaleString()}
        </p>
      </section>

      <section className="space-y-4 rounded-md border border-border bg-card p-5 shadow-panel">
        <h2 className="font-display text-xl">Funding, timing & approval</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="required_by">Required by</Label>
            <Input
              id="required_by"
              type="date"
              value={form.required_by}
              onChange={(e) => set("required_by", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="priority_reason">Priority reason</Label>
            <Input
              id="priority_reason"
              value={form.priority_reason}
              onChange={(e) => set("priority_reason", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Budget status</Label>
            <Select value={form.budget_status} onValueChange={(v) => set("budget_status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {budgetStatuses.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="funding_source">Funding source</Label>
            <Input
              id="funding_source"
              value={form.funding_source}
              onChange={(e) => set("funding_source", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost_centre">Cost centre</Label>
            <Input
              id="cost_centre"
              value={form.cost_centre}
              onChange={(e) => set("cost_centre", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Approving manager</Label>
            <Select value={form.manager_id} onValueChange={(v) => set("manager_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managerOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName || "Unnamed staff member"}
                    {m.jobTitle ? ` — ${m.jobTitle}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => save(true)}>
          Submit for approval
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => save(false)}>
          Save draft
        </Button>
        <Button asChild variant="ghost">
          <Link to="/requests/$id" params={{ id }}>
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  );
}
