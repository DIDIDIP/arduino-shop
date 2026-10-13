import Link from "next/link";

export default async function CheckoutFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">결제가 완료되지 않았습니다</h1>
      <p className="mt-2 text-slate-500">{message ?? "결제가 취소되었거나 오류가 발생했습니다."}</p>
      <div className="mt-8 flex justify-center gap-2">
        <Link href="/checkout" className="btn-primary btn">다시 결제하기</Link>
        <Link href="/cart" className="btn-outline btn">장바구니</Link>
      </div>
    </div>
  );
}
