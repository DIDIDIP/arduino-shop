import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/product/ProductGrid";
import type { Category, Product } from "@/types";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("name").eq("slug", slug).maybeSingle();
  return { title: data?.name ?? "카테고리" };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle<Category>();
  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", category.id)
    .order("id")
    .returns<Product[]>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      {category.description && <p className="mt-1 text-slate-500">{category.description}</p>}
      <p className="mt-4 text-sm text-slate-500">총 {products?.length ?? 0}개</p>
      <div className="mt-6">
        <ProductGrid products={products ?? []} />
      </div>
    </div>
  );
}
