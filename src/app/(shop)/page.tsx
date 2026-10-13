import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/product/ProductGrid";
import ProductImage from "@/components/product/ProductImage";
import { ChipIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";
import type { Category, Product } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: boards }, { data: popular }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").returns<Category[]>(),
    supabase
      .from("products")
      .select("*, categories!inner(slug)")
      .eq("categories.slug", "boards")
      .order("id")
      .limit(4)
      .returns<Product[]>(),
    supabase
      .from("products")
      .select("*")
      .in("slug", ["hc-sr04", "dht11", "sg90", "lcd-1602-i2c", "l298n", "oled-096", "breadboard-830", "jumper-wire-mm"])
      .returns<Product[]>(),
  ]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-sm font-semibold tracking-wide text-brand-100">ARDUINO · SENSORS · MODULES</p>
          <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            아이디어를 회로로,
            <br />
            오늘 주문하고 내일 만드세요
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            정품 아두이노 보드부터 센서·모듈·기본 부품까지, 메이커에게 필요한 부품을 한 곳에서.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/categories/boards" className="btn-primary btn px-6 py-3">
              아두이노 보드 보기
            </Link>
            <Link href="/categories/kits" className="btn border border-white/30 px-6 py-3 text-white hover:bg-white/10">
              입문 키트
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-slate-200 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: <TruckIcon />, title: "5만원 이상 무료배송", desc: "오후 2시 이전 주문 당일 출고" },
            { icon: <ShieldIcon />, title: "정품 보드 취급", desc: "이탈리아 정품 아두이노" },
            { icon: <ChipIcon />, title: "부품 하나도 소량 구매", desc: "필요한 만큼만 담으세요" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3 py-5 sm:justify-center">
              <span className="text-brand-500">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <h2 className="text-xl font-bold">카테고리</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories?.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="group relative overflow-hidden rounded-xl">
              <ProductImage
                src={c.image_url ?? "/images/products/starter-kit.jpg"}
                alt={c.name}
                sizes="(max-width: 640px) 50vw, 16vw"
                className="aspect-[4/3] transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-2.5 left-3 text-sm font-semibold text-white">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">아두이노 보드</h2>
          <Link href="/categories/boards" className="text-sm text-slate-500 hover:text-brand-600">
            전체보기 →
          </Link>
        </div>
        <div className="mt-5">
          <ProductGrid products={boards ?? []} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">많이 찾는 부품</h2>
          <Link href="/products" className="text-sm text-slate-500 hover:text-brand-600">
            전체상품 →
          </Link>
        </div>
        <div className="mt-5">
          <ProductGrid products={popular ?? []} />
        </div>
      </section>
    </>
  );
}
