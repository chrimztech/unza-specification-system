import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { DelegationPanel } from "@/components/DelegationPanel";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My staff profile · UNZA CICT" },
      {
        name: "description",
        content:
          "View the staff record synced from the UNZA HR system that drives request routing and specification tiers.",
      },
      { property: "og:title", content: "My staff profile · UNZA CICT" },
      {
        property: "og:description",
        content: "Your UNZA HR staff details as used across the CICT specification workflow.",
      },
    ],
  }),
  component: ProfilePage,
});

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="label-caps">{label}</p>
      <p className="text-sm">
        {value?.trim() ? value : <span className="text-muted-foreground">Not set in HR</span>}
      </p>
    </div>
  );
}

function ProfilePage() {
  const { email, profile, roles } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps">Account</p>
        <h1 className="mt-1 font-display text-3xl">My staff profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These details are maintained in the UNZA HR system and cannot be edited here. Your unit
          and position level determine routing and the indicative specification tier applied to your
          requests. Details refresh automatically the next time you sign in.
        </p>
      </div>

      <div className="space-y-5 surface p-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Institutional email" value={email ?? profile?.email} />
          <Field label="Full name" value={profile?.fullName} />
          <Field label="Staff number" value={profile?.staffNumber} />
          <Field label="Job title" value={profile?.jobTitle} />
          <Field label="Position level" value={profile?.positionLevel} />
          <Field label="Phone / extension" value={profile?.phone} />
          <Field label="Campus" value={profile?.campus} />
          <Field label="Organisational unit" value={profile?.orgUnit?.name} />
        </div>

        <div className="space-y-1.5">
          <p className="label-caps">System roles</p>
          <div className="flex flex-wrap gap-1.5">
            {(roles.length > 0 ? roles : ["requester"]).map((r) => (
              <span
                key={r}
                className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs"
              >
                {r.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Roles are assigned by CICT administrators.
          </p>
        </div>
      </div>

      <DelegationPanel />
    </div>
  );
}
