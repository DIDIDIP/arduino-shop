import Image from "next/image";

export default function ProductImage({
  src,
  alt,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          // 관리자가 임의 외부 URL을 넣은 경우 next/image 최적화 대상 도메인이 아니므로 원본 사용
          unoptimized={src.startsWith("http") && !src.includes(".supabase.co/")}
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-xs text-slate-400">이미지 준비중</div>
      )}
    </div>
  );
}
