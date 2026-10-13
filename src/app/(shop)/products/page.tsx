import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/product/ProductGrid";
import SortSelect from "@/components/product/SortSelect";
import type { Category, Product } from "@/types";

export const metadata = { title: "전체상품" };

const SORTS = {
  new: { label: "기본순", column: "id", ascending: true },
  "price-asc": { label: "낮은 가격순", column: "price", ascending: true },
  "price-desc": { label: "높은 가격순", column: "price", ascending: false },
} as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q = "", sort = "new" } = await searchParams;
  const order = SORTS[sort as keyof typeof SORTS] ?? SORTS.new;

  const supabase = await createClient();
  let query = supabase.from("products").select("*").order(order.column, { ascending: order.ascending });
  const keyword = q.trim();
  if (keyword) {
    const escaped = keyword.replace(/[%_,()]/g, " ");
    query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  const [{ data: products }, { data: categories }] = await Promise.all([
    query.returns<Product[]>(),
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{keyword ? `'${keyword}' 검색 결과` : "전체상품"}</h1>
          <p className="mt-1 text-sm text-slate-500">총 {products?.length ?? 0}개</p>
        </div>
        <SortSelect value={sort} options={Object.entries(SORTS).map(([k, v]) => ({ value: k, label: v.label }))} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {categories?.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="rounded-full border border-slate-300 px-3.5 py-1.5 text-sm hover:border-brand-500 hover:text-brand-600"
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <ProductGrid products={products ?? []} />
      </div>
    </div>
  );
}
