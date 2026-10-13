"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductImage from "@/components/product/ProductImage";
import type { Category, Product } from "@/types";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `item-${Date.now()}`;

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    const supabase = createClient();
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) setError(`업로드 실패: ${error.message}`);
    else setImageUrl(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name"));
    const payload = {
      name,
      slug: String(form.get("slug") || slugify(name)),
      category_id: Number(form.get("category_id")),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      description: String(form.get("description") ?? ""),
      specs: String(form.get("specs") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      image_url: imageUrl || null,
      source_url: String(form.get("source_url") ?? "") || null,
      is_active: form.get("is_active") === "on",
    };

    const supabase = createClient();
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) return setError(error.code === "23505" ? "이미 사용 중인 슬러그입니다." : error.message);
    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!product) return;
    setSaving(true);
    const { error } = await createClient().from("products").delete().eq("id", product.id);
    setSaving(false);
    if (error) {
      setError("주문 이력이 있는 상품은 삭제 대신 '판매중' 체크를 해제해 숨겨주세요.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div>
        <ProductImage src={imageUrl || null} alt="" sizes="280px" className="aspect-square rounded-xl" />
        <label className="btn-outline btn mt-3 w-full cursor-pointer">
          {uploading ? "업로드 중..." : "이미지 업로드"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="또는 이미지 경로/URL"
          className="input mt-2 text-xs"
          aria-label="이미지 URL"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="name">상품명</label>
          <input id="name" name="name" required defaultValue={product?.name} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category_id">카테고리</label>
            <select id="category_id" name="category_id" defaultValue={product?.category_id} className="input">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="slug">슬러그 (URL)</label>
            <input id="slug" name="slug" defaultValue={product?.slug} placeholder="비우면 자동 생성" pattern="[a-z0-9-]+" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="price">가격 (원)</label>
            <input id="price" name="price" type="number" min={0} required defaultValue={product?.price} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="stock">재고</label>
            <input id="stock" name="stock" type="number" min={0} required defaultValue={product?.stock ?? 0} className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">설명</label>
          <textarea id="description" name="description" rows={2} defaultValue={product?.description ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="specs">주요 사양 (한 줄에 하나, 예: 동작전압: 5V)</label>
          <textarea id="specs" name="specs" rows={4} defaultValue={product?.specs.join("\n")} className="input font-mono text-xs" />
        </div>
        <div>
          <label className="label" htmlFor="source_url">참고 링크</label>
          <input id="source_url" name="source_url" type="url" defaultValue={product?.source_url ?? ""} className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="size-4 accent-brand-500" />
          판매중 (해제하면 쇼핑몰에서 숨김)
        </label>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving || uploading} className="btn-primary btn px-6">
            {saving ? "저장 중..." : product ? "수정 저장" : "등록"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline btn">취소</button>
          {product && (
            <button type="button" onClick={handleDelete} disabled={saving} className="btn ml-auto text-rose-600 hover:bg-rose-50">
              삭제
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
