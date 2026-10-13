import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import type { DelegationResponse, UserResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/domain";

export function DelegationPanel() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [delegate, setDelegate] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");

  const staff = useQuery({
    queryKey: ["delegation-staff"],
    queryFn: async () => {
      const all = await apiGet<UserResponse[]>("/api/users");
      return all.filter((p) => p.id !== userId);
    },
  });

  const mine = useQuery({
    queryKey: ["delegations", userId],
    enabled: !!userId,
    queryFn: () => apiGet<DelegationResponse[]>("/api/delegations"),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!delegate) throw new ApiError(0, "Choose a member of staff to act for you.");
      await apiPost("/api/delegations", {
        delegateId: delegate,
        reason: reason.trim() || undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      toast.success("Delegation created");
      setDelegate("");
      setEndsAt("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["delegations", userId] });
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not delegate"),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiPost(`/api/delegations/${id}/deactivate`),
    onSuccess: () => {
      toast.success("Delegation revoked");
      queryClient.invalidateQueries({ queryKey: ["delegations", userId] });
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not revoke"),
  });

  const outgoing = (mine.data ?? []).filter((d) => d.delegator.id === userId);
  const incoming = (mine.data ?? []).filter((d) => d.delegate.id === userId);

  return (
    <div className="space-y-5 surface p-6">
      <div>
        <h2 className="font-display text-lg">Delegation of authority</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nominate another member of staff to view and act on the approvals routed to you while you
          are away. Delegations are recorded and can be revoked at any time.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label-caps mb-1.5 block">Delegate to</label>
          <Select value={delegate} onValueChange={setDelegate}>
            <SelectTrigger>
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {(staff.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName?.trim() || s.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">Ends on (optional)</label>
          <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">Reason (optional)</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Annual leave, official travel…"
          />
        </div>
      </div>
      <Button onClick={() => create.mutate()} disabled={create.isPending || !delegate}>
        <UserCheck className="mr-2 size-4" />
        {create.isPending ? "Saving…" : "Delegate authority"}
      </Button>

      <div className="space-y-3 border-t border-border pt-5">
        <p className="label-caps">Authority I have delegated</p>
        {outgoing.length === 0 && (
          <p className="text-sm text-muted-foreground">No active or past delegations.</p>
        )}
        {outgoing.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-sm"
          >
            <span>
              {d.delegate.fullName || d.delegate.email} · {d.active ? "Active" : "Revoked"}
              {d.endsAt ? ` · until ${formatDate(d.endsAt)}` : ""}
              {d.reason ? ` · ${d.reason}` : ""}
            </span>
            {d.active && (
              <Button variant="ghost" size="sm" onClick={() => revoke.mutate(d.id)}>
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>

      {incoming.length > 0 && (
        <div className="space-y-2 border-t border-border pt-5">
          <p className="label-caps">Authority delegated to me</p>
          {incoming.map((d) => (
            <p key={d.id} className="text-sm">
              {d.delegator.fullName || d.delegator.email} · {d.active ? "Active" : "Ended"}
              {d.endsAt ? ` · until ${formatDate(d.endsAt)}` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
