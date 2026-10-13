import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsBell() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const unread = useQuery({
    queryKey: ["notifications-unread", userId],
    enabled: !!userId,
    refetchInterval: 60_000,
    queryFn: async () => (await apiGet<{ count: number }>("/api/notifications/unread-count")).count,
  });

  const count = unread.data ?? 0;

  return (
    <Link
      to="/notifications"
      aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
      className="relative grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      onMouseEnter={() =>
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] })
      }
    >
      <Bell className="size-[18px]" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-card">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
