"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { createClient } from "@/lib/supabase/client";
import { cartSubtotal, useCart } from "@/store/cart";
import { shippingFee, won } from "@/lib/format";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export default function CheckoutForm({
  userId,
  email,
  defaultName,
  defaultPhone,
}: {
  userId: string;
  email: string;
  defaultName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const rendered = useRef(false);

  const subtotal = cartSubtotal(items);
  const fee = shippingFee(subtotal);
  const total = subtotal + fee;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !items.length) router.replace("/cart");
  }, [mounted, items.length, router]);

  useEffect(() => {
    loadTossPayments(CLIENT_KEY).then((toss) => setWidgets(toss.widgets({ customerKey: userId })));
  }, [userId]);

  useEffect(() => {
    if (!widgets || !mounted || total <= 0) return;
    if (rendered.current) {
      widgets.setAmount({ currency: "KRW", value: total });
      return;
    }
    rendered.current = true;
    (async () => {
      await widgets.setAmount({ currency: "KRW", value: total });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]);
      setReady(true);
    })();
  }, [widgets, mounted, total]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!widgets) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    // 주문은 서버(DB 함수)에서 DB 가격으로 금액을 다시 계산해 생성
    const { data: orderId, error: orderError } = await supabase.rpc("create_order", {
      p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      p_recipient: String(form.get("recipient")),
      p_phone: String(form.get("phone")),
      p_address: `${form.get("address")} ${form.get("addressDetail") ?? ""}`.trim(),
      p_memo: String(form.get("memo") ?? "") || null,
    });
    if (orderError || !orderId) {
      setError(orderError?.message.includes("out of stock") ? "재고가 부족한 상품이 있습니다." : "주문 생성에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    const { data: order } = await supabase.from("orders").select("order_name, total_amount").eq("id", orderId).single();
    if (!order) {
      setError("주문 정보를 불러오지 못했습니다.");
      setSubmitting(false);
      return;
    }

    try {
      await widgets.setAmount({ currency: "KRW", value: order.total_amount });
      await widgets.requestPayment({
        orderId,
        orderName: order.order_name,
        customerEmail: email,
        customerName: String(form.get("recipient")),
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (err) {
      // 사용자가 결제창을 닫은 경우 등
      setError(err instanceof Error ? err.message : "결제가 취소되었습니다.");
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="card p-6">
          <h2 className="font-bold">배송 정보</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="recipient">받는 분</label>
              <input id="recipient" name="recipient" required defaultValue={defaultName} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="phone">연락처</label>
              <input id="phone" name="phone" required defaultValue={defaultPhone} placeholder="010-0000-0000" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">주소</label>
              <input id="address" name="address" required placeholder="도로명 주소" className="input" />
            </div>
            <div className="sm:col-span-2">
              <input name="addressDetail" placeholder="상세 주소 (동/호수)" className="input" aria-label="상세 주소" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="memo">배송 메모</label>
              <input id="memo" name="memo" placeholder="예: 문 앞에 놓아주세요" className="input" />
            </div>
          </div>
        </section>

        <section className="card overflow-hidden p-2">
          <h2 className="px-4 pt-4 font-bold">결제 수단</h2>
          <p className="px-4 pt-1 text-xs text-slate-500">토스페이먼츠 테스트 환경 — 실제로 결제되지 않습니다.</p>
          <div id="payment-method" />
          <div id="agreement" />
        </section>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-40">
        <h2 className="font-bold">주문 상품 {items.length}종</h2>
        <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span className="line-clamp-1 text-slate-600">
                {i.name} × {i.quantity}
              </span>
              <span className="shrink-0">{won(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">상품금액</dt>
            <dd>{won(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">배송비</dt>
            <dd>{fee ? won(fee) : "무료"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-bold">
          <span>최종 결제금액</span>
          <span className="text-brand-600">{won(total)}</span>
        </div>
        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={!ready || submitting} className="btn-primary btn mt-5 w-full py-3.5 text-base">
          {submitting ? "처리 중..." : `${won(total)} 결제하기`}
        </button>
      </aside>
    </form>
  );
}
