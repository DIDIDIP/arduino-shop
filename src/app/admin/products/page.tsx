import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductImage from "@/components/product/ProductImage";
import { won } from "@/lib/format";
import type { Category, Product } from "@/types";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("category_id")
    .order("id")
    .returns<(Product & { category: Pick<Category, "name"> })[]>();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">상품 관리 <span className="text-slate-400">{products?.length ?? 0}</span></h1>
        <Link href="/admin/products/new" className="btn-primary btn">+ 상품 등록</Link>
      </div>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">상품</th>
              <th className="px-4 py-3 font-medium">카테고리</th>
              <th className="px-4 py-3 text-right font-medium">가격</th>
              <th className="px-4 py-3 text-right font-medium">재고</th>
              <th className="px-4 py-3 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products?.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <ProductImage src={p.image_url} alt="" sizes="40px" className="size-10 shrink-0 rounded-md" />
                    <span className="font-medium hover:underline">{p.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category?.name}</td>
                <td className="px-4 py-3 text-right">{won(p.price)}</td>
                <td className={`px-4 py-3 text-right ${p.stock <= 10 ? "font-semibold text-amber-600" : ""}`}>{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.is_active ? "판매중" : "숨김"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
