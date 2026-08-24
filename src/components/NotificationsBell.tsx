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
      className="relative ml-2 rounded-sm p-2 transition-colors hover:bg-primary-foreground/10"
      onMouseEnter={() =>
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] })
      }
    >
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
