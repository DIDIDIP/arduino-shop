import { createClient } from "@/lib/supabase/server";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { formatDate, won } from "@/lib/format";
import type { Order, OrderItem } from "@/types";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<(Order & { order_items: OrderItem[] })[]>();

  return (
    <div>
      <h1 className="text-xl font-bold">주문 관리 <span className="text-slate-400">{orders?.length ?? 0}</span></h1>
      <p className="mt-1 text-sm text-slate-500">결제가 완료된 주문만 표시됩니다.</p>
      <ul className="mt-5 space-y-3">
        {orders?.map((o) => (
          <li key={o.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  {formatDate(o.created_at)} · <span className="font-mono">{o.id.slice(0, 8)}</span>
                </p>
                <p className="mt-1 font-semibold">{o.order_name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {o.recipient} · {o.phone} · {o.address}
                  {o.memo && <span className="text-slate-400"> ({o.memo})</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold">{won(o.total_amount)}</p>
                <OrderStatusSelect orderId={o.id} status={o.status} />
              </div>
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-500">상품 {o.order_items.length}종 보기</summary>
              <ul className="mt-2 space-y-1 text-slate-600">
                {o.order_items.map((i) => (
                  <li key={i.id}>
                    {i.product_name} × {i.quantity} — {won(i.unit_price * i.quantity)}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
        {!orders?.length && <li className="card p-10 text-center text-slate-500">주문이 없습니다.</li>}
      </ul>
    </div>
  );
}
