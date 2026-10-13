import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import StatusBadge from "@/components/ui/StatusBadge";
import ProfileForm from "@/components/layout/ProfileForm";
import LogoutButton from "@/components/layout/LogoutButton";
import { formatDate, won } from "@/lib/format";
import type { Order } from "@/types";

export const metadata = { title: "마이페이지" };

export default async function MyPage() {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/mypage");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <LogoutButton className="text-sm text-slate-500 hover:text-ink" />
      </div>

      <section className="card mt-6 p-6">
        <h2 className="font-bold">내 정보</h2>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <ProfileForm userId={user.id} name={profile?.name ?? ""} phone={profile?.phone ?? ""} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">주문 내역</h2>
        {!orders?.length ? (
          <p className="card mt-4 p-10 text-center text-slate-500">아직 주문 내역이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/mypage/orders/${o.id}`} className="card flex items-center justify-between gap-4 p-5 hover:border-brand-500">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{formatDate(o.created_at)}</p>
                    <p className="mt-1 truncate font-semibold">{o.order_name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={o.status} />
                    <p className="mt-1 font-bold">{won(o.total_amount)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
