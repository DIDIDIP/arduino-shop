"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cartSubtotal, useCart } from "@/store/cart";
import ProductImage from "@/components/product/ProductImage";
import { FREE_SHIPPING_THRESHOLD, shippingFee, won } from "@/lib/format";

export default function CartPage() {
  const { items, setQuantity, remove, replaceAll } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 담아둔 사이 바뀐 가격/재고를 반영
    const current = useCart.getState().items;
    if (!current.length) return;
    createClient()
      .from("products")
      .select("id, price, stock, name, image_url, is_active")
      .in("id", current.map((i) => i.productId))
      .then(({ data }) => {
        if (!data) return;
        const byId = new Map(data.map((p) => [p.id, p]));
        replaceAll(
          useCart
            .getState()
            .items.filter((i) => byId.get(i.productId)?.is_active)
            .map((i) => {
              const p = byId.get(i.productId)!;
              return { ...i, price: p.price, stock: p.stock, name: p.name, imageUrl: p.image_url, quantity: Math.min(i.quantity, Math.max(p.stock, 1)) };
            }),
        );
      });
  }, [replaceAll]);

  if (!mounted) return <div className="mx-auto max-w-6xl px-4 py-10" />;

  const subtotal = cartSubtotal(items);
  const fee = shippingFee(subtotal);
  const soldOut = items.some((i) => i.stock <= 0);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-28 text-center">
        <h1 className="text-xl font-bold">장바구니가 비어 있습니다</h1>
        <p className="mt-2 text-slate-500">필요한 부품을 담아보세요.</p>
        <Link href="/products" className="btn-primary btn mt-8">쇼핑하러 가기</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">장바구니</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-4 py-5">
              <Link href={`/products/${i.slug}`} className="shrink-0">
                <ProductImage src={i.imageUrl} alt={i.name} sizes="96px" className="size-20 rounded-lg sm:size-24" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/products/${i.slug}`} className="text-sm font-medium leading-snug hover:underline">
                    {i.name}
                  </Link>
                  <button onClick={() => remove(i.productId)} className="shrink-0 text-xs text-slate-400 hover:text-rose-600">
                    삭제
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-500">{won(i.price)}</p>
                {i.stock <= 0 && <p className="mt-1 text-xs font-semibold text-rose-600">품절 — 삭제 후 주문해주세요</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button className="px-2.5 py-1" onClick={() => setQuantity(i.productId, i.quantity - 1)} aria-label="수량 감소">−</button>
                    <span className="w-8 text-center text-sm">{i.quantity}</span>
                    <button className="px-2.5 py-1" onClick={() => setQuantity(i.productId, i.quantity + 1)} aria-label="수량 증가">+</button>
                  </div>
                  <p className="font-bold">{won(i.price * i.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-6 lg:sticky lg:top-40">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">상품금액</dt>
              <dd>{won(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">배송비</dt>
              <dd>{fee ? won(fee) : "무료"}</dd>
            </div>
          </dl>
          {fee > 0 && (
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              {won(FREE_SHIPPING_THRESHOLD - subtotal)} 더 담으면 무료배송!
            </p>
          )}
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-bold">
            <span>결제예정금액</span>
            <span>{won(subtotal + fee)}</span>
          </div>
          <Link
            href="/checkout"
            aria-disabled={soldOut}
            className={`btn-primary btn mt-5 w-full py-3 ${soldOut ? "pointer-events-none opacity-50" : ""}`}
          >
            주문하기
          </Link>
        </aside>
      </div>
    </div>
  );
}
