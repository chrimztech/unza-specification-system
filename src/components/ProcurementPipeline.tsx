import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShoppingCart,
  Receipt,
  PackageCheck,
  ShieldCheck,
  Plus,
  RotateCcw,
  Check,
  Undo2,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import { apiDownload, apiGet, apiPost, apiUpload, ApiError } from "@/lib/api-client";
import type {
  EvaluationResponse,
  PurchaseResponse,
  QuotationResponse,
  RequestStatus,
  StoresReceiptResponse,
  VerificationResponse,
} from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PIPELINE_STATUSES = new Set<RequestStatus>([
  "approved",
  "procurement",
  "purchased",
  "in_stores",
  "completed",
  "return_required",
]);

/** Number of pipeline steps (of the 4 in STEPS) that are fully complete for this status. */
function stageIndex(status: RequestStatus): number {
  switch (status) {
    case "approved":
    case "procurement":
      return 0;
    case "purchased":
      return 1;
    case "in_stores":
      return 2;
    case "return_required":
      return 3;
    case "completed":
      return 4;
    default:
      return 0;
  }
}

const STEPS: { label: string; hint: string }[] = [
  { label: "Quotations & evaluation", hint: "Procurement sources and evaluates quotations" },
  { label: "Purchase", hint: "Purchase order raised against a passed quotation" },
  { label: "Stores receipt", hint: "Goods received into stores" },
  { label: "Verification", hint: "CICT Support confirms it matches specification" },
];

