import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Guidance & policy · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "How UNZA staff raise ICT equipment requests, how CICT specifies them, service standards and who to contact for help.",
      },
      { property: "og:title", content: "Guidance & policy · UNZA CICT" },
      {
        property: "og:description",
        content:
          "Step-by-step guidance on the CICT equipment specification and request process at the University of Zambia.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const STEPS = [
  {
    title: "1 · Prepare the business case",
    body: "Describe what the equipment is for, who will use it, and the impact if it is not provided. Requests without a clear operational or academic justification are returned.",
  },
  {
    title: "2 · Submit the request",
    body: "Sign in with your HR staff credentials, complete the four-step request form and nominate the manager who authorises spending for your unit.",
  },
  {
    title: "3 · Manager authorisation",
    body: "Your head of unit approves, returns the request for clarification, or rejects it with reasons. You are notified of the outcome on your dashboard.",
  },
  {
    title: "4 · CICT technical specification",
    body: "CICT matches each item to an approved specification profile — Standard, Enhanced or Specialised — and records any exception with justification.",
  },
  {
    title: "5 · Approved specification sheet",
    body: "Once approved, a printable specification sheet is issued for procurement. Every decision is retained in the request audit trail.",
  },
];

const STANDARDS = [
  { label: "Manager authorisation", value: "3 working days" },
  { label: "CICT technical review", value: "5 working days" },
  { label: "Urgent requests", value: "Reviewed within 1 working day where justified" },
  { label: "Clarification responses", value: "Requester replies within 5 working days" },
];

const FAQS = [
  {
    q: "Why can I not create an account?",
    a: "Accounts come from the University HR system. If you are a member of staff and cannot sign in, ask CICT to confirm your HR record is active.",
  },
  {
    q: "My job title or department is wrong.",
    a: "These details are maintained in HR. Have HR correct the record — your profile updates automatically the next time you sign in.",
  },
  {
    q: "Can I request equipment outside the standard profiles?",
    a: "Yes, but the request must include a written justification. CICT records this as a documented exception on the specification sheet.",
  },
  {
    q: "Who chooses the supplier or price?",
    a: "CICT issues the technical specification only. Sourcing, pricing and award remain with Procurement under University procurement rules.",
  },
];

function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 xl:px-16 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="University of Zambia"
              className="size-9 rounded-sm object-contain"
            />
            <span className="font-display text-sm font-semibold">University of Zambia · CICT</span>
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Staff sign in</Link>
          </Button>
        </div>
        <div className="crest-rule" />
      </header>

      <main className="space-y-12 px-4 sm:px-8 lg:px-12 xl:px-16 py-12">
        <section>
          <p className="label-caps">Guidance</p>
          <h1 className="mt-2 font-display text-4xl leading-tight">
            How equipment requests are specified and approved
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            The Centre for Information and Communications Technology sets the technical standard for
            all ICT equipment purchased by the University. This page explains the process, the
            service standards you can expect, and the answers to common questions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">The process</h2>
          <ol className="space-y-3">
            {STEPS.map((s) => (
              <li key={s.title} className="surface p-5">
                <h3 className="font-display text-lg">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Service standards</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {STANDARDS.map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card p-4">
                <dt className="label-caps">{s.label}</dt>
                <dd className="mt-1 text-sm">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-md border border-border bg-card p-5">
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-border bg-secondary p-6">
          <h2 className="font-display text-xl">Need help?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact the CICT service desk at the Great East Road campus, or email your school ICT
            focal point. Include your request reference (for example UNZA/CICT/2026/0001) so the
            enquiry can be traced.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Centre for Information and Communications Technology · University of Zambia
      </footer>
    </div>
  );
}
