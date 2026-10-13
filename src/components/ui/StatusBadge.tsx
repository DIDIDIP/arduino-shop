import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from "@/lib/format";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_STYLE[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