function PipelineStepper({ status }: { status: RequestStatus }) {
  const idx = stageIndex(status);
  const returned = status === "return_required";
  const progressPct = (Math.min(idx, 4) / 4) * 100;

  return (
    <nav aria-label="Pipeline progress" className="surface p-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${returned ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-4">
        {STEPS.map((s, i) => {
          const isReturnedStep = returned && i === 3;
          const state = isReturnedStep
            ? "returned"
            : i < idx
              ? "done"
              : i === idx
                ? "current"
                : "todo";
          return (
            <li key={s.label}>
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  state === "done"
                    ? "bg-success/15 text-success"
                    : state === "current"
                      ? "bg-primary text-primary-foreground"
                      : state === "returned"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {state === "done" ? (
                  <Check className="size-3.5" />
                ) : state === "returned" ? (
                  <Undo2 className="size-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`mt-2 block text-sm font-medium ${state === "todo" ? "text-muted-foreground" : ""}`}
              >
                {s.label}
              </span>
              <span className="block text-xs text-muted-foreground">{s.hint}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="surface">
      <h2 className="flex items-center gap-2 border-b border-border px-4 py-3 font-display text-lg">
        <Icon className="size-4.5 text-muted-foreground" />
        {title}
      </h2>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

function FormCallout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-sm border border-border bg-secondary/30 p-4">
      <p className="label-caps text-foreground">{title}</p>
      {children}
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const positive = result === "pass";
  return (
    <Badge variant={positive ? "default" : "destructive"} className="capitalize">
      {result.replace("_", " ")}
    </Badge>
  );
}

function OutcomeCard({ result, children }: { result: string; children: React.ReactNode }) {
  const positive = result === "pass";
  return (
    <li
      className={`rounded-sm border p-3 text-sm ${
        positive ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
      }`}
    >
      {children}
    </li>
  );
}

function EvaluationRow({ e }: { e: EvaluationResponse }) {
  return (
    <OutcomeCard result={e.result}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{e.reference}</span>
        <ResultBadge result={e.result} />
      </div>
      {e.notes && <p className="mt-1.5">{e.notes}</p>}
      <p className="mt-1.5 text-xs text-muted-foreground">
        {e.evaluatedBy?.fullName ?? "Unknown"} · {formatDateTime(e.evaluatedAt)}
      </p>
    </OutcomeCard>
  );
}

function EvaluateForm({
  quotationId,
  requestId,
  onDone,
}: {
  quotationId: string;
  requestId: string;
  onDone: () => void;
}) {
  const [result, setResult] = useState<"pass" | "fail" | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!result) {
      toast.error("Choose pass or fail.");
      return;
    }
    if (result === "fail" && !notes.trim()) {
      toast.error("Please record a reason for this outcome.");
      return;
    }
    setBusy(true);
    try {
      await apiPost(`/api/requests/${requestId}/quotations/${quotationId}/evaluate`, {
        result,
        notes: notes || undefined,
      });
      toast.success("Evaluation recorded");
      setResult("");
      setNotes("");
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record the evaluation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-sm border border-border bg-secondary/30 p-3">
      <p className="label-caps text-foreground">Evaluate this quotation</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={result} onValueChange={(v) => setResult(v as "pass" | "fail")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Outcome…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" disabled={busy || !result} onClick={submit}>
          Record evaluation
        </Button>
      </div>
      {result && (
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            result === "fail"
              ? "Reason the quotation did not meet requirements — required for a fail."
              : "Notes (optional)."
          }
        />
      )}
    </div>
  );
}

function QuotationsPanel({
  requestId,
  status,
  canAct,
  onChanged,
}: {
  requestId: string;
  status: RequestStatus;
  canAct: boolean;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency] = useState("ZMW");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const quotations = useQuery({
    queryKey: ["quotations", requestId],
    queryFn: () => apiGet<QuotationResponse[]>(`/api/requests/${requestId}/quotations`),
  });

  function refetchQuotations() {
    queryClient.invalidateQueries({ queryKey: ["quotations", requestId] });
    onChanged();
  }

  async function addQuotation() {
    if (!vendorName.trim() || !amount) {
      toast.error("Vendor name and amount are required.");
      return;
    }
    setBusy(true);
    try {
      let attachmentId: string | undefined;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("kind", "quotation_document");
        const uploaded = await apiUpload<{ id: string }>(
          `/api/requests/${requestId}/attachments`,
          form,
        );
        attachmentId = uploaded.id;
      }
      await apiPost(`/api/requests/${requestId}/quotations`, {
        vendorName,
        amount: Number(amount),
        currency,
        notes: notes || undefined,
        attachmentId,
      });
      toast.success("Quotation recorded");
      setVendorName("");
      setAmount("");
      setNotes("");
      setFile(null);
      refetchQuotations();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record the quotation");
    } finally {
      setBusy(false);
    }
  }

  async function downloadQuote(attachmentId: string, fileName: string) {
    try {
      const { blob, filename } = await apiDownload(`/api/attachments/${attachmentId}/download`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename ?? fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not open the quote document.");
    }
  }

  const canAddQuotation = canAct && (status === "approved" || status === "procurement");
  const canEvaluate = canAct && status === "procurement";

  return (
    <Panel title="Procurement quotations" icon={ShoppingCart}>
      {(quotations.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotations recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {(quotations.data ?? []).map((q) => (
            <li key={q.id} className="rounded-sm border border-border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{q.vendorName}</p>
                <p className="font-mono text-sm">
                  {q.currency} {Number(q.amount).toLocaleString()}
                </p>
              </div>
              {q.notes && <p className="mt-1 text-sm text-muted-foreground">{q.notes}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted by {q.submittedBy?.fullName ?? "Unknown"} · {formatDateTime(q.createdAt)}
              </p>
              {q.attachmentId && (
                <button
                  type="button"
                  onClick={() =>
                    downloadQuote(q.attachmentId!, q.attachmentFileName ?? "quotation")
                  }
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Paperclip className="size-3" />
                  {q.attachmentFileName ?? "Quote document"}
                </button>
              )}
              {q.evaluations.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {q.evaluations.map((e) => (
                    <EvaluationRow key={e.id} e={e} />
                  ))}
                </ul>
              )}
              {canEvaluate && (
                <EvaluateForm quotationId={q.id} requestId={requestId} onDone={refetchQuotations} />
              )}
            </li>
          ))}
        </ul>
      )}

      {canAddQuotation && (
        <FormCallout title="Add a quotation">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Vendor name</Label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (ZMW)</Label>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Vendor's quote document (optional)</Label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-sm file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </div>
          <Button size="sm" disabled={busy} onClick={addQuotation}>
            <Plus className="mr-1.5 size-4" />
            Add quotation
          </Button>
        </FormCallout>
      )}
    </Panel>
  );
}

function PurchasePanel({
  requestId,
  status,
  canAct,
  onChanged,
}: {
  requestId: string;
  status: RequestStatus;
  canAct: boolean;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [quotationId, setQuotationId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ZMW");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const purchases = useQuery({
    queryKey: ["purchases", requestId],
    queryFn: () => apiGet<PurchaseResponse[]>(`/api/requests/${requestId}/purchase`),
  });

  const quotations = useQuery({
    queryKey: ["quotations", requestId],
    queryFn: () => apiGet<QuotationResponse[]>(`/api/requests/${requestId}/quotations`),
    enabled: canAct && status === "procurement",
  });

  const passedQuotations = (quotations.data ?? []).filter(
    (q) => q.evaluations[0]?.result === "pass",
  );

  async function recordPurchase() {
    if (!quotationId || !vendorName.trim() || !amount) {
      toast.error("Select a passed quotation and enter vendor and amount.");
      return;
    }
    setBusy(true);
    try {
      await apiPost(`/api/requests/${requestId}/purchase`, {
        quotationId,
        purchaseOrderNumber: poNumber || undefined,
        vendorName,
        amount: Number(amount),
        currency,
        notes: notes || undefined,
      });
      toast.success("Purchase recorded");
      queryClient.invalidateQueries({ queryKey: ["purchases", requestId] });
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record the purchase");
    } finally {
      setBusy(false);
    }
  }

  const canRecord = canAct && status === "procurement";
  if ((purchases.data ?? []).length === 0 && !canRecord) return null;

  return (
    <Panel title="Purchase" icon={Receipt}>
      {(purchases.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No purchase recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {(purchases.data ?? []).map((p) => (
            <li key={p.id} className="rounded-sm border border-border p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{p.vendorName}</p>
                <p className="font-mono">
                  {p.currency} {Number(p.amount).toLocaleString()}
                </p>
              </div>
              {p.purchaseOrderNumber && (
                <p className="mt-1 text-xs text-muted-foreground">PO {p.purchaseOrderNumber}</p>
              )}
              {p.notes && <p className="mt-1">{p.notes}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {p.purchasedBy?.fullName ?? "Unknown"} · {formatDateTime(p.purchasedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canRecord && (
        <FormCallout title="Record purchase">
          <div className="space-y-1.5">
            <Label>Passed quotation</Label>
            <Select
              value={quotationId}
              onValueChange={(v) => {
                setQuotationId(v);
                const q = passedQuotations.find((q) => q.id === v);
                if (q) {
                  setVendorName(q.vendorName);
                  setAmount(String(q.amount));
                  setCurrency(q.currency);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the quotation that passed evaluation" />
              </SelectTrigger>
              <SelectContent>
                {passedQuotations.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.vendorName} — {q.currency} {Number(q.amount).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {passedQuotations.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No quotation has passed evaluation yet.
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>PO number</Label>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button size="sm" disabled={busy || !quotationId} onClick={recordPurchase}>
            <Receipt className="mr-1.5 size-4" />
            Record purchase
          </Button>
        </FormCallout>
      )}
    </Panel>
  );
}

function StoresPanel({
  requestId,
  status,
  canAct,
  onChanged,
}: {
  requestId: string;
  status: RequestStatus;
  canAct: boolean;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [conditionNotes, setConditionNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const receipts = useQuery({
    queryKey: ["stores-receipts", requestId],
    queryFn: () => apiGet<StoresReceiptResponse[]>(`/api/requests/${requestId}/stores-receipt`),
  });

  async function recordReceipt() {
    setBusy(true);
    try {
      await apiPost(`/api/requests/${requestId}/stores-receipt`, {
        conditionNotes: conditionNotes || undefined,
      });
      toast.success("Stores receipt recorded");
      setConditionNotes("");
      queryClient.invalidateQueries({ queryKey: ["stores-receipts", requestId] });
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record the receipt");
    } finally {
      setBusy(false);
    }
  }

  const canRecord = canAct && status === "purchased";
  if ((receipts.data ?? []).length === 0 && !canRecord) return null;

  return (
    <Panel title="Stores receipt" icon={PackageCheck}>
      {(receipts.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Not yet received into stores.</p>
      ) : (
        <ul className="space-y-3">
          {(receipts.data ?? []).map((s) => (
            <li key={s.id} className="rounded-sm border border-border p-3 text-sm">
              {s.conditionNotes && <p>{s.conditionNotes}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Received by {s.receivedBy?.fullName ?? "Unknown"} · {formatDateTime(s.receivedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canRecord && (
        <FormCallout title="Record stores receipt">
          <div className="space-y-1.5">
            <Label>Condition notes</Label>
            <Textarea
              rows={2}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="Quantity received, condition, packaging."
            />
          </div>
          <Button size="sm" disabled={busy} onClick={recordReceipt}>
            <PackageCheck className="mr-1.5 size-4" />
            Record receipt
          </Button>
        </FormCallout>
      )}
    </Panel>
  );
}

function VerificationPanel({
  requestId,
  status,
  canAct,
  canRestart,
  onChanged,
}: {
  requestId: string;
  status: RequestStatus;
  canAct: boolean;
  canRestart: boolean;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<"pass" | "needs_return" | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const verifications = useQuery({
    queryKey: ["verifications", requestId],
    queryFn: () => apiGet<VerificationResponse[]>(`/api/requests/${requestId}/verification`),
  });

  async function recordVerification() {
    if (!result) {
      toast.error("Choose pass or needs return.");
      return;
    }
    if (result === "needs_return" && !notes.trim()) {
      toast.error("Please record a reason for this outcome.");
      return;
    }
    setBusy(true);
    try {
      await apiPost(`/api/requests/${requestId}/verification`, {
        result,
        notes: notes || undefined,
      });
      toast.success("Verification recorded");
      setResult("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["verifications", requestId] });
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record the verification");
    } finally {
      setBusy(false);
    }
  }

  async function restart() {
    setBusy(true);
    try {
      await apiPost(`/api/requests/${requestId}/restart-procurement`);
      toast.success("Sent back to procurement for a new quotation cycle");
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not restart procurement");
    } finally {
      setBusy(false);
    }
  }

  const canVerify = canAct && status === "in_stores";
  if ((verifications.data ?? []).length === 0 && !canVerify && !canRestart) return null;

  return (
    <Panel title="CICT Support verification" icon={ShieldCheck}>
      {(verifications.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Not yet verified.</p>
      ) : (
        <ul className="space-y-3">
          {(verifications.data ?? []).map((v) => (
            <OutcomeCard key={v.id} result={v.result}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{v.reference}</span>
                <ResultBadge result={v.result} />
              </div>
              {v.notes && <p className="mt-1.5">{v.notes}</p>}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {v.verifiedBy?.fullName ?? "Unknown"} · {formatDateTime(v.verifiedAt)}
              </p>
            </OutcomeCard>
          ))}
        </ul>
      )}

      {canVerify && (
        <FormCallout title="Verify delivered items">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={result} onValueChange={(v) => setResult(v as "pass" | "needs_return")}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Verification outcome…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Matches specification</SelectItem>
                <SelectItem value="needs_return">Needs return</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" disabled={busy || !result} onClick={recordVerification}>
              <ShieldCheck className="mr-1.5 size-4" />
              Record verification
            </Button>
          </div>
          {result && (
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                result === "needs_return"
                  ? "Reason the item needs to be returned — required."
                  : "Notes (optional)."
              }
            />
          )}
        </FormCallout>
      )}

      {canRestart && (
        <div className="rounded-sm border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm text-warning-foreground">
            This item needs to be returned. Restarting procurement begins a new quotation cycle.
          </p>
          <Button size="sm" variant="outline" className="mt-3" disabled={busy} onClick={restart}>
            <RotateCcw className="mr-1.5 size-4" />
            Restart procurement
          </Button>
        </div>
      )}
    </Panel>
  );
}

export function ProcurementPipeline({
  requestId,
  status,
  onChanged,
}: {
  requestId: string;
  status: RequestStatus;
  onChanged: () => void;
}) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const isProcurement = hasRole("procurement") || isAdmin;
  const isStores = hasRole("stores") || isAdmin;
  const isCictSupport = hasRole("cict_support") || isAdmin;

  if (!PIPELINE_STATUSES.has(status)) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl">Procurement pipeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What happens after CICT technical approval — quotations, evaluation, purchase, stores and
          verification.
        </p>
      </div>

      <PipelineStepper status={status} />

      <QuotationsPanel
        requestId={requestId}
        status={status}
        canAct={isProcurement}
        onChanged={onChanged}
      />
      <PurchasePanel
        requestId={requestId}
        status={status}
        canAct={isProcurement}
        onChanged={onChanged}
      />
      <StoresPanel requestId={requestId} status={status} canAct={isStores} onChanged={onChanged} />
      <VerificationPanel
        requestId={requestId}
        status={status}
        canAct={isCictSupport}
        canRestart={isProcurement && status === "return_required"}
        onChanged={onChanged}
      />
    </div>
  );
}
