import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FilePlus2,
  FileSearch,
  Gauge,
  HelpCircle,
  LibraryBig,
  LogOut,
  Menu,
  PackageCheck,
  Settings2,
  ShieldCheck,
  Store,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { clearToken } from "@/lib/session";
import { useAuth } from "@/hooks/useAuth";
import { useLookup, useSettings } from "@/hooks/useLookups";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/NotificationsBell";

type AppPath =
  | "/dashboard"
  | "/requests"
  | "/requests/new"
  | "/catalogue"
  | "/approvals"
  | "/reviews"
  | "/standards"
  | "/reports"
  | "/directory"
  | "/procurement"
  | "/stores"
  | "/verification"
  | "/audit"
  | "/admin";

type NavItem = { to: AppPath; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const PAGE_TITLES: Partial<Record<AppPath | "/profile" | "/notifications", string>> = {
  "/dashboard": "Dashboard",
  "/requests": "Requests",
  "/requests/new": "New equipment request",
  "/catalogue": "Specification catalogue",
  "/approvals": "Manager approvals",
  "/reviews": "CICT reviews",
  "/standards": "Specification standards",
  "/reports": "Reports & insights",
  "/directory": "Staff directory",
  "/procurement": "Procurement",
  "/stores": "Stores",
  "/verification": "Equipment verification",
  "/audit": "Audit workspace",
  "/admin": "System administration",
  "/profile": "My profile",
  "/notifications": "Notifications",
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/requests/") && pathname !== "/requests/new") return "Request details";
  return PAGE_TITLES[pathname as keyof typeof PAGE_TITLES] ?? "Workspace";
}

function isActivePath(pathname: string, to: AppPath) {
  if (to === "/requests") return pathname === "/requests" || /^\/requests\/[^/]+/.test(pathname);
  return pathname === to;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { displayName, roles, profile, isCict, isOversight, hasRole } = useAuth();
  const { setting } = useSettings();
  const roleOptions = useLookup("role");
  const roleLabel = (role: string) =>
    roleOptions.find((option) => option.value === role)?.label ?? role;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "UZ";

  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: Gauge },
        { to: "/requests", label: "Requests", icon: FileSearch },
        { to: "/catalogue", label: "Catalogue", icon: LibraryBig },
      ] as NavItem[],
    },
    {
      label: "My work",
      items: [
        ...(hasRole("manager")
          ? [{ to: "/approvals", label: "Manager approvals", icon: ClipboardCheck } as NavItem]
          : []),
        ...(isCict
          ? ([
              { to: "/reviews", label: "CICT reviews", icon: FileCheck2 },
              { to: "/standards", label: "Standards", icon: BookOpenCheck },
            ] as NavItem[])
          : []),
        ...(hasRole("procurement")
          ? [{ to: "/procurement", label: "Procurement", icon: Boxes } as NavItem]
          : []),
        ...(hasRole("stores") ? [{ to: "/stores", label: "Stores", icon: Store } as NavItem] : []),
        ...(hasRole("cict_support")
          ? [{ to: "/verification", label: "Verification", icon: PackageCheck } as NavItem]
          : []),
      ],
    },
    {
      label: "Oversight",
      items: [
        ...(isOversight
          ? ([
              { to: "/reports", label: "Reports", icon: BarChart3 },
              { to: "/directory", label: "Directory", icon: UsersRound },
            ] as NavItem[])
          : []),
        ...(hasRole("auditor")
          ? [{ to: "/audit", label: "Audit log", icon: ShieldCheck } as NavItem]
          : []),
        ...(hasRole("admin")
          ? [{ to: "/admin", label: "Administration", icon: Settings2 } as NavItem]
          : []),
      ],
    },
  ].filter((group) => group.items.length > 0);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearToken();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center border-b border-sidebar-border px-5">
        <Link
          to="/dashboard"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-lg ring-1 ring-white/15">
            <img
              src="/logo.png"
              alt="University of Zambia"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-extrabold tracking-tight text-white">
              CICT Specifications
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
              University of Zambia
            </span>
          </span>
        </Link>
      </div>

      <div className="px-4 pt-5">
        <Button
          asChild
          className="h-11 w-full justify-start bg-accent text-accent-foreground shadow-none hover:bg-accent/90"
        >
          <Link to="/requests/new" onClick={() => setMobileOpen(false)}>
            <FilePlus2 />
            New request
            <ChevronRight className="ml-auto opacity-65" />
          </Link>
        </Button>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-5" aria-label="Main navigation">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-white/12 text-white shadow-ridge"
                        : "text-sidebar-foreground/68 hover:bg-white/7 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`size-[18px] ${active ? "text-accent" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80"}`}
                    />
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/7"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold uppercase text-white ring-1 ring-white/10">
            {initials}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
            <span className="mt-0.5 block truncate text-[11px] text-sidebar-foreground/50">
              {profile?.jobTitle || roles.map(roleLabel).join(", ") || "Requester"}
            </span>
          </span>
          <ChevronRight className="size-4 text-sidebar-foreground/35" />
        </Link>
        <div className="mt-1 flex items-center gap-1">
          <Link
            to="/help"
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/55 transition-colors hover:bg-white/7 hover:text-white"
          >
            <HelpCircle className="size-4" />
            Help centre
          </Link>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-lg p-2 text-sidebar-foreground/55 transition-colors hover:bg-white/7 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-lg bg-card px-4 py-2 text-sm font-semibold shadow-lift focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[264px] bg-sidebar text-sidebar-foreground lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(86vw,320px)] bg-sidebar text-sidebar-foreground shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-sidebar-foreground/60 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-40 flex h-[76px] items-center border-b border-border/80 bg-card/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="mr-3 rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <div className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex">
              <span>CICT Specification System</span>
              <ChevronRight className="size-3" />
              <span className="text-foreground/70">Workspace</span>
            </div>
            <h1 className="truncate font-display text-base font-bold tracking-tight sm:mt-0.5 sm:text-lg">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationsBell />
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <Link
              to="/profile"
              aria-label="Open your profile"
              className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary sm:flex"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                {initials}
              </span>
              <span className="hidden max-w-56 truncate text-sm font-semibold xl:block">
                {displayName}
              </span>
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          className="min-h-[calc(100vh-76px)] w-full animate-fade-in px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10"
        >
          <div className="w-full">{children}</div>
        </main>

        <footer className="border-t border-border/70 bg-card/55 px-6 py-4 text-center text-[11px] text-muted-foreground lg:text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Centre for Information and Communications Technology</span>
            <span>{setting("organisation_name")}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
