import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearToken } from "@/lib/session";
import { useAuth } from "@/hooks/useAuth";
import { useLookup, useSettings } from "@/hooks/useLookups";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/NotificationsBell";


const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/requests", label: "Requests" },
  { to: "/requests/new", label: "New request" },
  { to: "/catalogue", label: "Catalogue" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { displayName, roles, profile, isCict, isOversight, hasRole } = useAuth();
  const { setting } = useSettings();
  const roleOptions = useLookup("role");
  const roleLabel = (r: string) => roleOptions.find((o) => o.value === r)?.label ?? r;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("") || "UZ";

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = [
    ...NAV,
    ...(hasRole("manager") ? [{ to: "/approvals", label: "Approvals" } as const] : []),
    ...(isCict ? [{ to: "/reviews", label: "Reviews" } as const] : []),
    ...(isCict ? [{ to: "/standards", label: "Standards" } as const] : []),
    ...(isOversight
      ? ([{ to: "/reports", label: "Reports" }, { to: "/directory", label: "Directory" }] as const)
      : []),
    ...(hasRole("procurement") ? [{ to: "/procurement", label: "Procurement" } as const] : []),
    ...(hasRole("stores") ? [{ to: "/stores", label: "Stores" } as const] : []),
    ...(hasRole("cict_support") ? [{ to: "/verification", label: "Verification" } as const] : []),
    ...(hasRole("auditor") ? [{ to: "/audit", label: "Audit" } as const] : []),
    ...(hasRole("admin") ? [{ to: "/admin", label: "Admin" } as const] : []),
  ];



  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearToken();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="crest-header crest-header-motif sticky top-0 z-40 text-primary-foreground shadow-lift">
        <div className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <img
              src="/logo.png"
              alt="University of Zambia"
              className="size-10 rounded-md object-contain shadow-panel ring-1 ring-primary-foreground/25 transition-transform duration-200 group-hover:scale-105"
            />
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold tracking-tight">
                {setting("organisation_name")}
              </span>
              <span className="block text-[10px] uppercase tracking-[0.16em] opacity-75">
                {setting("unit_name")}
              </span>
            </span>
          </Link>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-pill px-3.5 py-1.5 text-sm ${
                    active
                      ? "bg-primary-foreground/95 font-semibold text-primary shadow-panel"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/12 hover:text-primary-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <span className="mx-2 hidden h-7 w-px bg-primary-foreground/20 sm:block" />

            <NotificationsBell />
            <Link
              to="/profile"
              className="ml-1 hidden items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 transition-colors hover:bg-primary-foreground/12 sm:flex"
            >
              <span className="grid size-8 place-items-center rounded-full bg-primary-foreground/15 text-xs font-bold uppercase ring-1 ring-primary-foreground/25">
                {initials}
              </span>
              <span className="text-right leading-tight">
                <span className="block text-sm font-medium">{displayName}</span>
                <span className="block text-[10px] uppercase tracking-[0.1em] opacity-70">
                  {profile?.jobTitle || roles.map(roleLabel).join(", ") || "Requester"}
                </span>
              </span>
            </Link>

            <Button variant="secondary" size="sm" className="ml-2 rounded-full" onClick={signOut}>
              Sign out
            </Button>
          </nav>
        </div>
        <div className="h-[3px] w-full bg-[image:var(--gradient-gold)]" />
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-in px-5 py-10">{children}</main>
      <footer className="border-t border-border bg-card/60 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 text-xs text-muted-foreground">
          <span>Centre for Information and Communications Technology</span>
          <span>{setting("organisation_name")}</span>
        </div>
      </footer>
    </div>
  );
}


