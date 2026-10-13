import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { PurchaseResponse, RequestResponse, StoresReceiptResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";
import { formatDateTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Letterhead, LetterheadMeta, PrintSheet, SignatureBlock } from "@/components/Letterhead";

export const Route = createFileRoute("/_authenticated/requests/$id/stores-receipt")({
  head: () => ({
    meta: [{ title: "Stores receipt · UNZA CICT" }],
  }),
  component: StoresReceiptDoc,
});

function StoresReceiptDoc() {
  const { id } = Route.useParams();

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });
  const receipts = useQuery({
    queryKey: ["stores-receipts", id],
    queryFn: () => apiGet<StoresReceiptResponse[]>(`/api/requests/${id}/stores-receipt`),
  });
  const purchases = useQuery({
    queryKey: ["purchases", id],
    queryFn: () => apiGet<PurchaseResponse[]>(`/api/requests/${id}/purchase`),
  });

  const r = request.data;
  const receipt = receipts.data?.[0];
  const purchase = purchases.data?.find((p) => p.id === receipt?.purchaseId) ?? purchases.data?.[0];

  if (request.isLoading || receipts.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!r) {
    return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;
  }
  if (!receipt) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A stores receipt document is available once the equipment has been received into stores.
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
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={() => window.print()}>Print / save as PDF</Button>
        <Button asChild variant="outline">
          <Link to="/requests/$id" params={{ id }}>
            Back to request
          </Link>
        </Button>
      </div>

      <PrintSheet>
        <Letterhead documentTitle="Goods Received Note" reference={r.reference} />

        <LetterheadMeta
          rows={[
            ["Request reference", r.reference],
            ["Requesting Unit / School", unitName(r)],
            ["Department", r.department],
            ["Vendor", purchase?.vendorName],
            ["Received by", receipt.receivedBy?.fullName],
            ["Date received", formatDateTime(receipt.receivedAt)],
          ]}
        />

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">Items received</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm text-black">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1.5 pr-3 font-semibold">Item</th>
                  <th className="py-1.5 pr-3 font-semibold">Qty</th>
                  <th className="py-1.5 font-semibold">Specification</th>
                </tr>
              </thead>
              <tbody>
                {r.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-neutral-300 align-top">
                    <td className="py-1.5 pr-3">
                      {i + 1}. {item.categoryName ?? "Equipment"}
                    </td>
                    <td className="py-1.5 pr-3">{item.quantity}</td>
                    <td className="py-1.5">
                      {item.approvedProfile
                        ? `${item.approvedProfile.tier} — ${item.approvedProfile.name}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-black">
            Condition on receipt
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            {receipt.conditionNotes || "Good condition, as ordered."}
          </p>
        </section>

        <SignatureBlock roles={["Stores Officer", "Requesting Unit Representative"]} />
      </PrintSheet>
    </div>
  );
}
