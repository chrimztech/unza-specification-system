import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNZA CICT Equipment Specification & Request System" },
      {
        name: "description",
        content:
          "Standardised CICT equipment specifications for University of Zambia departments: submit requests, obtain manager approval and receive a traceable CICT technical specification.",
      },
      { property: "og:title", content: "UNZA CICT Equipment Specification System" },
      {
        property: "og:description",
        content:
          "Submit CICT equipment requests, get manager and CICT technical approval, and receive an auditable specification sheet.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    n: "01",
    title: "Submit the need",
    body: "Record the business need, intended use and equipment items in one guided request.",
    icon: FileText,
  },
  {
    n: "02",
    title: "Manager review",
    body: "Your responsible manager confirms the business case and ownership of the request.",
    icon: ClipboardCheck,
  },
  {
    n: "03",
    title: "CICT assessment",
    body: "CICT applies approved standards and records a structured technical decision.",
    icon: ShieldCheck,
  },
  {
    n: "04",
    title: "Ready to procure",
    body: "Receive a traceable, procurement-ready specification sheet with a full audit history.",
    icon: FileCheck2,
  },
];

const TIERS = [
  { name: "Standard", detail: "Core productivity and university systems" },
  { name: "Enhanced", detail: "Teaching, research and advanced multitasking" },
  { name: "Specialised", detail: "Engineering, GIS, media and compute workloads" },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-border">
        <img src="/logo.png" alt="University of Zambia" className="h-full w-full object-contain" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-extrabold tracking-tight text-foreground sm:text-base">
          CICT Specifications
        </span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground sm:text-[10px]">
          University of Zambia
        </span>
      </span>
    </Link>
  );
}

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-1 bg-[image:var(--gradient-gold)]" />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-xl">
        <div className="flex h-[76px] items-center gap-4 px-5 sm:px-8 lg:px-12 xl:px-16">
          <Brand />
          <nav
            className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2"
            aria-label="Public navigation"
          >
            <Link
              to="/help"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
            >
              Guidance
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Staff sign in</span>
                <ArrowRight />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/70 bg-card">
          <div className="pointer-events-none absolute -left-24 top-20 size-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-0 size-[32rem] rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid items-center gap-14 px-5 py-16 sm:px-8 lg:px-12 xl:px-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                <CheckCircle2 className="size-3.5" />
                Official university workflow
              </div>
              <h1 className="mt-6 max-w-3xl break-words font-display text-[2.3rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground min-[420px]:text-[2.65rem] sm:text-5xl lg:text-[3.5rem]">
                Equipment requests, from business need to
                <span className="text-primary"> approved specification.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A clear, accountable process for requesting ICT equipment across the University of
                Zambia—bringing staff, managers and CICT into one shared workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="px-6 shadow-md">
                  <Link to="/auth">
                    Start a request <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-6">
                  <Link to="/help">See how it works</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
                {["HR staff access", "Role-based approvals", "Complete audit history"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-2">
                      <Check className="size-3.5 text-success" /> {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="animate-scale-in lg:pl-5">
              <div className="relative overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground shadow-2xl sm:p-8">
                <div className="absolute right-0 top-0 size-52 rounded-full bg-unza-green/40 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/45">
                        Request journey
                      </p>
                      <h2 className="mt-1 font-display text-xl font-bold text-white">
                        One controlled workflow
                      </h2>
                    </div>
                    <span className="rounded-lg bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                      Traceable
                    </span>
                  </div>

                  <div className="mt-7 space-y-1">
                    {[
                      ["Request submitted", "Complete", true],
                      ["Manager approval", "Complete", true],
                      ["CICT technical review", "In review", false],
                      ["Specification issued", "Next", false],
                    ].map(([label, state, complete], index) => (
                      <div key={String(label)} className="relative flex items-center gap-4 py-3">
                        {index < 3 && (
                          <span className="absolute left-[15px] top-10 h-7 w-px bg-white/12" />
                        )}
                        <span
                          className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border ${complete ? "border-unza-light-green/40 bg-unza-light-green/15 text-unza-light-green" : index === 2 ? "border-accent/40 bg-accent/15 text-accent" : "border-white/10 bg-white/5 text-white/35"}`}
                        >
                          {complete ? (
                            <Check className="size-4" />
                          ) : (
                            <span className="text-[10px] font-bold">{index + 1}</span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold text-white/90">
                          {label}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${complete ? "text-unza-light-green" : index === 2 ? "text-accent" : "text-white/30"}`}
                        >
                          {state}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-sidebar-foreground/60">
                        Request reference
                      </span>
                      <span className="font-mono font-semibold text-white">
                        UNZA/CICT/2026/0048
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-3/4 rounded-full bg-[image:var(--gradient-gold)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/70 bg-secondary/45">
          <div className="grid divide-y divide-border/70 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-12 xl:px-16">
            {[
              ["01", "One shared record", "No scattered forms or email chains"],
              ["02", "Clear accountability", "Every decision has an owner and timestamp"],
              ["03", "Approved standards", "Consistent specifications for every unit"],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4 py-6 sm:px-6 first:pl-0 last:pr-0">
                <span className="font-display text-lg font-extrabold text-primary/35">
                  {number}
                </span>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 lg:px-12 xl:px-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="label-caps text-primary">Built for accountability</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              A simpler path through every review
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              Each stage keeps the right information visible to the right people, without losing the
              context behind a decision.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.n}
                  className="surface group p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-display text-xs font-extrabold text-muted-foreground/40">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="border-y border-border/70 bg-card">
          <div className="grid items-center gap-10 px-5 py-16 sm:px-8 lg:px-12 xl:px-16 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
            <div>
              <p className="label-caps text-primary">Consistent by design</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight">
                Specifications matched to the work
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                CICT applies an approved equipment tier based on the role, use case and workload—not
                a one-size-fits-all list.
              </p>
              <Link
                to="/help"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                Read the specification guidance <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-3">
              {TIERS.map((tier, index) => (
                <div
                  key={tier.name}
                  className="flex items-center gap-4 rounded-xl border border-border bg-background/70 p-4"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${index === 0 ? "bg-primary/10 text-primary" : index === 1 ? "bg-info/10 text-info" : "bg-accent/20 text-accent-foreground"}`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{tier.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tier.detail}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 lg:px-12 xl:px-16 sm:py-20">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground shadow-lift sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="absolute -right-10 -top-20 size-72 rounded-full bg-unza-light-green/20 blur-3xl" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                Ready to submit an equipment request?
              </h2>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/70">
                Sign in with your University staff credentials. Your staff details will be securely
                matched to your HR record.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="relative mt-6 shrink-0 lg:mt-0"
            >
              <Link to="/auth">
                Continue to staff sign in <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs text-muted-foreground sm:px-8 lg:px-12 xl:px-16">
          <Brand />
          <span>Centre for Information and Communications Technology</span>
        </div>
      </footer>
    </div>
  );
}
