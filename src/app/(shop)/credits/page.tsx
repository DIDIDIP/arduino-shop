import { readFile } from "node:fs/promises";
import path from "node:path";

export const metadata = { title: "이미지 출처" };

type Credit = { file: string; title: string; author: string; license: string; source_url: string };

export default async function CreditsPage() {
  const credits: Credit[] = JSON.parse(
    await readFile(path.join(process.cwd(), "public/images/credits.json"), "utf8").catch(() => "[]"),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold">이미지 출처 및 라이선스</h1>
      <p className="mt-2 text-sm text-slate-500">
        이 사이트의 상품 사진은 자유 라이선스로 공개된 이미지를 사용했습니다. 실제 판매 상품의 사진과 다를 수 있습니다.
      </p>
      <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200 text-sm">
        {credits.map((c) => (
          <li key={c.file} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <span className="w-56 shrink-0 font-mono text-xs text-slate-500">{c.file}</span>
            <span className="min-w-0">
              <a href={c.source_url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                {c.title}
              </a>
              <span className="text-slate-500"> · {c.author} · {c.license}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
