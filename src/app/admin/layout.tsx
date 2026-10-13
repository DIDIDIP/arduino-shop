import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";

export const metadata = { title: "관리자" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login?next=/admin");
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <span className="mr-3 rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">ADMIN</span>
        {[
          { href: "/admin", label: "대시보드" },
          { href: "/admin/products", label: "상품 관리" },
          { href: "/admin/orders", label: "주문 관리" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-slate-100">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
