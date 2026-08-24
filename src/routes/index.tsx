import { createFileRoute, Link } from "@tanstack/react-router";
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
    title: "Requester submits",
    body: "A staff member records the business need, the equipment items and the intended use, then accepts the accuracy declaration.",
  },
  {
    n: "02",
    title: "Manager confirms the need",
    body: "The responsible manager approves the business case, returns it for correction, or rejects it with a recorded reason.",
  },
  {
    n: "03",
    title: "CICT sets the specification",
    body: "CICT compares the request against the approved catalogue, applies the correct tier and records a structured technical decision.",
  },
  {
    n: "04",
    title: "Traceable specification sheet",
    body: "An immutable reference number, full audit trail and a procurement-ready specification sheet are produced.",
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="crest-header crest-header-motif sticky top-0 z-40 text-primary-foreground shadow-lift">
        <div className="relative z-10 mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-md bg-[image:var(--gradient-gold)] font-display text-lg font-bold text-accent-foreground shadow-panel ring-1 ring-primary-foreground/25">
            UZ
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold">University of Zambia</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] opacity-75">
              Centre for Information and Communications Technology
            </span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/help"
              className="nav-pill px-3.5 py-1.5 text-sm text-primary-foreground/85 hover:bg-primary-foreground/12 hover:text-primary-foreground"
            >
              Guidance
            </Link>
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link to="/auth">Staff sign in</Link>
            </Button>
          </div>
        </div>
        <div className="h-[3px] w-full bg-[image:var(--gradient-gold)]" />
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/12 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              Official CICT service
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-foreground md:text-6xl">
              CICT Equipment Specification and{" "}
              <span className="bg-[image:var(--gradient-crest)] bg-clip-text text-transparent">
                Request Management
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              One controlled process for every department, school, directorate, institute and
              centre. Requests are checked against approved specification tiers, approved by the
              responsible manager and finalised by CICT with a complete audit trail.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full px-7 shadow-lift transition-transform hover:scale-[1.03]"
              >
                <Link to="/auth">Sign in to submit a request</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/help">Read the guidance</Link>
              </Button>
            </div>
            <p className="mt-5 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground">
              CICT technical approval confirms the correct minimum specification. It is not approval
              to spend money.
            </p>
          </div>
          <div className="surface surface-hover animate-scale-in bg-[image:var(--gradient-parchment)] p-7">
            <p className="gold-underline label-caps">Specification tiers in use</p>
            <ul className="mt-5 space-y-5 text-sm">
              {[
                {
                  t: "Standard",
                  d: "Administrative and clerical workloads — core productivity and university systems.",
                },
                {
                  t: "Enhanced",
                  d: "Teaching, research and heavy multitasking across large datasets and applications.",
                },
                {
                  t: "Specialised",
                  d: "Engineering, GIS, data science, media production and server workloads.",
                },
              ].map((tier) => (
                <li key={tier.t} className="border-l-2 border-primary/25 pl-4">
                  <div className="font-display text-base font-semibold">{tier.t}</div>
                  <div className="mt-1 leading-relaxed text-muted-foreground">{tier.d}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-5 py-20">
        <h2 className="gold-underline font-display text-3xl">How a request moves</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n} className="surface surface-hover group p-6">
              <span className="font-display text-3xl text-accent transition-colors group-hover:text-primary">
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-border bg-card/60 py-8 text-center text-xs text-muted-foreground">
        Centre for Information and Communications Technology · University of Zambia
      </footer>
    </div>
  );

}
