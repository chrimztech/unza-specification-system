import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { RequestResponse, VerificationResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";
import { formatDateTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import {
  Letterhead,
  LetterheadMeta,
  PrintSheet,
  SignatureBlock,
  DocumentFooter,
  PrintToolbar,
} from "@/components/Letterhead";

export const Route = createFileRoute("/_authenticated/requests/$id/verification-certificate")({
  head: () => ({
    meta: [{ title: "Verification certificate · UNZA CICT" }],
  }),
  component: VerificationCertificate,
});

function VerificationCertificate() {
  const { id } = Route.useParams();

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });
  const verifications = useQuery({
    queryKey: ["verifications", id],
    queryFn: () => apiGet<VerificationResponse[]>(`/api/requests/${id}/verification`),
  });

  const r = request.data;
  const verification = verifications.data?.[0];

  if (request.isLoading || verifications.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!r) {
    return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;
  }
  if (!verification) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A verification certificate is issued once CICT Support has verified the item in use.
        </p>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrintToolbar document="Installation Verification Certificate" reference={r.reference}>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </PrintToolbar>

      <PrintSheet>
        <Letterhead
          documentTitle="Installation Verification Certificate"
          reference={verification.reference}
        />

        <LetterheadMeta
          rows={[
            ["Request reference", r.reference],
            ["Requesting Unit / School", unitName(r)],
            ["Department", r.department],
            [
              "Result",
              verification.result === "pass" ? "Verified — in service" : "Return required",
            ],
            ["Verified by", verification.verifiedBy?.fullName],
            ["Date verified", formatDateTime(verification.verifiedAt)],
          ]}
        />

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">Items verified</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm text-black">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1.5 pr-3 font-semibold">Item</th>
                  <th className="py-1.5 pr-3 font-semibold">Qty</th>
                  <th className="py-1.5 font-semibold">Location in use</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-neutral-300 align-top">
                    <td className="py-1.5 pr-3">
                      {i + 1}. {item.categoryName ?? "Equipment"}
                    </td>
                    <td className="py-1.5 pr-3">{item.quantity}</td>
                    <td className="py-1.5">{item.location || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-black">
            Verification notes
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            {verification.notes || "Installed, configured and confirmed working in the office."}
          </p>
        </section>

        <SignatureBlock roles={["CICT Support", "Requesting Unit Representative"]} />
        <DocumentFooter />
      </PrintSheet>
    </div>
  );
}
