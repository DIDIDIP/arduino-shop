"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/store/cart";
import { CartIcon } from "@/components/ui/Icons";

export default function CartBadge() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  return (
    <Link href="/cart" className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-slate-100">
      <CartIcon />
      <span className="hidden sm:inline">장바구니</span>
      {count > 0 && (
        <span className="absolute -top-0.5 left-6 min-w-5 rounded-full bg-brand-500 px-1.5 text-center text-[11px] font-bold leading-5 text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
