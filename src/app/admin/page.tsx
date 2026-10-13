import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, won } from "@/lib/format";
import type { Order } from "@/types";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ data: orders }, { count: productCount }, { data: lowStock }] = await Promise.all([
    supabase.from("orders").select("*").neq("status", "pending").order("created_at", { ascending: false }).returns<Order[]>(),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("id, name, stock").lte("stock", 10).order("stock"),
  ]);

  const paidOrders = (orders ?? []).filter((o) => o.status !== "cancelled");
  const revenue = paidOrders.reduce((n, o) => n + o.total_amount, 0);
  const toShip = (orders ?? []).filter((o) => o.status === "paid").length;

  const stats = [
    { label: "누적 매출", value: won(revenue) },
    { label: "결제 주문", value: `${paidOrders.length}건` },
    { label: "배송 대기", value: `${toShip}건` },
    { label: "등록 상품", value: `${productCount ?? 0}개` },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">최근 주문</h2>
            <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-brand-600">전체 →</Link>
          </div>
          <ul className="card mt-3 divide-y divide-slate-100">
            {(orders ?? []).slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.order_name}</p>
                  <p className="text-xs text-slate-500">{o.recipient} · {formatDate(o.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge status={o.status} />
                  <p className="mt-0.5 font-semibold">{won(o.total_amount)}</p>
                </div>
              </li>
            ))}
            {!orders?.length && <li className="px-5 py-10 text-center text-sm text-slate-500">주문이 없습니다.</li>}
          </ul>
        </section>

        <section>
          <h2 className="font-bold">재고 부족 (10개 이하)</h2>
          <ul className="card mt-3 divide-y divide-slate-100">
            {lowStock?.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex justify-between gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                  <span className="truncate">{p.name}</span>
                  <span className={`shrink-0 font-semibold ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>{p.stock}개</span>
                </Link>
              </li>
            ))}
            {!lowStock?.length && <li className="px-5 py-10 text-center text-sm text-slate-500">모든 상품 재고 충분</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
