import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { PurchaseResponse, RequestResponse } from "@/lib/api-types";
import { unitName } from "@/lib/requests";
import { formatDateTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Letterhead, LetterheadMeta, PrintSheet, SignatureBlock } from "@/components/Letterhead";

export const Route = createFileRoute("/_authenticated/requests/$id/purchase-order")({
  head: () => ({
    meta: [{ title: "Purchase order · UNZA CICT" }],
  }),
  component: PurchaseOrderDoc,
});

function PurchaseOrderDoc() {
  const { id } = Route.useParams();

  const request = useQuery({
    queryKey: ["request", id],
    queryFn: () => apiGet<RequestResponse>(`/api/requests/${id}`),
  });
  const purchases = useQuery({
    queryKey: ["purchases", id],
    queryFn: () => apiGet<PurchaseResponse[]>(`/api/requests/${id}/purchase`),
  });

  const r = request.data;
  const purchase = purchases.data?.[0];

  if (request.isLoading || purchases.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!r) {
    return <p className="text-sm text-muted-foreground">This request is not available to you.</p>;
  }
  if (!purchase) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A purchase order document is available once a purchase has been recorded.
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
        <Letterhead
          documentTitle="Purchase Order"
          reference={purchase.purchaseOrderNumber || r.reference}
        />

        <LetterheadMeta
          rows={[
            ["Request reference", r.reference],
            ["Requesting Unit / School", unitName(r)],
            ["Department", r.department],
            ["Vendor", purchase.vendorName],
            ["Amount", `${purchase.currency} ${Number(purchase.amount).toLocaleString()}`],
            ["Purchased by", purchase.purchasedBy?.fullName],
            ["Date raised", formatDateTime(purchase.purchasedAt)],
          ]}
        />

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-black">
            Items to purchase
          </h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm text-black">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1.5 pr-3 font-semibold">Item</th>
                  <th className="py-1.5 pr-3 font-semibold">Qty</th>
                  <th className="py-1.5 font-semibold">Approved specification</th>
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

        {purchase.notes && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-black">Notes</h2>
            <p className="mt-1 text-sm text-neutral-700">{purchase.notes}</p>
          </section>
        )}

        <SignatureBlock roles={["Procurement Officer", "Authorising Officer"]} />
      </PrintSheet>
    </div>
  );
}
