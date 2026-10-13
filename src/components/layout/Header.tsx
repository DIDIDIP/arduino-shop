import Link from "next/link";
import { getUserAndProfile } from "@/lib/supabase/server";
import CartBadge from "@/components/cart/CartBadge";
import LogoutButton from "./LogoutButton";
import { SearchIcon, UserIcon } from "@/components/ui/Icons";

export default async function Header() {
  const { supabase, user, profile } = await getUserAndProfile();
  const { data: categories } = await supabase.from("categories").select("name, slug").order("sort_order");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="bg-ink text-center text-xs text-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-1.5">5만원 이상 구매 시 무료배송 · 평일 오후 2시 이전 주문 당일 출고</p>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-500 text-sm font-black text-white">A</span>
          <span className="text-lg font-extrabold tracking-tight">
            아두<span className="text-brand-500">몰</span>
          </span>
        </Link>

        <form action="/products" className="relative ml-2 hidden flex-1 md:block">
          <input name="q" placeholder="상품명 검색 (예: 우노, 초음파, 서보)" className="input pl-10" />
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </form>

        <nav className="ml-auto flex items-center gap-1">
          {profile?.role === "admin" && (
            <Link href="/admin" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50">
              관리자
            </Link>
          )}
          {user ? (
            <>
              <Link href="/mypage" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-slate-100">
                <UserIcon />
                <span className="hidden sm:inline">{profile?.name ?? "마이페이지"}</span>
              </Link>
              <LogoutButton className="hidden rounded-lg px-2.5 py-2 text-sm text-slate-500 hover:bg-slate-100 sm:block" />
            </>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-slate-100">
              <UserIcon />
              <span className="hidden sm:inline">로그인</span>
            </Link>
          )}
          <CartBadge />
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden">
        <form action="/products" className="relative">
          <input name="q" placeholder="상품명 검색" className="input pl-10" />
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </form>
      </div>

      <nav className="border-t border-slate-100">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm font-medium [scrollbar-width:none]">
          <li>
            <Link href="/products" className="block whitespace-nowrap px-3 py-2.5 hover:text-brand-600">
              전체상품
            </Link>
          </li>
          {categories?.map((c) => (
            <li key={c.slug}>
              <Link href={`/categories/${c.slug}`} className="block whitespace-nowrap px-3 py-2.5 hover:text-brand-600">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
