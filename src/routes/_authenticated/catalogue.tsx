import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { EquipmentCategoryResponse, SpecProfileResponse } from "@/lib/api-types";

export const Route = createFileRoute("/_authenticated/catalogue")({
  head: () => ({
    meta: [
      { title: "Specification catalogue · UNZA CICT" },
      {
        name: "description",
        content:
          "Approved UNZA CICT equipment categories and specification tiers used to assess every equipment request.",
      },
      { property: "og:title", content: "Specification catalogue · UNZA CICT" },
      {
        property: "og:description",
        content:
          "Standard, Enhanced and Specialised equipment specification profiles approved by CICT.",
      },
    ],
  }),
  component: Catalogue,
});

function Catalogue() {
  const categories = useQuery({
    queryKey: ["catalogue-categories"],
    queryFn: () => apiGet<EquipmentCategoryResponse[]>("/api/equipment-categories"),
  });
  const profiles = useQuery({
    queryKey: ["catalogue-spec-profiles"],
    queryFn: () => apiGet<SpecProfileResponse[]>("/api/spec-profiles"),
  });

  const data = useMemo(() => {
    const active = (categories.data ?? [])
      .filter((c) => c.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return active.map((cat) => ({
      ...cat,
      specProfiles: (profiles.data ?? []).filter((p) => p.categoryId === cat.id && p.active),
    }));
  }, [categories.data, profiles.data]);

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps">Reference</p>
        <h1 className="mt-1 font-display text-3xl">Approved specification catalogue</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every request is assessed against these published profiles. CICT applies the tier that
          matches the position level, workload and usage environment recorded on the request.
        </p>
      </div>

      <div className="space-y-6">
        {data.map((cat) => (
          <section key={cat.id} className="surface">
            <header className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg">
                {cat.icon ? <span className="mr-2">{cat.icon}</span> : null}
                {cat.name}
              </h2>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                {cat.assetClass ? (
                  <div>
                    <dt className="label-caps">Asset class</dt>
                    <dd>{cat.assetClass}</dd>
                  </div>
                ) : null}
                {cat.typicalLifespanYears ? (
                  <div>
                    <dt className="label-caps">Replacement cycle</dt>
                    <dd>{cat.typicalLifespanYears} years</dd>
                  </div>
                ) : null}
                {cat.standardWarrantyMonths ? (
                  <div>
                    <dt className="label-caps">Standard warranty</dt>
                    <dd>{cat.standardWarrantyMonths} months</dd>
                  </div>
                ) : null}
                {cat.procurementLeadTimeDays ? (
                  <div>
                    <dt className="label-caps">Lead time</dt>
                    <dd>{cat.procurementLeadTimeDays} days</dd>
                  </div>
                ) : null}
                {cat.indicativeUnitCost ? (
                  <div>
                    <dt className="label-caps">Indicative cost</dt>
                    <dd>ZMW {Number(cat.indicativeUnitCost).toLocaleString()}</dd>
                  </div>
                ) : null}
                {(cat.eligiblePositionLevels ?? []).length > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="label-caps">Eligible position levels</dt>
                    <dd>{(cat.eligiblePositionLevels ?? []).join(", ")}</dd>
                  </div>
                ) : null}
                {cat.policyReference ? (
                  <div>
                    <dt className="label-caps">Policy</dt>
                    <dd>{cat.policyReference}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                {cat.requiresCictReview ? (
                  <span className="rounded-sm bg-muted px-2 py-0.5">CICT review required</span>
                ) : null}
                {cat.requiresNetworkPort ? (
                  <span className="rounded-sm bg-muted px-2 py-0.5">Network port required</span>
                ) : null}
                {cat.requiresSoftwareLicence ? (
                  <span className="rounded-sm bg-muted px-2 py-0.5">Software licence required</span>
                ) : null}
              </div>
              {cat.supportNotes ? (
                <p className="mt-2 text-xs text-muted-foreground">{cat.supportNotes}</p>
              ) : null}
            </header>
            <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
              {cat.specProfiles.length === 0 && (
                <p className="bg-card p-5 text-sm text-muted-foreground">
                  No published profile yet for this category.
                </p>
              )}
              {cat.specProfiles.map((p) => (
                <article key={p.id} className="bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                      {p.tier}
                    </span>
                    <span className="text-xs text-muted-foreground">v{p.version}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                  <dl className="mt-3 space-y-1 text-xs">
                    {Object.entries((p.specs ?? {}) as Record<string, string>).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="min-w-28 font-semibold text-muted-foreground">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {p.suitsPositionLevels?.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Typically for: {p.suitsPositionLevels.join(", ")}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
