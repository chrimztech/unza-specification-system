import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import type { OrgUnitResponse, UserResponse, UserRoleResponse } from "@/lib/api-types";
import { Input } from "@/components/ui/input";
import { QueryError } from "@/components/QueryError";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "Staff directory & units · UNZA CICT" },
      {
        name: "description",
        content:
          "Oversight view of registered staff, their organisational units, position levels and system roles.",
      },
      { property: "og:title", content: "Staff directory & units · UNZA CICT" },
      {
        property: "og:description",
        content:
          "Registered staff, units and assigned roles in the UNZA CICT specification system.",
      },
    ],
  }),
  component: Directory,
});

function Directory() {
  const { isOversight } = useAuth();
  const [search, setSearch] = useState("");

  const staff = useQuery({
    queryKey: ["directory-staff"],
    queryFn: () => apiGet<UserResponse[]>("/api/users"),
  });

  const roles = useQuery({
    queryKey: ["directory-roles"],
    queryFn: () => apiGet<UserRoleResponse[]>("/api/users/roles"),
  });

  const units = useQuery({
    queryKey: ["directory-units"],
    queryFn: () => apiGet<OrgUnitResponse[]>("/api/org-units"),
  });

  const activeUnits = useMemo(() => (units.data ?? []).filter((u) => u.active), [units.data]);

  const roleMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const r of roles.data ?? []) {
      (map[r.userId] ??= []).push(r.role);
    }
    return map;
  }, [roles.data]);

  const rows = (staff.data ?? [])
    .filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${s.fullName} ${s.email} ${s.jobTitle ?? ""} ${s.orgUnit?.name ?? ""}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  if (!isOversight) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl">Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The staff directory is available to CICT, procurement and audit roles only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps">Oversight</p>
        <h1 className="mt-1 font-display text-3xl">Staff directory & units</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Registered staff accounts, their organisational unit and the roles assigned to them. Role
          assignment is managed by CICT administrators in the backend.
        </p>
      </div>

      {(staff.isError || roles.isError || units.isError) && (
        <QueryError
          message="Could not load the staff directory."
          onRetry={() => {
            staff.refetch();
            roles.refetch();
            units.refetch();
          }}
        />
      )}

      <Input
        className="max-w-sm"
        placeholder="Search name, email, title or unit"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-hidden surface">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Title</th>
              <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">Position level</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Unit</th>
              <th className="px-4 py-2.5 font-semibold">Roles</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.fullName || "Unnamed staff"}</div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {s.jobTitle || "—"}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {s.positionLevel || "—"}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {s.orgUnit?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(roleMap[s.id] ?? ["requester"]).map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs"
                      >
                        {r.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {staff.isLoading ? "Loading directory…" : "No staff match this search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Organisational units</h2>
        {activeUnits.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No organisational units have been added yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeUnits.map((u) => (
              <div key={u.id} className="surface p-4">
                <div className="text-sm font-medium">{u.name}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {u.unitType}
                  {u.campus ? ` · ${u.campus}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
