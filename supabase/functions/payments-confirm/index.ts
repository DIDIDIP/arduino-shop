import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// 토스페이먼츠 결제위젯 공개 테스트 시크릿 키 (문서용). 실서비스에서는 TOSS_SECRET_KEY 시크릿을 설정할 것.
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") ?? "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return json({ message: "로그인이 필요합니다." }, 401);

  const { paymentKey, orderId, amount } = await req.json().catch(() => ({}));
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return json({ message: "잘못된 요청입니다." }, 400);
  }

  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status, total_amount, payment_key")
    .eq("id", orderId)
    .single();

  if (!order || order.user_id !== user.id) return json({ message: "주문을 찾을 수 없습니다." }, 404);
  // 새로고침 등으로 중복 호출된 경우
  if (order.status !== "pending") {
    return order.payment_key === paymentKey
      ? json({ ok: true, orderId })
      : json({ message: "이미 처리된 주문입니다." }, 409);
  }
  if (order.total_amount !== amount) return json({ message: "결제 금액이 주문 금액과 다릅니다." }, 400);

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${TOSS_SECRET_KEY}:`),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const tossBody = await tossRes.json();
  if (!tossRes.ok) {
    return json({ message: tossBody.message ?? "결제 승인에 실패했습니다.", code: tossBody.code }, 400);
  }

  const { error } = await admin.rpc("finalize_order_paid", {
    p_order_id: orderId,
    p_payment_key: paymentKey,
  });
  if (error) return json({ message: error.message }, 500);

  return json({ ok: true, orderId, method: tossBody.method });
});
