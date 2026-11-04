import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import type {
  EquipmentCategoryResponse,
  OrgUnitResponse,
  RequestResponse,
  SpecProfileResponse,
  UserResponse,
} from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { uniqueId } from "@/lib/utils";
import { recommendTier } from "@/lib/domain";
import { useLookup, useSettings } from "@/hooks/useLookups";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSET_CLASS_ORDER = [
  "End-user computing",
  "Peripheral",
  "Networking",
  "Software",
  "Audio visual",
  "Server and datacentre",
  "Power and protection",
];

function assetClassRank(assetClass: string | null) {
  const index = ASSET_CLASS_ORDER.indexOf(assetClass ?? "");
  return index === -1 ? ASSET_CLASS_ORDER.length : index;
}

/** Mirrors the Standard/Enhanced/Specialised volume bands SpecProfileService.recommend() escalates on. */
function printerSuitability(numberOfUsers: number | null) {
  if (!numberOfUsers || numberOfUsers <= 1) return "Personal printer — 1 user";
  if (numberOfUsers <= 5) return "Standard — suits up to 5 users";
  if (numberOfUsers <= 15) return "Enhanced — suits 6–15 shared users";
  return "Specialised — suits 16+ high-volume shared users";
}

export const Route = createFileRoute("/_authenticated/requests/new")({
  head: () => ({
    meta: [
      { title: "New equipment request · UNZA CICT" },
      {
        name: "description",
        content:
          "Raise a CICT equipment specification request for manager approval and CICT technical review.",
      },
      { property: "og:title", content: "New equipment request · UNZA CICT" },
      {
        property: "og:description",
        content: "Capture the business need, equipment items and usage context in one guided form.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRequest,
});

type Item = {
  key: string;
  category_id: string;
  quantity: number;
  purpose: string;
  intended_users: string;
  number_of_users: number | null;
  location: string;
  designation: string;
  designation_other: string;
  is_shared: boolean;
  required_software: string;
  software_category: string;
  proposed_spec: string;
};

const emptyItem = (): Item => ({
  key: uniqueId(),
  category_id: "",
  quantity: 1,
  purpose: "",
  intended_users: "",
  number_of_users: null,
  location: "",
  designation: "",
  designation_other: "",
  is_shared: false,
  required_software: "",
  software_category: "",
  proposed_spec: "",
});

const STEPS = [
  { label: "Business need", hint: "What the work requires and why" },
  { label: "Equipment items", hint: "Each item, its use and its users" },
  { label: "Funding & timing", hint: "Priority, budget and deadlines" },
  { label: "Review & submit", hint: "Confirm and send for approval" },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    maximumFractionDigits: 0,
  }).format(value);

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function Required() {
  return <span className="ml-0.5 text-destructive">*</span>;
}

function NewRequest() {
  const navigate = useNavigate();
  const { userId, profile, displayName, email } = useAuth();
  const requestTypes = useLookup("request_type");
  const businessContexts = useLookup("business_context");
  const priorities = useLookup("priority");
  const budgetStatuses = useLookup("budget_status");
  const softwareCategories = useLookup("software_category");
  const designations = useLookup("designation");
  const { setting } = useSettings();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [designationOther, setDesignationOther] = useState("");
  const [requestType, setRequestType] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [justification, setJustification] = useState("");
  const [impact, setImpact] = useState("");
  const [onBehalfOfId, setOnBehalfOfId] = useState("");
  const [onBehalfOfOther, setOnBehalfOfOther] = useState(false);
  const [requestedFor, setRequestedFor] = useState("");
  const [existingAssetTag, setExistingAssetTag] = useState("");
  const [existingAssetDetails, setExistingAssetDetails] = useState("");
  const [replacementReason, setReplacementReason] = useState("");
  const [priority, setPriority] = useState("normal");
  const [priorityReason, setPriorityReason] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [budgetStatus, setBudgetStatus] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [costCentre, setCostCentre] = useState("");
  const [managerId, setManagerId] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  const categories = useQuery({
    queryKey: ["categories-full"],
    queryFn: () => apiGet<EquipmentCategoryResponse[]>("/api/equipment-categories"),
  });
  const activeCategories = useMemo(
    () =>
      (categories.data ?? [])
        .filter((c) => c.active)
        .sort(
          (a, b) =>
            assetClassRank(a.assetClass) - assetClassRank(b.assetClass) ||
            a.sortOrder - b.sortOrder,
        ),
    [categories.data],
  );
  const categoriesByAssetClass = useMemo(() => {
    const groups = new Map<string, EquipmentCategoryResponse[]>();
    for (const c of activeCategories) {
      const key = c.assetClass ?? "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return groups;
  }, [activeCategories]);

  const orgUnits = useQuery({
    queryKey: ["org-units"],
    queryFn: () => apiGet<OrgUnitResponse[]>("/api/org-units"),
  });
  const unitOptions = useMemo(
    () =>
      (orgUnits.data ?? [])
        .filter((u) => u.active && u.unitType !== "department")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [orgUnits.data],
  );

  const specProfiles = useQuery({
    queryKey: ["spec-profiles"],
    queryFn: () => apiGet<SpecProfileResponse[]>("/api/spec-profiles"),
  });

  const managers = useQuery({
    queryKey: ["managers"],
    queryFn: () => apiGet<UserResponse[]>("/api/users"),
    enabled: !!userId,
  });
  const managerOptions = useMemo(
    () => (managers.data ?? []).filter((m) => m.id !== userId),
    [managers.data, userId],
  );

  const onBehalfOfUser = useMemo(
    () => (managers.data ?? []).find((m) => m.id === onBehalfOfId) ?? null,
    [managers.data, onBehalfOfId],
  );

  const positionLevel = profile?.positionLevel ?? null;
  const effectivePositionLevel = onBehalfOfUser ? onBehalfOfUser.positionLevel : positionLevel;

  useEffect(() => {
    if (unitId || !profile?.orgUnit) return;
    if (unitOptions.some((u) => u.id === profile.orgUnit!.id)) {
      setUnitId(profile.orgUnit.id);
    }
  }, [profile, unitOptions, unitId]);

  const selectedUnit = useMemo(
    () => unitOptions.find((u) => u.id === unitId) ?? null,
    [unitOptions, unitId],
  );
  const orgUnitName = selectedUnit?.name ?? null;

  const categoryById = useMemo(() => {
    const map = new Map<string, EquipmentCategoryResponse>();
    for (const c of activeCategories) map.set(c.id, c);
    return map;
  }, [activeCategories]);

  const recommendations = useMemo(() => {
    const map: Record<string, { name: string; tier: string; id: string } | null> = {};
    for (const item of items) {
      const itemLevel =
        (item.designation === "Other" ? item.designation_other : item.designation) ||
        effectivePositionLevel;
      const rec = recommendTier(
        specProfiles.data ?? [],
        item.category_id || null,
        itemLevel,
        item.number_of_users,
      );
      map[item.key] = rec ? { id: rec.id, name: rec.name, tier: rec.tier } : null;
    }
    return map;
  }, [items, specProfiles.data, effectivePositionLevel]);

  const estimatedTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const cost = categoryById.get(item.category_id)?.indicativeUnitCost ?? 0;
        return sum + Number(cost) * (item.quantity || 0);
      }, 0),
    [items, categoryById],
  );

  const longestLeadTime = useMemo(
    () =>
      items.reduce((max, item) => {
        const lead = categoryById.get(item.category_id)?.procurementLeadTimeDays ?? 0;
        return Math.max(max, Number(lead) || 0);
      }, 0),
    [items, categoryById],
  );

  function patchItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  const stepIssues: string[][] = [
    [
      title.trim().length > 2 ? "" : "Add a descriptive request title.",
      unitId ? "" : "Select your Unit/School.",
      department.trim() ? "" : "Enter your department.",
      designation && (designation !== "Other" || designationOther.trim())
        ? ""
        : "Enter the designation of the intended user.",
      requestType ? "" : "Select the request type.",
      businessContext ? "" : "Select the business context.",
      justification.trim().length > 10
        ? ""
        : "Give a business justification (at least a sentence).",
    ].filter(Boolean),
    [
      items.length > 0 ? "" : "Add at least one equipment item.",
      items.every((i) => i.category_id) ? "" : "Every item needs an equipment category.",
      items.every((i) => i.quantity > 0) ? "" : "Quantities must be one or more.",
      items.every((i) => i.purpose.trim()) ? "" : "Describe what each item will be used for.",
      items.every(
        (i) => categoryById.get(i.category_id)?.code !== "PRINTER" || (i.number_of_users ?? 0) > 0,
      )
        ? ""
        : "Specify the number of users for each printer.",
      items.every(
        (i) => categoryById.get(i.category_id)?.assetClass !== "Software" || i.software_category,
      )
        ? ""
        : "Select a software category for each software item.",
    ].filter(Boolean),
    [
      priority !== "normal" && !priorityReason.trim() ? "Explain the elevated priority." : "",
    ].filter(Boolean),
    [
      managerId ? "" : "Choose the approving manager.",
      declaration ? "" : "Accept the declaration before submitting.",
    ].filter(Boolean),
  ];
  const issues = stepIssues[step] ?? [];
  const stepValid = issues.length === 0;

  async function save(submit: boolean) {
    if (!userId) return;
    setBusy(true);
    try {
      const created = await apiPost<RequestResponse>(`/api/requests?submit=${submit}`, {
        title,
        requestType,
        businessContext,
        justification,
        impactIfNotProvided: impact || undefined,
        onBehalfOfId: onBehalfOfId || undefined,
        requestedFor: onBehalfOfId ? undefined : requestedFor || undefined,
        existingAssetTag: existingAssetTag || undefined,
        existingAssetDetails: existingAssetDetails || undefined,
        replacementReason: replacementReason || undefined,
        priority,
        priorityReason: priorityReason || undefined,
        requiredBy: requiredBy || undefined,
        budgetStatus: budgetStatus || undefined,
        fundingSource: fundingSource || undefined,
        costCentre: costCentre || undefined,
        estimatedBudget: estimatedTotal || undefined,
        orgUnitId: unitId || undefined,
        orgUnitName: orgUnitName ?? undefined,
        department: department || undefined,
        designation:
          designation === "Other" ? designationOther || undefined : designation || undefined,
        managerId: managerId || undefined,
        declarationAccepted: submit ? declaration : false,
        items: items.map((item, index) => ({
          categoryId: item.category_id,
          quantity: item.quantity,
          purpose: item.purpose,
          intendedUsers: item.intended_users || undefined,
          numberOfUsers: item.number_of_users ?? undefined,
          location: item.location || undefined,
          designation:
            item.designation === "Other"
              ? item.designation_other || undefined
              : item.designation || undefined,
          isShared: item.is_shared,
          requiredSoftware: item.required_software || undefined,
          softwareCategory: item.software_category || undefined,
          proposedSpec: item.proposed_spec || undefined,
          sortOrder: index,
        })),
      });

      toast.success(
        submit ? `Submitted as ${created.reference}` : `Draft saved as ${created.reference}`,
      );
      navigate({ to: "/requests/$id", params: { id: created.id } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the request");
    } finally {
      setBusy(false);
    }
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="space-y-8">
      <header className="surface p-6">
        <p className="label-caps">New submission</p>
        <h1 className="mt-1 font-display text-3xl">CICT equipment request</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Describe the need in business terms. CICT determines the technical specification against
          approved institutional standards, so you do not need to name products or models.
        </p>
        <dl className="mt-5 grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="label-caps">Requester</dt>
            <dd className="mt-1 font-medium">{displayName || "—"}</dd>
          </div>
          <div>
            <dt className="label-caps">Requester email</dt>
            <dd className="mt-1 font-medium">{email || "—"}</dd>
          </div>
          <div>
            <dt className="label-caps">Position level</dt>
            <dd className="mt-1 font-medium">{positionLevel || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="label-caps">Service standard</dt>
            <dd className="mt-1 font-medium">
              {setting("manager_sla_days")} + {setting("cict_sla_days")} working days
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <nav aria-label="Form progress" className="rounded-md border border-border bg-card p-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ol className="mt-4 grid gap-3 sm:grid-cols-4">
              {STEPS.map((s, i) => {
                const state = i === step ? "current" : i < step ? "done" : "todo";
                return (
                  <li key={s.label}>
                    <button
                      type="button"
                      onClick={() => i < step && setStep(i)}
                      className={`w-full text-left ${i < step ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          state === "current"
                            ? "bg-primary text-primary-foreground"
                            : state === "done"
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {state === "done" ? "✓" : i + 1}
                      </span>
                      <span
                        className={`mt-2 block text-sm font-medium ${
                          state === "todo" ? "text-muted-foreground" : ""
                        }`}
                      >
                        {s.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{s.hint}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="surface p-6">
            {step === 0 && (
              <div className="space-y-6">
                <SectionHeading
                  title="Business need"
                  description="Set out the work that requires equipment and the consequence of not providing it."
                />
                <div className="space-y-1.5">
                  <Label htmlFor="title">
                    Request title
                    <Required />
                  </Label>
                  <Input
                    id="title"
                    maxLength={140}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Replacement desktops for the Registry front office"
                  />
                  <FieldNote>
                    Used on approvals and the specification sheet. {140 - title.length} characters
                    remaining.
                  </FieldNote>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>
                      Unit / School
                      <Required />
                    </Label>
                    <Select value={unitId} onValueChange={setUnitId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your unit or school" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="department">
                      Department
                      <Required />
                    </Label>
                    <Input
                      id="department"
                      maxLength={120}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Dean's office"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Designation of intended user
                    <Required />
                  </Label>
                  <Select value={designation} onValueChange={setDesignation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {designation === "Other" && (
                    <Input
                      className="mt-1.5"
                      maxLength={120}
                      value={designationOther}
                      onChange={(e) => setDesignationOther(e.target.value)}
                      placeholder="Please specify the designation"
                    />
                  )}
                  <FieldNote>
                    Use this when the equipment is intended for a role rather than yourself, e.g.
                    "Assistant Dean Undergraduate &amp; Assistant Dean Postgraduate".
                  </FieldNote>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>
                      Request type
                      <Required />
                    </Label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {requestTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Business context
                      <Required />
                    </Label>
                    <Select value={businessContext} onValueChange={setBusinessContext}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select context" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessContexts.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="justification">
                    Business justification
                    <Required />
                  </Label>
                  <Textarea
                    id="justification"
                    rows={5}
                    maxLength={2000}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explain the work that requires this equipment and why current arrangements are insufficient."
                  />
                  <FieldNote>
                    Reviewers weigh this against institutional priorities. {justification.length}
                    /2000 characters.
                  </FieldNote>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="impact">Impact if not provided</Label>
                  <Textarea
                    id="impact"
                    rows={3}
                    maxLength={1000}
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    placeholder="Service delays, teaching disruption, compliance or audit exposure."
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="for">Requested on behalf of (optional)</Label>
                    <Select
                      value={onBehalfOfOther ? "__other__" : onBehalfOfId || "__self__"}
                      onValueChange={(v) => {
                        if (v === "__other__") {
                          setOnBehalfOfOther(true);
                          setOnBehalfOfId("");
                        } else if (v === "__self__") {
                          setOnBehalfOfOther(false);
                          setOnBehalfOfId("");
                          setRequestedFor("");
                        } else {
                          setOnBehalfOfOther(false);
                          setOnBehalfOfId(v);
                          setRequestedFor("");
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
                        maxLength={120}
                        value={requestedFor}
                        onChange={(e) => setRequestedFor(e.target.value)}
                        placeholder="Name of the staff member or team"
                      />
                    )}
                    <FieldNote>
                      The specification is tailored to this person's position level, not yours.
                    </FieldNote>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tag">Existing asset tag (if replacement)</Label>
                    <Input
                      id="tag"
                      maxLength={60}
                      value={existingAssetTag}
                      onChange={(e) => setExistingAssetTag(e.target.value)}
                      placeholder="UNZA/CICT/ASSET/0000"
                    />
                  </div>
                </div>
                {existingAssetTag && (
                  <div className="grid gap-5 rounded-sm border border-border bg-secondary/30 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="details">Existing equipment details</Label>
                      <Textarea
                        id="details"
                        rows={3}
                        value={existingAssetDetails}
                        onChange={(e) => setExistingAssetDetails(e.target.value)}
                        placeholder="Make, model and approximate year of issue."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="repl">Reason for replacement</Label>
                      <Textarea
                        id="repl"
                        rows={3}
                        value={replacementReason}
                        onChange={(e) => setReplacementReason(e.target.value)}
                        placeholder="Beyond economic repair, out of warranty, no longer supported."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <SectionHeading
                  title="Equipment items"
                  description="Add one line per equipment type. CICT maps each line to an approved specification profile."
                />
                {items.map((item, index) => {
                  const cat = categoryById.get(item.category_id);
                  const eligible =
                    !cat ||
                    cat.eligiblePositionLevels.length === 0 ||
                    !effectivePositionLevel ||
                    cat.eligiblePositionLevels.includes(effectivePositionLevel);
                  return (
                    <div key={item.key} className="rounded-md border border-border">
                      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                        <h3 className="font-display text-base">
                          Item {index + 1}
                          {cat ? ` · ${cat.name}` : ""}
                        </h3>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItems((p) => p.filter((i) => i.key !== item.key))}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4 p-4">
                        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                          <div className="space-y-1.5">
                            <Label>
                              Equipment category
                              <Required />
                            </Label>
                            <Select
                              value={item.category_id}
                              onValueChange={(v) => patchItem(item.key, { category_id: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from(categoriesByAssetClass.entries()).map(
                                  ([assetClass, cats]) => (
                                    <SelectGroup key={assetClass}>
                                      <SelectLabel>{assetClass}</SelectLabel>
                                      {cats.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.icon ? `${c.icon} ` : ""}
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>
                              Quantity
                              <Required />
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={200}
                              value={item.quantity}
                              onChange={(e) =>
                                patchItem(item.key, {
                                  quantity: Math.min(200, Math.max(1, Number(e.target.value) || 1)),
                                })
                              }
                            />
                          </div>
                        </div>

                        {cat && (
                          <div className="rounded-sm border border-border bg-secondary/30 p-3">
                            <p className="label-caps">Standards guidance</p>
                            <dl className="mt-2 grid gap-3 text-xs sm:grid-cols-4">
                              <div>
                                <dt className="text-muted-foreground">Indicative unit cost</dt>
                                <dd className="font-medium">
                                  {cat.indicativeUnitCost
                                    ? money(Number(cat.indicativeUnitCost))
                                    : "—"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Procurement lead time</dt>
                                <dd className="font-medium">
                                  {cat.procurementLeadTimeDays
                                    ? `${cat.procurementLeadTimeDays} days`
                                    : "—"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Replacement cycle</dt>
                                <dd className="font-medium">
                                  {cat.typicalLifespanYears
                                    ? `${cat.typicalLifespanYears} years`
                                    : "—"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Warranty</dt>
                                <dd className="font-medium">
                                  {cat.standardWarrantyMonths
                                    ? `${cat.standardWarrantyMonths} months`
                                    : "—"}
                                </dd>
                              </div>
                            </dl>
                            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                              {cat.requiresCictReview && (
                                <span className="rounded-full border border-border px-2 py-0.5">
                                  CICT technical review
                                </span>
                              )}
                              {cat.requiresNetworkPort && (
                                <span className="rounded-full border border-border px-2 py-0.5">
                                  Network port required
                                </span>
                              )}
                              {cat.requiresSoftwareLicence && (
                                <span className="rounded-full border border-border px-2 py-0.5">
                                  Software licence required
                                </span>
                              )}
                              {cat.policyReference && (
                                <span className="rounded-full border border-border px-2 py-0.5">
                                  {cat.policyReference}
                                </span>
                              )}
                            </div>
                            {cat.supportNotes && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {cat.supportNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {!eligible && (
                          <p className="rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
                            This category is normally issued to:{" "}
                            {cat!.eligiblePositionLevels.join(", ")}. You may still request it —
                            provide a clear justification for the exception.
                          </p>
                        )}

                        <div className="space-y-1.5">
                          <Label>
                            What will it be used for?
                            <Required />
                          </Label>
                          <Textarea
                            rows={3}
                            maxLength={800}
                            value={item.purpose}
                            onChange={(e) => patchItem(item.key, { purpose: e.target.value })}
                            placeholder="Daily tasks, systems used, teaching or research activity."
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {cat?.code === "PRINTER" ? (
                            <div className="space-y-1.5">
                              <Label>
                                Number of users
                                <Required />
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={10000}
                                value={item.number_of_users ?? ""}
                                onChange={(e) =>
                                  patchItem(item.key, {
                                    number_of_users: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                                placeholder="e.g. 8"
                              />
                              <FieldNote>{printerSuitability(item.number_of_users)}</FieldNote>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label>Intended users</Label>
                              <Input
                                value={item.intended_users}
                                onChange={(e) =>
                                  patchItem(item.key, { intended_users: e.target.value })
                                }
                                placeholder="Two registry officers"
                              />
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label>Location / office</Label>
                            <Input
                              value={item.location}
                              onChange={(e) => patchItem(item.key, { location: e.target.value })}
                              placeholder="Great East Road campus, Registry, Room 12"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Designation of this item's user (optional)</Label>
                          <Select
                            value={item.designation}
                            onValueChange={(v) => patchItem(item.key, { designation: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Defaults to the request's designation" />
                            </SelectTrigger>
                            <SelectContent>
                              {designations.map((d) => (
                                <SelectItem key={d.value} value={d.value}>
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.designation === "Other" && (
                            <Input
                              className="mt-1.5"
                              maxLength={120}
                              value={item.designation_other}
                              onChange={(e) =>
                                patchItem(item.key, { designation_other: e.target.value })
                              }
                              placeholder="Please specify the designation"
                            />
                          )}
                          <FieldNote>
                            Set this when an item is for someone with a different role than the rest
                            of the request, e.g. one laptop for the Dean among otherwise general
                            office equipment.
                          </FieldNote>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Software or systems it must run</Label>
                          <Input
                            value={item.required_software}
                            onChange={(e) =>
                              patchItem(item.key, { required_software: e.target.value })
                            }
                            placeholder="Student records system, Office, SPSS"
                          />
                        </div>
                        {cat?.assetClass === "Software" && (
                          <div className="space-y-1.5">
                            <Label>
                              Software category
                              <Required />
                            </Label>
                            <Select
                              value={item.software_category}
                              onValueChange={(v) => patchItem(item.key, { software_category: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {softwareCategories.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label>Proposed specification (optional)</Label>
                          <Textarea
                            rows={2}
                            value={item.proposed_spec}
                            onChange={(e) => patchItem(item.key, { proposed_spec: e.target.value })}
                            placeholder="Only if you have a specification in mind. CICT confirms the final specification."
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={item.is_shared}
                            onCheckedChange={(v) => patchItem(item.key, { is_shared: v === true })}
                          />
                          This is a shared resource
                        </label>
                        {recommendations[item.key] && (
                          <p className="rounded-sm border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
                            Indicative tier based on{" "}
                            {onBehalfOfUser ? `${onBehalfOfUser.fullName}'s` : "your"} position
                            level: <strong>{recommendations[item.key]!.tier}</strong> —{" "}
                            {recommendations[item.key]!.name}. CICT confirms the final
                            specification.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" onClick={() => setItems((p) => [...p, emptyItem()])}>
                  Add another item
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <SectionHeading
                  title="Funding & timing"
                  description="Confirm how the request will be funded and when the equipment is needed."
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="by">Required by</Label>
                    <Input
                      id="by"
                      type="date"
                      value={requiredBy}
                      onChange={(e) => setRequiredBy(e.target.value)}
                    />
                    {longestLeadTime > 0 && (
                      <FieldNote>
                        Typical procurement lead time for these items is up to {longestLeadTime}{" "}
                        days after approval.
                      </FieldNote>
                    )}
                  </div>
                </div>
                {priority !== "normal" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="pr">
                      Reason for elevated priority
                      <Required />
                    </Label>
                    <Textarea
                      id="pr"
                      rows={3}
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      placeholder="Examination deadlines, audit finding, safety or continuity risk."
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Budget status</Label>
                  <Select value={budgetStatus} onValueChange={setBudgetStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetStatuses.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fund">Funding source</Label>
                    <Input
                      id="fund"
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value)}
                      placeholder="Departmental vote, grant name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cc">Cost centre</Label>
                    <Input
                      id="cc"
                      value={costCentre}
                      onChange={(e) => setCostCentre(e.target.value)}
                      placeholder="e.g. 4021-ADM"
                    />
                  </div>
                </div>
                <div className="rounded-sm border border-border bg-secondary/30 p-4 text-sm">
                  <p className="label-caps">Indicative value</p>
                  <p className="mt-1 font-display text-2xl">{money(estimatedTotal)}</p>
                  <FieldNote>
                    Calculated from published indicative unit costs. Not a quotation — procurement
                    confirms actual pricing.
                  </FieldNote>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <SectionHeading
                  title="Review & submit"
                  description="Check the submission, nominate the approving manager and accept the declaration."
                />
                <div className="space-y-1.5">
                  <Label>
                    Approving manager
                    <Required />
                  </Label>
                  <Select value={managerId} onValueChange={setManagerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the manager responsible for this need" />
                    </SelectTrigger>
                    <SelectContent>
                      {managerOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName || "Unnamed staff"}
                          {m.jobTitle ? ` — ${m.jobTitle}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldNote>
                    The request goes to this manager first, then to CICT for technical review.
                  </FieldNote>
                </div>

                <dl className="divide-y divide-border rounded-md border border-border text-sm">
                  {[
                    ["Title", title],
                    ["Unit / School", orgUnitName],
                    ["Department", department],
                    [
                      "Designation of intended user",
                      designation === "Other" ? designationOther : designation,
                    ],
                    ["Request type", requestType],
                    ["Business context", businessContext],
                    [
                      "Requested on behalf of",
                      onBehalfOfUser?.fullName || requestedFor || "Myself",
                    ],
                    ["Priority", priority],
                    ["Required by", requiredBy],
                    ["Budget status", budgetStatus],
                    ["Funding source", fundingSource],
                    ["Cost centre", costCentre],
                    ["Indicative value", money(estimatedTotal)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-4 px-4 py-2.5">
                      <dt className="w-48 shrink-0 text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>

                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Item</th>
                        <th className="px-4 py-2.5 font-medium">Qty</th>
                        <th className="px-4 py-2.5 font-medium">Users / location</th>
                        <th className="px-4 py-2.5 font-medium">Indicative tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item) => (
                        <tr key={item.key}>
                          <td className="px-4 py-2.5">
                            {categoryById.get(item.category_id)?.name ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {[
                              item.number_of_users
                                ? `${item.number_of_users} users`
                                : item.intended_users,
                              item.location,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </td>
                          <td className="px-4 py-2.5">{recommendations[item.key]?.tier ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <label className="flex items-start gap-3 rounded-md border border-border bg-secondary/40 p-4 text-sm">
                  <Checkbox
                    checked={declaration}
                    onCheckedChange={(v) => setDeclaration(v === true)}
                    className="mt-0.5"
                  />
                  <span>{setting("declaration_text")}</span>
                </label>
              </div>
            )}

            {issues.length > 0 && (
              <ul className="mt-6 space-y-1 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                {issues.map((issue) => (
                  <li key={issue}>• {issue}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={busy || !title.trim()}
                onClick={() => save(false)}
              >
                Save draft
              </Button>
              {step < STEPS.length - 1 ? (
                <Button disabled={!stepValid || busy} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </Button>
              ) : (
                <Button disabled={!stepValid || busy} onClick={() => save(true)}>
                  Submit for approval
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="surface p-4">
            <p className="label-caps">Submission summary</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Title</dt>
                <dd className="max-w-[60%] truncate text-right font-medium">{title || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Line items</dt>
                <dd className="font-medium">{items.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Total units</dt>
                <dd className="font-medium">{items.reduce((n, i) => n + (i.quantity || 0), 0)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Indicative value</dt>
                <dd className="font-medium">{money(estimatedTotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Priority</dt>
                <dd className="font-medium capitalize">{priority}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Required by</dt>
                <dd className="font-medium">{requiredBy || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
            <p className="label-caps text-foreground">Approval route</p>
            <ol className="mt-2 space-y-1.5">
              <li>1. Head of unit / approving manager</li>
              <li>2. CICT technical review and specification</li>
              <li>3. Approved specification sheet issued</li>
            </ol>
            <p className="mt-3">Questions? Contact {setting("support_email")}.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
