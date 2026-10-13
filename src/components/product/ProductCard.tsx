import Link from "next/link";
import type { Product } from "@/types";
import { won } from "@/lib/format";
import ProductImage from "./ProductImage";
import AddToCartButton from "@/components/cart/AddToCartButton";

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  return (
    <div className="group flex flex-col">
      <Link href={`/products/${product.slug}`} className="block">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-square rounded-xl transition group-hover:opacity-90"
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
          {product.name}
        </Link>
        <p className="mt-1.5 text-base font-bold">{won(product.price)}</p>
        <div className="mt-3">
          {soldOut ? (
            <p className="text-sm font-medium text-rose-600">품절</p>
          ) : (
            <AddToCartButton product={product} compact />
          )}
        </div>
      </div>
    </div>
  );
}
