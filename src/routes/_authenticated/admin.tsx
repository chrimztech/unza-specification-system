import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck, Trash2 } from "lucide-react";
import { apiGet, apiPatch, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api-client";
import type {
  AuditLogResponse,
  EquipmentCategoryResponse,
  OrgUnitResponse,
  RequestEventResponse,
  RequestResponse,
  SpecProfileResponse,
  UserResponse,
  UserRoleResponse,
} from "@/lib/api-types";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { ListsPanel, SettingsPanel } from "@/components/admin/ListsAndSettingsPanels";
import { useLookup } from "@/hooks/useLookups";
import { QueryError } from "@/components/QueryError";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration · UNZA CICT" },
      {
        name: "description",
        content:
          "Assign workflow roles, maintain organisational units and equipment categories, and provision UNZA staff accounts.",
      },
      { property: "og:title", content: "Administration · UNZA CICT" },
      {
        property: "og:description",
        content: "System administration for the UNZA CICT specification and request system.",
      },
    ],
  }),
  component: AdminPage,
});

const UNIT_TYPES = ["school", "directorate", "department", "unit", "centre"];

function AdminPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Administration is restricted to system administrators.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <p className="label-caps">Administration</p>
        <h1 className="mt-1 font-display text-3xl">System administration</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Maintain the workflow roles, the institutional structure and the equipment categories that
          the specification catalogue is built on.
        </p>
      </header>

      <Tabs defaultValue="roles">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="roles">Staff roles</TabsTrigger>
          <TabsTrigger value="units">Organisational units</TabsTrigger>
          <TabsTrigger value="categories">Equipment categories</TabsTrigger>
          <TabsTrigger value="accounts">Staff accounts</TabsTrigger>
          <TabsTrigger value="profiles">Specification profiles</TabsTrigger>
          <TabsTrigger value="lists">Lists</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="mt-6">
          <RolesPanel />
        </TabsContent>
        <TabsContent value="units" className="mt-6">
          <UnitsPanel />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesPanel />
        </TabsContent>
        <TabsContent value="accounts" className="mt-6">
          <AccountsPanel />
        </TabsContent>
        <TabsContent value="profiles" className="mt-6">
          <SpecProfilesPanel />
        </TabsContent>
        <TabsContent value="lists" className="mt-6">
          <ListsPanel />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function specsToText(specs: unknown) {
  if (!specs || typeof specs !== "object") return "";
  return Object.entries(specs as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
}

function textToSpecs(text: string) {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    if (key) out[key] = line.slice(idx + 1).trim();
  }
  return out;
}

const EMPTY_PROFILE = {
  category_id: "",
  tier: "Standard",
  name: "",
  summary: "",
  specsText: "",
  levels: [] as string[],
};

