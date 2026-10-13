import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductImage from "@/components/product/ProductImage";
import ProductGrid from "@/components/product/ProductGrid";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { FREE_SHIPPING_THRESHOLD, won } from "@/lib/format";
import type { Category, Product } from "@/types";

type Params = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .maybeSingle<Product & { category: Category }>();
  return { supabase, product: data };
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const { product } = await getProduct(slug);
  return { title: product?.name ?? "상품을 찾을 수 없음", description: product?.description ?? undefined };
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const { supabase, product } = await getProduct(slug);
  if (!product) notFound();

  const { data: related } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4)
    .returns<Product[]>();

  const soldOut = product.stock <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-600">홈</Link>
        <span className="mx-2">/</span>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="aspect-square rounded-2xl"
        />

        <div>
          <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>
          <p className="mt-3 text-slate-600">{product.description}</p>
          <p className="mt-6 text-3xl font-extrabold">{won(product.price)}</p>

          <dl className="mt-6 space-y-2 border-y border-slate-200 py-5 text-sm">
            <div className="flex">
              <dt className="w-20 shrink-0 text-slate-500">배송</dt>
              <dd>3,000원 ({won(FREE_SHIPPING_THRESHOLD)} 이상 무료)</dd>
            </div>
            <div className="flex">
              <dt className="w-20 shrink-0 text-slate-500">재고</dt>
              <dd className={soldOut ? "font-semibold text-rose-600" : ""}>
                {soldOut ? "품절" : `${product.stock.toLocaleString()}개`}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            {soldOut ? (
              <button disabled className="btn-dark btn w-full py-3">품절된 상품입니다</button>
            ) : (
              <AddToCartButton product={product} />
            )}
          </div>

          {product.specs.length > 0 && (
            <div className="mt-8">
              <h2 className="font-semibold">주요 사양</h2>
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                {product.specs.map((s) => {
                  const [k, ...rest] = s.split(":");
                  return rest.length ? (
                    <li key={s} className="flex px-4 py-2.5">
                      <span className="w-28 shrink-0 text-slate-500">{k.trim()}</span>
                      <span>{rest.join(":").trim()}</span>
                    </li>
                  ) : (
                    <li key={s} className="px-4 py-2.5">{s}</li>
                  );
                })}
              </ul>
            </div>
          )}

          {product.source_url && (
            <p className="mt-4 text-xs text-slate-400">
              가격·사양 참고:{" "}
              <a href={product.source_url} target="_blank" rel="noreferrer" className="underline">
                디바이스마트
              </a>
            </p>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold">같은 카테고리 상품</h2>
          <div className="mt-5">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
