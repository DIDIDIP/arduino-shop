import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderDetail from "@/components/ui/OrderDetail";
import type { Order, OrderItem } from "@/types";

export const metadata = { title: "주문 상세" };

export default async function MyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // RLS가 본인 주문만 반환
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle<Order>();
  if (!order) notFound();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id).returns<OrderItem[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/mypage" className="text-sm text-slate-500 hover:text-brand-600">← 마이페이지</Link>
      <h1 className="mt-3 text-2xl font-bold">주문 상세</h1>
      <div className="mt-6">
        <OrderDetail order={order} items={items ?? []} />
      </div>
    </div>
  );
}
