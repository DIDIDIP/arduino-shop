"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/store/cart";
import { won } from "@/lib/format";

function SuccessContent() {
  const params = useSearchParams();
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount"));
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    if (!paymentKey || !orderId || !amount) {
      setState("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }
    createClient()
      .functions.invoke("payments-confirm", { body: { paymentKey, orderId, amount } })
      .then(async ({ error }) => {
        if (error) {
          const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
          setState("error");
          setMessage(body?.message ?? "결제 승인에 실패했습니다.");
          return;
        }
        useCart.getState().clear();
        setState("done");
      });
  }, [paymentKey, orderId, amount]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      {state === "loading" && (
        <>
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
          <p className="mt-6 font-semibold">결제를 승인하고 있습니다...</p>
        </>
      )}
      {state === "done" && (
        <>
          <p className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-2xl text-brand-600">✓</p>
          <h1 className="mt-5 text-2xl font-bold">주문이 완료되었습니다</h1>
          <p className="mt-2 text-slate-500">결제금액 {won(amount)}</p>
          <div className="mt-8 flex justify-center gap-2">
            <Link href={`/mypage/orders/${orderId}`} className="btn-primary btn">주문 상세 보기</Link>
            <Link href="/" className="btn-outline btn">쇼핑 계속하기</Link>
          </div>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-2xl font-bold">결제에 실패했습니다</h1>
          <p className="mt-2 text-slate-500">{message}</p>
          <Link href="/cart" className="btn-primary btn mt-8">장바구니로 돌아가기</Link>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
