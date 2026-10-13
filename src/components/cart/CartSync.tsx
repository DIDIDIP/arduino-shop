"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart, type CartItem } from "@/store/cart";

type DbRow = {
  product_id: number;
  quantity: number;
  products: { slug: string; name: string; price: number; image_url: string | null; stock: number } | null;
};

/**
 * 비로그인 장바구니는 localStorage에만 저장하고,
 * 로그인하면 로컬 장바구니와 DB 장바구니를 합친 뒤 이후 변경사항을 DB에 반영한다.
 */
export default function CartSync() {
  const userId = useRef<string | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function mergeFromDb(uid: string) {
      syncing.current = true;
      const { data } = await supabase
        .from("cart_items")
        .select("product_id, quantity, products(slug, name, price, image_url, stock)")
        .eq("user_id", uid)
        .returns<DbRow[]>();

      const merged = new Map<number, CartItem>();
      for (const row of data ?? []) {
        if (!row.products) continue;
        merged.set(row.product_id, {
          productId: row.product_id,
          slug: row.products.slug,
          name: row.products.name,
          price: row.products.price,
          imageUrl: row.products.image_url,
          stock: row.products.stock,
          quantity: row.quantity,
        });
      }
      for (const item of useCart.getState().items) {
        const existing = merged.get(item.productId);
        merged.set(item.productId, existing ? { ...existing, quantity: Math.max(existing.quantity, item.quantity) } : item);
      }
      const items = [...merged.values()];
      useCart.getState().replaceAll(items);
      await pushToDb(uid, items);
      syncing.current = false;
    }

    async function pushToDb(uid: string, items: CartItem[]) {
      await supabase.from("cart_items").delete().eq("user_id", uid);
      if (items.length) {
        await supabase
          .from("cart_items")
          .insert(items.map((i) => ({ user_id: uid, product_id: i.productId, quantity: i.quantity })));
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user.id ?? null;
      if (uid && uid !== userId.current) {
        userId.current = uid;
        // onAuthStateChange 콜백 안에서 supabase 호출을 await하면 교착될 수 있어 다음 틱으로 미룸
        setTimeout(() => mergeFromDb(uid), 0);
      } else if (!uid && userId.current) {
        userId.current = null;
        if (event === "SIGNED_OUT") useCart.getState().clear();
      }
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useCart.subscribe((state, prev) => {
      if (!userId.current || syncing.current || state.items === prev.items) return;
      clearTimeout(timer);
      const uid = userId.current;
      timer = setTimeout(() => pushToDb(uid, useCart.getState().items), 400);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
