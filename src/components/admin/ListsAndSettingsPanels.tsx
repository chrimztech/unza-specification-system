import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiPost, apiPut, ApiError } from "@/lib/api-client";
import type { LookupValueResponse } from "@/lib/api-types";
import { useLookupLists, useSettings } from "@/hooks/useLookups";
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

const LISTS: { key: string; label: string; help: string }[] = [
  {
    key: "role",
    label: "System roles",
    help: "Rename or hide system roles. The value must stay one of: requester, manager, cict_reviewer, cict_manager, procurement, auditor, admin.",
  },
  { key: "position_level", label: "Position levels", help: "Staff levels used for eligibility and specification recommendations." },
  { key: "request_type", label: "Request types", help: "Reasons a request may be raised." },
  { key: "business_context", label: "Business contexts", help: "The University activity the equipment supports." },
  { key: "priority", label: "Priorities", help: "Urgency options on a request." },
  { key: "budget_status", label: "Budget statuses", help: "Funding position declared by the requester." },
  { key: "spec_tier", label: "Specification tiers", help: "Tiers used by specification profiles." },
  { key: "asset_class", label: "Asset classes", help: "Classification applied to equipment categories." },
  { key: "campus", label: "Campuses", help: "Campus options on staff profiles and units." },
];

export function ListsPanel() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useLookupLists(true);
  const [listKey, setListKey] = useState(LISTS[0]!.key);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ value: "", label: "", sort_order: "0" });
  const [busy, setBusy] = useState(false);

  const active = LISTS.find((l) => l.key === listKey)!;
  const rows = data.filter((r) => r.listKey === listKey);

  function reset() {
    setEditingId(null);
    setDraft({ value: "", label: "", sort_order: String(rows.length + 1) });
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["lookup-values"] });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.value.trim();
    const label = draft.label.trim() || value;
    if (!value) {
      toast.error("Give the entry a value.");
      return;
    }
    setBusy(true);
    const payload = {
      listKey,
      value,
      label,
      sortOrder: Number(draft.sort_order) || 0,
    };
    try {
      if (editingId) await apiPut(`/api/lookup-values/${editingId}`, payload);
      else await apiPost("/api/lookup-values", payload);
      toast.success(editingId ? "Entry updated" : "Entry added");
      reset();
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the entry.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: LookupValueResponse) {
    try {
      await apiPut(`/api/lookup-values/${row.id}`, {
        listKey: row.listKey,
        value: row.value,
        label: row.label,
        sortOrder: row.sortOrder,
        active: !row.active,
      });
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the entry.");
    }
  }

  async function remove(row: LookupValueResponse) {
    const warning =
      row.listKey === "role"
        ? `Delete the "${row.value}" role entry? This can break role assignment for that role across the whole system — "Hide" is almost always the safer choice. This cannot be undone.`
        : `Delete "${row.value}"? This cannot be undone.`;
    if (!confirm(warning)) return;
    try {
      await apiDelete(`/api/lookup-values/${row.id}`);
      toast.success("Entry removed");
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove the entry.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:max-w-sm">
        <div className="space-y-1.5">
          <Label>List</Label>
          <Select
            value={listKey}
            onValueChange={(v) => {
              setListKey(v);
              setEditingId(null);
              setDraft({ value: "", label: "", sort_order: "0" });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LISTS.map((l) => (
                <SelectItem key={l.key} value={l.key}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{active.help}</p>
      </div>

      <form onSubmit={save} className="grid gap-4 border border-border p-5 sm:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="lv-value">Stored value</Label>
          <Input
            id="lv-value"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="lv-label">Display label</Label>
          <Input
            id="lv-label"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lv-order">Order</Label>
          <Input
            id="lv-order"
            type="number"
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
          />
        </div>
        <div className="flex gap-3 sm:col-span-4">
          <Button type="submit" disabled={busy}>
            {editingId ? "Save entry" : "Add entry"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={reset}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading list…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">This list is empty.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{r.label}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.value}</td>
                  <td className="px-3 py-2">{r.sortOrder}</td>
                  <td className="px-3 py-2">{r.active ? "Active" : "Hidden"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(r.id);
                          setDraft({
                            value: r.value,
                            label: r.label,
                            sort_order: String(r.sortOrder),
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(r)}>
                        {r.active ? "Hide" : "Show"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r)}>
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

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const { rows, isLoading } = useSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function saveOne(key: string, value: string) {
    setBusy(true);
    try {
      await apiPut(`/api/settings/${key}`, { value });
      toast.success("Setting saved");
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the setting.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

  return (
    <section className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Wording, contact details and service standards used across the system.
      </p>
      {rows.map((row) => {
        const current = values[row.key] ?? row.value;
        const long = row.value.length > 80;
        return (
          <div key={row.key} className="space-y-2 border border-border p-5">
            <Label htmlFor={`set-${row.key}`} className="capitalize">
              {row.key.replace(/_/g, " ")}
            </Label>
            {row.description ? (
              <p className="text-xs text-muted-foreground">{row.description}</p>
            ) : null}
            {long ? (
              <Textarea
                id={`set-${row.key}`}
                rows={4}
                value={current}
                onChange={(e) => setValues({ ...values, [row.key]: e.target.value })}
              />
            ) : (
              <Input
                id={`set-${row.key}`}
                value={current}
                onChange={(e) => setValues({ ...values, [row.key]: e.target.value })}
              />
            )}
            <Button size="sm" disabled={busy} onClick={() => saveOne(row.key, current)}>
              Save
            </Button>
          </div>
        );
      })}
    </section>
  );
}
