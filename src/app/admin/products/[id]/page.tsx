import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import type { Category, Product } from "@/types";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", Number(id)).maybeSingle<Product>(),
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">상품 수정</h1>
      <ProductForm product={product} categories={categories ?? []} />
    </div>
  );
}
