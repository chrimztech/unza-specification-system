import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { apiPost, ApiError } from "@/lib/api-client";
import { hasValidSession, setToken } from "@/lib/session";
import type { LoginResponse } from "@/lib/api-types";
import { useSettings } from "@/hooks/useLookups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "Sign in with your University of Zambia staff account to submit or review CICT equipment specification requests.",
      },
      { property: "og:title", content: "Staff sign in · UNZA CICT Specification System" },
      {
        property: "og:description",
        content: "Access the UNZA CICT equipment specification and request management system.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setting } = useSettings();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasValidSession()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiPost<LoginResponse>("/api/auth/login", { identifier, password });
      setToken(result.token);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.02fr)_minmax(480px,0.98fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col xl:p-14">
        <div className="absolute -left-36 -top-36 size-[32rem] rounded-full border border-white/5" />
        <div className="absolute -left-16 -top-16 size-[22rem] rounded-full border border-white/5" />
        <div className="absolute -bottom-28 -right-24 size-[30rem] rounded-full bg-accent/10 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-white/15">
            <img
              src="/logo.png"
              alt="University of Zambia"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-extrabold text-white">
              CICT Specifications
            </span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/50">
              University of Zambia
            </span>
          </span>
        </Link>

        <div className="relative my-auto max-w-xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            <ShieldCheck className="size-3.5" /> Secure staff workspace
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.12] tracking-[-0.04em] text-white xl:text-5xl">
            Better equipment decisions start with a clear request.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-sidebar-foreground/65">
            Submit, review and track ICT equipment requirements through one accountable University
            workflow.
          </p>

          <ul className="mt-9 space-y-4">
            {[
              "One record from submission through procurement",
              "Role-based manager and CICT approvals",
              "Auditable decisions and approved specifications",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm font-medium text-sidebar-foreground/80"
              >
                <span className="grid size-6 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/40">
          Centre for Information and Communications Technology
        </p>
      </section>

      <section className="flex min-h-screen flex-col bg-card lg:bg-background">
        <div className="flex h-[76px] items-center justify-between border-b border-border/70 px-5 lg:border-0 lg:px-10 xl:px-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <Link to="/help" className="text-sm font-semibold text-primary hover:underline">
            Need help?
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid size-12 place-items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-border">
                <img
                  src="/logo.png"
                  alt="University of Zambia"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-base font-extrabold">
                  CICT Specifications
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  University of Zambia
                </span>
              </span>
            </div>

            <div>
              <p className="label-caps text-primary">Staff access</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sign in using the same credentials you use for the UNZA HR system.
              </p>
            </div>

            <form onSubmit={signIn} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-semibold">
                  Staff number or institutional email
                </Label>
                <Input
                  id="identifier"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="e.g. 123456 or name@unza.zm"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <span className="text-xs text-muted-foreground">UNZA HR password</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 pr-11"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" className="h-12 w-full" disabled={busy}>
                {busy ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />{" "}
                    Signing in…
                  </>
                ) : (
                  "Sign in to your workspace"
                )}
              </Button>
            </form>

            <div className="mt-7 rounded-xl border border-border bg-secondary/55 p-4">
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-muted-foreground">
                  Your credentials are verified securely against the UNZA HR system. This service
                  does not store your HR password.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              Cannot sign in? Contact HR or the CICT service desk at{" "}
              <a
                href={`mailto:${setting("support_email")}`}
                className="font-semibold text-primary hover:underline"
              >
                {setting("support_email")}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
