import type { ReactNode } from "react";

/**
 * Official UNZA/CICT letterhead for printable documents (request forms, spec sheets,
 * purchase orders, stores receipts, verification certificates). Deliberately fixed to
 * black-on-white regardless of the viewer's app theme — this represents an official
 * paper document, not a themed screen. Never uses a bare <header> tag: the app's global
 * print stylesheet hides every <header> element to remove site chrome, which would also
 * swallow this block.
 */
export function Letterhead({
  documentTitle,
  reference,
  subtitle,
}: {
  documentTitle: string;
  reference?: string | null;
  subtitle?: string;
}) {
  return (
    <div className="border-b-2 border-black pb-5 text-center text-black">
      <img src="/logo.png" alt="University of Zambia crest" className="mx-auto h-24 w-auto" />
      <h1 className="mt-2 text-2xl font-bold tracking-wide">UNIVERSITY OF ZAMBIA</h1>
      <p className="text-sm font-semibold uppercase tracking-wide">
        Centre for Information &amp; Communication Technologies
      </p>
      {subtitle && <p className="mt-0.5 text-xs text-neutral-600">{subtitle}</p>}
      <div className="mx-auto mt-4 inline-block border border-black px-6 py-1.5">
        <p className="text-sm font-bold uppercase tracking-widest">{documentTitle}</p>
      </div>
      {reference && (
        <p className="mt-2 font-mono text-xs tracking-wide text-neutral-700">
          Reference: {reference}
        </p>
      )}
    </div>
  );
}

/** Two-column key/value meta block used under the letterhead on every document. */
export function LetterheadMeta({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 border-b border-neutral-300 py-4 text-sm text-black sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt className="w-40 shrink-0 font-semibold">{label}</dt>
          <dd className="min-w-0">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Signature box row for the bottom of a printable document. */
export function SignatureBlock({ roles }: { roles: string[] }) {
  return (
    <div className="mt-10 grid gap-8 text-black sm:grid-cols-2">
      {roles.map((role) => (
        <div key={role}>
          <div className="h-14 border-b border-black" />
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{role}</p>
          <p className="text-xs text-neutral-600">Signature &amp; date</p>
        </div>
      ))}
    </div>
  );
}

/** Shared white-page shell every printable document renders inside. */
export function PrintSheet({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-md border border-neutral-300 bg-white p-8 text-black shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      {children}
    </article>
  );
}
