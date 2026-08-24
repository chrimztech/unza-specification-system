import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasValidSession()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await apiPost<LoginResponse>("/api/auth/login", { identifier, password });
      setToken(result.token);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="University of Zambia" className="size-10 rounded-sm object-contain" />
          <span className="font-display text-base font-semibold">University of Zambia</span>
        </Link>
        <div>
          <h1 className="font-display text-3xl leading-tight">
            CICT Equipment Specification and Request Management
          </h1>
          <p className="mt-4 max-w-md text-sm opacity-85">
            Submit equipment needs, obtain manager approval and receive an auditable CICT technical
            specification.
          </p>
        </div>
        <p className="text-xs opacity-70">
          Centre for Information and Communications Technology
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-3 md:hidden">
            <img src="/logo.png" alt="University of Zambia" className="size-10 rounded-sm object-contain" />
            <span className="font-display text-base font-semibold">University of Zambia</span>
          </Link>
          <h2 className="font-display text-2xl">Staff access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your UNZA HR staff credentials.
          </p>

          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Staff number or institutional email</Label>
              <Input
                id="identifier"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 123456 or name@unza.zm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Credentials are verified against the UNZA HR system and your staff details are synced
            from your HR record. There is no self-registration and this app cannot reset your
            password — for a forgotten password or account issue, contact HR or the CICT service
            desk ({setting("support_email")}).
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/help" className="underline underline-offset-4">
              How the request process works
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
