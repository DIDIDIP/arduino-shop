import type { OrderStatus } from "@/types";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });

export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 3000;
export const shippingFee = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  shipping: "배송 중",
  delivered: "배송 완료",
  cancelled: "취소",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-teal-50 text-teal-700",
  shipping: "bg-sky-50 text-sky-700",
  delivered: "bg-slate-100 text-slate-700",
  cancelled: "bg-rose-50 text-rose-700",
};
