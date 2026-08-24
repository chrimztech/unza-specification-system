import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import type { NotificationResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · UNZA CICT Specification System" },
      {
        name: "description",
        content:
          "In-app notices for equipment request submissions, manager approvals, CICT decisions and clarification requests.",
      },
      { property: "og:title", content: "Notifications · UNZA CICT" },
      {
        property: "og:description",
        content: "Your workflow notices across the UNZA CICT equipment specification system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: () => apiGet<NotificationResponse[]>("/api/notifications"),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] });
  }

  async function markAll() {
    try {
      await apiPost("/api/notifications/read-all");
      toast.success("All notices marked as read");
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update notifications");
    }
  }

  async function markOne(id: string) {
    try {
      await apiPost(`/api/notifications/${id}/read`);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not mark this notice as read");
    }
  }

  const rows = list.data ?? [];
  const unread = rows.filter((r) => !r.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread notice${unread === 1 ? "" : "s"}` : "You are up to date."}
          </p>
        </div>
        <Button variant="outline" onClick={markAll} disabled={unread === 0}>
          <CheckCheck className="mr-2 size-4" />
          Mark all read
        </Button>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card shadow-panel">
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet. You will be notified when a request needs your attention.
          </li>
        )}
        {rows.map((n) => (
          <li
            key={n.id}
            className={`flex flex-wrap items-start gap-3 px-4 py-3 ${n.readAt ? "" : "bg-secondary/40"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium capitalize">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {n.requestId && (
                <Button variant="ghost" size="sm" asChild onClick={() => void markOne(n.id)}>
                  <Link to="/requests/$id" params={{ id: n.requestId }}>
                    Open request
                  </Link>
                </Button>
              )}
              {!n.readAt && (
                <Button variant="ghost" size="sm" onClick={() => void markOne(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
