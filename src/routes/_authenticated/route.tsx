import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasValidSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!hasValidSession()) throw redirect({ to: "/auth" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
