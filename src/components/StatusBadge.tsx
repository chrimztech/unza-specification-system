import { STATUS_LABEL, statusTone, type RequestStatus } from "@/lib/domain";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(status)}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
