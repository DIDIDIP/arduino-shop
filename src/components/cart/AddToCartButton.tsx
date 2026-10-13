"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { useCart } from "@/store/cart";

export default function AddToCartButton({ product, compact = false }: { product: Product; compact?: boolean }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const item = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.image_url,
    stock: product.stock,
  };

  function handleAdd() {
    add(item, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (compact) {
    return (
      <button onClick={handleAdd} className="btn-outline btn w-full py-2">
        {added ? "담았어요 ✓" : "장바구니 담기"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">수량</span>
        <div className="flex items-center rounded-lg border border-slate-300">
          <button className="px-3 py-2 text-lg leading-none" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="수량 감소">
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{qty}</span>
          <button
            className="px-3 py-2 text-lg leading-none"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            aria-label="수량 증가"
          >
            +
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleAdd} className="btn-outline btn py-3">
          {added ? "담았어요 ✓" : "장바구니"}
        </button>
        <button
          onClick={() => {
            add(item, qty);
            router.push("/cart");
          }}
          className="btn-primary btn py-3"
        >
          바로 구매
        </button>
      </div>
    </div>
  );
}
