import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/types";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order").returns<Category[]>();
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">상품 등록</h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
