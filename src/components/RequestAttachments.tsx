import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Paperclip, Download, Trash2 } from "lucide-react";
import { apiDelete, apiDownload, apiGet, apiUpload, ApiError } from "@/lib/api-client";
import type { RequestAttachmentResponse } from "@/lib/api-types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/domain";

const MAX_BYTES = 10 * 1024 * 1024;

function humanSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function RequestAttachments({ requestId }: { requestId: string }) {
  const { userId, isCict } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const attachments = useQuery({
    queryKey: ["request-attachments", requestId],
    queryFn: () => apiGet<RequestAttachmentResponse[]>(`/api/requests/${requestId}/attachments`),
  });

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Files must be 10 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      await apiUpload(`/api/requests/${requestId}/attachments`, form);
      toast.success("Document attached");
      queryClient.invalidateQueries({ queryKey: ["request-attachments", requestId] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function download(id: string, name: string) {
    try {
      const { blob, filename } = await apiDownload(`/api/attachments/${id}/download`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename ?? name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not open the document.");
    }
  }

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/attachments/${id}`),
    onSuccess: () => {
      toast.success("Document removed");
      queryClient.invalidateQueries({ queryKey: ["request-attachments", requestId] });
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not remove"),
  });

  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg">Supporting documents</h2>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="mr-2 size-4" />
            {uploading ? "Uploading…" : "Attach document"}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Quotations, memoranda, asset photographs or approval correspondence. Maximum 10 MB per file.
      </p>

      <ul className="mt-3 divide-y divide-border">
        {(attachments.data ?? []).length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">No documents attached.</li>
        )}
        {(attachments.data ?? []).map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {humanSize(a.sizeBytes)} · {formatDateTime(a.createdAt)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void download(a.id, a.fileName)}>
              <Download className="mr-1.5 size-4" />
              Open
            </Button>
            {(a.uploadedById === userId || isCict) && (
              <Button
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`Remove "${a.fileName}"? This cannot be undone.`)) remove.mutate(a.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
