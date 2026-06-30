/**
 * components/dashboard/OrderStatusBadge.jsx
 */

const STATUS_STYLES = {
  pending:    "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped:    "bg-violet-50 text-violet-700 border-violet-200",
  delivered:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
  paid:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded:   "bg-orange-50 text-orange-700 border-orange-200",
  failed:     "bg-red-50 text-red-700 border-red-200",
};

const STATUS_DOTS = {
  pending:    "bg-amber-500",
  processing: "bg-blue-500",
  shipped:    "bg-violet-500",
  delivered:  "bg-emerald-500",
  cancelled:  "bg-red-500",
  paid:       "bg-emerald-500",
  refunded:   "bg-orange-500",
  failed:     "bg-red-500",
};

export default function OrderStatusBadge({ status }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground border-border"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] ?? "bg-muted-foreground"}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