function SpecProfilesPanel() {
  const queryClient = useQueryClient();
  const tiers = useLookup("spec_tier");
  const positionLevels = useLookup("position_level");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY_PROFILE });

  const categories = useQuery({
    queryKey: ["admin-categories-simple"],
    queryFn: () => apiGet<EquipmentCategoryResponse[]>("/api/equipment-categories"),
  });

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-spec-profiles"],
    queryFn: () => apiGet<SpecProfileResponse[]>("/api/spec-profiles"),
  });

  function reset() {
    setEditingId(null);
    setDraft({ ...EMPTY_PROFILE });
  }

  function startEdit(p: SpecProfileResponse) {
    setEditingId(p.id);
    setDraft({
      category_id: p.categoryId ?? "",
      tier: p.tier ?? "Standard",
      name: p.name ?? "",
      summary: p.summary ?? "",
      specsText: specsToText(p.specs),
      levels: (p.suitsPositionLevels ?? []).slice(),
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.category_id || !draft.name.trim()) {
      toast.error("Choose a category and name the profile.");
      return;
    }
    setBusy(true);
    const payload = {
      categoryId: draft.category_id,
      tier: draft.tier,
      name: draft.name.trim(),
      summary: draft.summary.trim() || null,
      specs: textToSpecs(draft.specsText),
      suitsPositionLevels: draft.levels,
    };
    try {
      if (editingId) await apiPut(`/api/spec-profiles/${editingId}`, payload);
      else await apiPost("/api/spec-profiles", payload);
      toast.success(editingId ? "Profile updated" : "Profile added");
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-spec-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["spec-profiles-admin"] });
      queryClient.invalidateQueries({ queryKey: ["spec-profiles"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the profile.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(p: SpecProfileResponse) {
    try {
      await apiPut(`/api/spec-profiles/${p.id}`, {
        categoryId: p.categoryId,
        tier: p.tier,
        name: p.name,
        summary: p.summary,
        specs: p.specs,
        suitsPositionLevels: p.suitsPositionLevels,
        version: p.version,
        active: !p.active,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-spec-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["spec-profiles"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the profile.");
    }
  }

  async function removeProfile(p: SpecProfileResponse) {
    if (
      !confirm(
        `Permanently delete the "${p.name}" profile? Retire it instead if requests may still refer to it.`,
      )
    ) {
      return;
    }
    try {
      await apiDelete(`/api/spec-profiles/${p.id}`);
      toast.success("Profile deleted");
      if (editingId === p.id) reset();
      queryClient.invalidateQueries({ queryKey: ["admin-spec-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["spec-profiles"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete the profile.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Approved technical baselines used to recommend equipment specifications.
        </p>
        <Link to="/standards" className="text-sm font-medium underline underline-offset-4">
          Standards workspace
        </Link>
      </div>

      {isError && (
        <QueryError message="Could not load specification profiles." onRetry={() => refetch()} />
      )}

      <form onSubmit={save} className="space-y-4 border border-border p-5">
        <h3 className="font-display text-lg">{editingId ? "Edit profile" : "Add a profile"}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Equipment category</Label>
            <Select
              value={draft.category_id}
              onValueChange={(v) => setDraft({ ...draft, category_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tier</Label>
            <Select value={draft.tier} onValueChange={(v) => setDraft({ ...draft, tier: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-name">Profile name</Label>
          <Input
            id="sp-name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-sum">Summary</Label>
          <Input
            id="sp-sum"
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-specs">Technical specification (one “Item: value” per line)</Label>
          <Textarea
            id="sp-specs"
            rows={5}
            value={draft.specsText}
            onChange={(e) => setDraft({ ...draft, specsText: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Suits position levels</Label>
          <div className="flex flex-wrap gap-2">
            {positionLevels.map(({ value: level }) => {
              const active = draft.levels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      levels: active
                        ? draft.levels.filter((l) => l !== level)
                        : [...draft.levels, level],
                    })
                  }
                  className={`rounded-sm border px-3 py-1 text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {editingId ? "Save changes" : "Add profile"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profiles…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No specification profiles defined yet.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Profile</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Suits levels</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.categoryName ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{p.tier}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {(p.suitsPositionLevels ?? []).join(", ") || "Any"}
                  </td>
                  <td className="px-3 py-2">{p.active ? "Active" : "Retired"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                        {p.active ? "Retire" : "Reinstate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeProfile(p)}
                      >
                        Delete
                      </Button>
                    </div>
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

function initials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || email || "?";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "?";
  const last = parts[parts.length - 1] ?? first;
  if (parts.length <= 1) return first.slice(0, 2).toUpperCase();
  return (first[0]! + last[0]!).toUpperCase();
}

function RolesPanel() {
  const roleOptions = useLookup("role");
  const ROLES = roleOptions.map((r) => ({ value: r.value as AppRole, label: r.label }));
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const staff = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => apiGet<UserResponse[]>("/api/users"),
  });

  const assignments = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => apiGet<UserRoleResponse[]>("/api/users/roles"),
  });

  async function toggleRole(targetId: string, role: AppRole, assignedId?: string) {
    setBusy(`${targetId}:${role}`);
    try {
      if (assignedId) {
        if (targetId === userId && role === "admin") {
          toast.error("You cannot remove your own administrator role.");
          return;
        }
        await apiDelete(`/api/users/roles/${assignedId}`);
        toast.success("Role removed");
      } else {
        await apiPost("/api/users/roles", { userId: targetId, role });
        toast.success("Role assigned");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update role");
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(target: UserResponse) {
    if (target.id === userId) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (
      !confirm(
        `Permanently delete ${target.fullName || target.email}? This also deletes every request they raised or submitted, and cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(`${target.id}:delete`);
    try {
      await apiDelete(`/api/users/${target.id}`);
      toast.success(`${target.fullName || target.email} was deleted`);
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete this user");
    } finally {
      setBusy(null);
    }
  }

  const term = search.trim().toLowerCase();
  const rows = (staff.data ?? []).filter(
    (p) =>
      !term ||
      (p.fullName ?? "").toLowerCase().includes(term) ||
      (p.email ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="space-y-4">
      {(staff.isError || assignments.isError) && (
        <QueryError
          message="Could not load staff roles."
          onRetry={() => {
            staff.refetch();
            assignments.refetch();
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Roles &amp; permissions
          </h2>
          <p className="text-xs text-muted-foreground">
            Toggle a role to grant or revoke it. Changes apply immediately.
          </p>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff by name or email"
          className="max-w-xs"
        />
      </div>

      {staff.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading staff…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 font-medium">
                  Staff member
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r.value}
                    className="px-2 py-3 text-center text-xs font-medium text-muted-foreground"
                  >
                    {r.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => {
                const roleCount = (assignments.data ?? []).filter((a) => a.userId === p.id).length;
                return (
                  <tr key={p.id} className="transition-colors hover:bg-secondary/30">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(p.fullName, p.email)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{p.fullName || "Unnamed"}</span>
                            {roleCount > 0 && (
                              <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                {roleCount} role{roleCount === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {p.email}
                            {p.jobTitle ? ` · ${p.jobTitle}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    {ROLES.map((role) => {
                      const assigned = (assignments.data ?? []).find(
                        (a) => a.userId === p.id && a.role === role.value,
                      );
                      return (
                        <td key={role.value} className="px-2 py-3 text-center">
                          <button
                            type="button"
                            title={`${assigned ? "Remove" : "Assign"} ${role.label}`}
                            aria-label={`${assigned ? "Remove" : "Assign"} ${role.label} for ${p.fullName || p.email}`}
                            disabled={busy === `${p.id}:${role.value}`}
                            onClick={() => toggleRole(p.id, role.value, assigned?.id)}
                            className={`inline-flex size-7 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                              assigned
                                ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                : "border-border text-transparent hover:border-primary/40 hover:bg-secondary"
                            }`}
                          >
                            <Check className="size-3.5" />
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        title={
                          p.id === userId
                            ? "You cannot delete your own account"
                            : "Delete this user"
                        }
                        aria-label={`Delete ${p.fullName || p.email}`}
                        disabled={busy === `${p.id}:delete` || p.id === userId}
                        onClick={() => deleteUser(p)}
                        className="inline-flex size-7 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={ROLES.length + 2}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No staff accounts match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UnitsPanel() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unitType, setUnitType] = useState("department");
  const [campus, setCampus] = useState("");
  const [editing, setEditing] = useState<OrgUnitResponse | null>(null);

  const units = useQuery({
    queryKey: ["admin-units"],
    queryFn: () => apiGet<OrgUnitResponse[]>("/api/org-units"),
  });

  function resetForm() {
    setEditing(null);
    setCode("");
    setName("");
    setUnitType("department");
    setCampus("");
  }

  function startEdit(u: OrgUnitResponse) {
    setEditing(u);
    setCode(u.code);
    setName(u.name);
    setUnitType(u.unitType ?? "department");
    setCampus(u.campus ?? "");
  }

  async function saveUnit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      unitType,
      campus: campus.trim() || undefined,
    };
    try {
      if (editing) {
        await apiPut(`/api/org-units/${editing.id}`, {
          ...payload,
          parentId: editing.parentId ?? undefined,
          active: editing.active,
        });
        toast.success("Organisational unit updated");
      } else {
        await apiPost("/api/org-units", payload);
        toast.success("Organisational unit added");
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-units"] });
      queryClient.invalidateQueries({ queryKey: ["org-units"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the unit.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await apiPatch(`/api/org-units/${id}/active?active=${!isActive}`);
      queryClient.invalidateQueries({ queryKey: ["admin-units"] });
      queryClient.invalidateQueries({ queryKey: ["org-units"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the unit.");
    }
  }

  return (
    <div className="space-y-4">
      {units.isError && (
        <QueryError
          message="Could not load organisational units."
          onRetry={() => units.refetch()}
        />
      )}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <form onSubmit={saveUnit} className="space-y-4 surface p-5">
          <h2 className="font-display text-lg">{editing ? "Edit unit" : "Add a unit"}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="unit-code">Code</Label>
            <Input
              id="unit-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. SOE"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">Name</Label>
            <Input
              id="unit-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. School of Engineering"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={unitType} onValueChange={setUnitType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-campus">Campus</Label>
            <Input
              id="unit-campus"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="e.g. Great East Road"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {editing ? "Save changes" : "Add unit"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" className="w-full" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </form>

        <div className="overflow-x-auto surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Campus</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(units.data ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.code}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.unitType}</td>
                  <td className="px-4 py-3">{u.campus ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(u)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={u.active ? "outline" : "default"}
                        onClick={() => toggleActive(u.id, u.active)}
                      >
                        {u.active ? "Retire" : "Restore"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type CategoryForm = {
  code: string;
  name: string;
  description: string;
  icon: string;
  asset_class: string;
  typical_lifespan_years: string;
  standard_warranty_months: string;
  indicative_unit_cost: string;
  procurement_lead_time_days: string;
  requires_cict_review: boolean;
  requires_network_port: boolean;
  requires_software_licence: boolean;
  eligible_position_levels: string[];
  support_notes: string;
  policy_reference: string;
};

const EMPTY_CATEGORY: CategoryForm = {
  code: "",
  name: "",
  description: "",
  icon: "",
  asset_class: "",
  typical_lifespan_years: "",
  standard_warranty_months: "",
  indicative_unit_cost: "",
  procurement_lead_time_days: "",
  requires_cict_review: true,
  requires_network_port: false,
  requires_software_licence: false,
  eligible_position_levels: [],
  support_notes: "",
  policy_reference: "",
};

function CategoriesPanel() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const assetClasses = useLookup("asset_class");
  const catPositionLevels = useLookup("position_level");

  function set<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet<EquipmentCategoryResponse[]>("/api/equipment-categories"),
  });

  function num(v: string) {
    const n = Number(v);
    return v.trim() === "" || Number.isNaN(n) ? null : n;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      code: form.code.trim().toLowerCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      assetClass: form.asset_class || null,
      typicalLifespanYears: num(form.typical_lifespan_years),
      standardWarrantyMonths: num(form.standard_warranty_months),
      indicativeUnitCost: num(form.indicative_unit_cost),
      procurementLeadTimeDays: num(form.procurement_lead_time_days),
      requiresCictReview: form.requires_cict_review,
      requiresNetworkPort: form.requires_network_port,
      requiresSoftwareLicence: form.requires_software_licence,
      eligiblePositionLevels: form.eligible_position_levels,
      supportNotes: form.support_notes.trim() || null,
      policyReference: form.policy_reference.trim() || null,
    };
    try {
      if (editingId) {
        await apiPut(`/api/equipment-categories/${editingId}`, payload);
      } else {
        await apiPost("/api/equipment-categories", {
          ...payload,
          sortOrder: (categories.data ?? []).length + 1,
        });
      }
      toast.success(editingId ? "Category updated" : "Equipment category added");
      setForm(EMPTY_CATEGORY);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the category.");
    } finally {
      setBusy(false);
    }
  }

  function edit(c: EquipmentCategoryResponse) {
    setEditingId(c.id);
    setForm({
      code: c.code ?? "",
      name: c.name ?? "",
      description: c.description ?? "",
      icon: c.icon ?? "",
      asset_class: c.assetClass ?? "",
      typical_lifespan_years: c.typicalLifespanYears?.toString() ?? "",
      standard_warranty_months: c.standardWarrantyMonths?.toString() ?? "",
      indicative_unit_cost: c.indicativeUnitCost?.toString() ?? "",
      procurement_lead_time_days: c.procurementLeadTimeDays?.toString() ?? "",
      requires_cict_review: c.requiresCictReview ?? true,
      requires_network_port: c.requiresNetworkPort ?? false,
      requires_software_licence: c.requiresSoftwareLicence ?? false,
      eligible_position_levels: c.eligiblePositionLevels ?? [],
      support_notes: c.supportNotes ?? "",
      policy_reference: c.policyReference ?? "",
    });
  }

  async function toggleActive(c: EquipmentCategoryResponse) {
    try {
      await apiPut(`/api/equipment-categories/${c.id}`, {
        code: c.code,
        name: c.name,
        description: c.description,
        icon: c.icon,
        assetClass: c.assetClass,
        typicalLifespanYears: c.typicalLifespanYears,
        standardWarrantyMonths: c.standardWarrantyMonths,
        indicativeUnitCost: c.indicativeUnitCost,
        procurementLeadTimeDays: c.procurementLeadTimeDays,
        requiresCictReview: c.requiresCictReview,
        requiresNetworkPort: c.requiresNetworkPort,
        requiresSoftwareLicence: c.requiresSoftwareLicence,
        eligiblePositionLevels: c.eligiblePositionLevels,
        supportNotes: c.supportNotes,
        policyReference: c.policyReference,
        sortOrder: c.sortOrder,
        active: !c.active,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the category.");
    }
  }

  async function removeCategory(c: EquipmentCategoryResponse) {
    if (
      !confirm(
        `Permanently delete the "${c.name}" category? Retire it instead if requests or profiles still use it.`,
      )
    ) {
      return;
    }
    try {
      await apiDelete(`/api/equipment-categories/${c.id}`);
      toast.success("Category deleted");
      if (editingId === c.id) {
        setEditingId(null);
        setForm(EMPTY_CATEGORY);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete the category.");
    }
  }

  return (
    <div className="space-y-4">
      {categories.isError && (
        <QueryError
          message="Could not load equipment categories."
          onRetry={() => categories.refetch()}
        />
      )}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="space-y-4 surface p-5">
          <h2 className="font-display text-lg">{editingId ? "Edit category" : "Add a category"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-code">Code</Label>
              <Input
                id="cat-code"
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="e.g. tablet"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-icon">Icon (emoji)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="e.g. 💻"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Tablet device"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Asset class</Label>
            <Select value={form.asset_class} onValueChange={(v) => set("asset_class", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset class" />
              </SelectTrigger>
              <SelectContent>
                {assetClasses.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What this category covers"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-life">Lifespan (years)</Label>
              <Input
                id="cat-life"
                inputMode="numeric"
                value={form.typical_lifespan_years}
                onChange={(e) => set("typical_lifespan_years", e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-warranty">Warranty (months)</Label>
              <Input
                id="cat-warranty"
                inputMode="numeric"
                value={form.standard_warranty_months}
                onChange={(e) => set("standard_warranty_months", e.target.value)}
                placeholder="36"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-cost">Indicative cost (ZMW)</Label>
              <Input
                id="cat-cost"
                inputMode="decimal"
                value={form.indicative_unit_cost}
                onChange={(e) => set("indicative_unit_cost", e.target.value)}
                placeholder="18000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-lead">Lead time (days)</Label>
              <Input
                id="cat-lead"
                inputMode="numeric"
                value={form.procurement_lead_time_days}
                onChange={(e) => set("procurement_lead_time_days", e.target.value)}
                placeholder="45"
              />
            </div>
          </div>

          <fieldset className="space-y-2 rounded-sm border border-border p-3">
            <legend className="label-caps px-1">Requirements</legend>
            {(
              [
                ["requires_cict_review", "Requires CICT technical review"],
                ["requires_network_port", "Requires a network port"],
                ["requires_software_licence", "Requires a software licence"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-primary)]"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-2 rounded-sm border border-border p-3">
            <legend className="label-caps px-1">Eligible position levels</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {catPositionLevels.map(({ value: lvl }) => {
                const checked = form.eligible_position_levels.includes(lvl);
                return (
                  <label key={lvl} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-[var(--color-primary)]"
                      checked={checked}
                      onChange={(e) =>
                        set(
                          "eligible_position_levels",
                          e.target.checked
                            ? [...form.eligible_position_levels, lvl]
                            : form.eligible_position_levels.filter((l) => l !== lvl),
                        )
                      }
                    />
                    {lvl}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="cat-support">Support notes</Label>
            <Textarea
              id="cat-support"
              rows={2}
              value={form.support_notes}
              onChange={(e) => set("support_notes", e.target.value)}
              placeholder="Servicing, imaging or support arrangements"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-policy">Policy reference</Label>
            <Input
              id="cat-policy"
              value={form.policy_reference}
              onChange={(e) => set("policy_reference", e.target.value)}
              placeholder="e.g. UNZA CICT Policy 4.2"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="flex-1">
              {editingId ? "Save changes" : "Add category"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_CATEGORY);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        <div className="overflow-x-auto surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Lifecycle</th>
                <th className="px-4 py-3 font-medium">Requirements</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(categories.data ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {c.icon ? <span className="mr-1.5">{c.icon}</span> : null}
                      {c.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.code}</div>
                    {c.description ? (
                      <div className="mt-1 max-w-xs text-xs text-muted-foreground">
                        {c.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.assetClass ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{c.typicalLifespanYears ? `${c.typicalLifespanYears} yr life` : "—"}</div>
                    <div>
                      {c.standardWarrantyMonths ? `${c.standardWarrantyMonths} mo warranty` : ""}
                    </div>
                    <div>
                      {c.procurementLeadTimeDays ? `${c.procurementLeadTimeDays} d lead time` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                      {c.requiresCictReview ? (
                        <span className="rounded-sm bg-muted px-1.5 py-0.5">CICT review</span>
                      ) : null}
                      {c.requiresNetworkPort ? (
                        <span className="rounded-sm bg-muted px-1.5 py-0.5">Network port</span>
                      ) : null}
                      {c.requiresSoftwareLicence ? (
                        <span className="rounded-sm bg-muted px-1.5 py-0.5">Licence</span>
                      ) : null}
                    </div>
                    {(c.eligiblePositionLevels ?? []).length > 0 ? (
                      <div className="mt-1">
                        Eligible: {(c.eligiblePositionLevels ?? []).join(", ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => edit(c)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={c.active ? "outline" : "default"}
                        onClick={() => toggleActive(c)}
                      >
                        {c.active ? "Retire" : "Restore"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeCategory(c)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountsPanel() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiPost("/api/users/staff-accounts", {
        email,
        fullName,
        staffNumber: staffNumber || undefined,
        jobTitle: jobTitle || undefined,
      });
      toast.success("Staff record saved");
      setEmail("");
      setFullName("");
      setStaffNumber("");
      setJobTitle("");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["directory"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "The account could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4 surface p-6">
      <div>
        <h2 className="font-display text-lg">Provision a staff account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff normally arrive from the UNZA HR system on first sign-in. Use this form to pre-seed
          a record manually — for example for a new appointment not yet on the HR register —
          including a matching staff number where possible. The record activates once the person
          signs in with their UNZA HR credentials. Submitting an email that already has a record
          updates that person's name and title instead of creating a second account.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="acc-email">Institutional email</Label>
          <Input
            id="acc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@unza.zm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-name">Full name</Label>
          <Input
            id="acc-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-staff">Staff number</Label>
            <Input
              id="acc-staff"
              value={staffNumber}
              onChange={(e) => setStaffNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-title">Job title</Label>
            <Input id="acc-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={busy}>
          Create account
        </Button>
      </form>
    </div>
  );
}
