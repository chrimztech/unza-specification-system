import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api-client";
import type { EquipmentCategoryResponse, SpecProfileResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { useLookup } from "@/hooks/useLookups";
import { QueryError } from "@/components/QueryError";
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

export const Route = createFileRoute("/_authenticated/standards")({
  head: () => ({
    meta: [
      { title: "Specification standards · UNZA CICT" },
      {
        name: "description",
        content:
          "CICT maintenance of approved equipment specification profiles, tiers and the position levels each profile suits.",
      },
      { property: "og:title", content: "Specification standards · UNZA CICT" },
      {
        property: "og:description",
        content: "Maintain the approved CICT equipment specification profiles.",
      },
    ],
  }),
  component: StandardsPage,
});

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
    const value = line.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

function StandardsPage() {
  const { isCict } = useAuth();
  const tiers = useLookup("spec_tier");
  const positionLevels = useLookup("position_level");
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    category_id: "",
    tier: "Standard",
    name: "",
    summary: "",
    specsText: "",
    levels: [] as string[],
  });

  const categories = useQuery({
    queryKey: ["equipment-categories"],
    queryFn: () => apiGet<EquipmentCategoryResponse[]>("/api/equipment-categories"),
  });
  const activeCategories = useMemo(
    () => (categories.data ?? []).filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories.data],
  );

  const profiles = useQuery({
    queryKey: ["spec-profiles-admin"],
    queryFn: () => apiGet<SpecProfileResponse[]>("/api/spec-profiles"),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, SpecProfileResponse[]>();
    for (const p of profiles.data ?? []) {
      const key = p.categoryName ?? "Uncategorised";
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [profiles.data]);

  function resetDraft() {
    setEditingId(null);
    setDraft({ category_id: "", tier: "Standard", name: "", summary: "", specsText: "", levels: [] });
  }

  function startEdit(p: SpecProfileResponse) {
    setEditingId(p.id);
    setDraft({
      category_id: p.categoryId ?? "",
      tier: p.tier ?? "standard",
      name: p.name ?? "",
      summary: p.summary ?? "",
      specsText: specsToText(p.specs),
      levels: (p.suitsPositionLevels ?? []).slice(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.category_id || !draft.name.trim()) {
      toast.error("Choose a category and give the profile a name.");
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
      resetDraft();
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
      queryClient.invalidateQueries({ queryKey: ["spec-profiles-admin"] });
      queryClient.invalidateQueries({ queryKey: ["spec-profiles"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the profile.");
    }
  }

  if (!isCict) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl">Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only CICT reviewers and administrators can maintain specification standards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps">CICT standards</p>
        <h1 className="mt-1 font-display text-3xl">Specification profiles</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          These approved profiles drive the tier recommended on new requests and the technical detail
          printed on approved specification sheets.
        </p>
      </div>

      {(categories.isError || profiles.isError) && (
        <QueryError
          message="Could not load categories or specification profiles."
          onRetry={() => {
            categories.refetch();
            profiles.refetch();
          }}
        />
      )}

      <form onSubmit={save} className="space-y-5 rounded-md border border-border bg-card p-6 shadow-panel">
        <h2 className="font-display text-xl">{editingId ? "Edit profile" : "Add a profile"}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
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
                {activeCategories.map((c) => (
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
          <Label htmlFor="pname">Profile name</Label>
          <Input
            id="pname"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Standard administrative desktop"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="psum">Summary</Label>
          <Input
            id="psum"
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            placeholder="Suitable for office productivity and University systems"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pspecs">Technical specification (one “Item: value” per line)</Label>
          <Textarea
            id="pspecs"
            rows={6}
            value={draft.specsText}
            onChange={(e) => setDraft({ ...draft, specsText: e.target.value })}
            placeholder={"Processor: Intel Core i5 (current generation)\nMemory: 16 GB\nStorage: 512 GB SSD"}
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
            <Button type="button" variant="outline" onClick={resetDraft}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-6">
        {grouped.map(([category, list]) => (
          <section key={category} className="space-y-3">
            <h2 className="font-display text-xl">{category}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(list ?? []).map((p) => (
                <article
                  key={p.id}
                  className={`rounded-md border border-border bg-card p-5 shadow-panel ${
                    p.active ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="label-caps">{p.tier}</p>
                      <h3 className="font-display text-lg">{p.name}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">v{p.version}</span>
                  </div>
                  {p.summary ? (
                    <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                  ) : null}
                  <dl className="mt-3 space-y-1 text-sm">
                    {Object.entries((p.specs ?? {}) as Record<string, unknown>).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="min-w-32 text-muted-foreground">{k}</dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                      {p.active ? "Retire" : "Reinstate"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
