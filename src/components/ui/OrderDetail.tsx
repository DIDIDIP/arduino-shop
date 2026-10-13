import StatusBadge from "./StatusBadge";
import { formatDate, won } from "@/lib/format";
import type { Order, OrderItem } from "@/types";

export default function OrderDetail({ order, items }: { order: Order; items: OrderItem[] }) {
  const subtotal = order.total_amount - order.shipping_fee;
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">주문번호</p>
            <p className="font-mono text-sm">{order.id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          주문일시 {formatDate(order.created_at)}
          {order.paid_at && ` · 결제 ${formatDate(order.paid_at)}`}
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold">주문 상품</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3">
              <span>
                {i.product_name} <span className="text-slate-400">× {i.quantity}</span>
              </span>
              <span className="shrink-0">{won(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">상품금액</dt>
            <dd>{won(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">배송비</dt>
            <dd>{order.shipping_fee ? won(order.shipping_fee) : "무료"}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold">
            <dt>총 결제금액</dt>
            <dd>{won(order.total_amount)}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6 text-sm">
        <h2 className="font-bold">배송 정보</h2>
        <dl className="mt-3 space-y-1.5">
          <div className="flex"><dt className="w-20 text-slate-500">받는 분</dt><dd>{order.recipient}</dd></div>
          <div className="flex"><dt className="w-20 text-slate-500">연락처</dt><dd>{order.phone}</dd></div>
          <div className="flex"><dt className="w-20 shrink-0 text-slate-500">주소</dt><dd>{order.address}</dd></div>
          {order.memo && <div className="flex"><dt className="w-20 text-slate-500">메모</dt><dd>{order.memo}</dd></div>}
        </dl>
      </div>
    </div>
  );
}
