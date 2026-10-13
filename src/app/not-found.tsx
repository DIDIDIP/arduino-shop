import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="text-5xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-slate-500">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link href="/" className="btn-primary btn mt-8">홈으로</Link>
    </div>
  );
}
