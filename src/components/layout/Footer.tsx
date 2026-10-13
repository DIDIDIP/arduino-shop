import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-slate-600 sm:grid-cols-3">
        <div>
          <p className="text-base font-extrabold text-ink">
            아두<span className="text-brand-500">몰</span>
          </p>
          <p className="mt-2 leading-relaxed">
            아두이노 보드부터 센서, 모듈, 부품까지.
            <br />
            메이커를 위한 전자부품 쇼핑몰
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">고객센터</p>
          <p className="mt-2">평일 10:00 – 17:00 (점심 12:00 – 13:00)</p>
          <p>주말·공휴일 휴무</p>
        </div>
        <div>
          <p className="font-semibold text-ink">안내</p>
          <ul className="mt-2 space-y-1">
            <li>본 사이트는 학습용 데모이며 실제로 판매하지 않습니다.</li>
            <li>가격 정보는 디바이스마트 기준 참고가입니다.</li>
            <li>
              <Link href="/credits" className="underline hover:text-brand-600">
                이미지 출처 및 라이선스
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">© 2026 ArduMall Demo</p>
    </footer>
  );
}
