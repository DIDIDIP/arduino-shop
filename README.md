# 아두몰 (ArduMall) — 아두이노 쇼핑몰 데모

Next.js 15 + Supabase + 토스페이먼츠(테스트)로 만든 아두이노/전자부품 쇼핑몰입니다.
상품 가격·사양은 디바이스마트 기준(2026-10 조회), 상품 사진은 자유 라이선스 이미지입니다(`/credits` 참고).

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local`에 Supabase URL/퍼블리셔블 키와 토스 테스트 클라이언트 키가 들어 있습니다(`.env.example` 참고).

## 데모 계정

| 역할 | 이메일 | 비밀번호 |
|---|---|---|
| 일반 회원 | customer@ardumall.dev | test1234! |

관리자 계정은 공개하지 않습니다. 관리자 권한은 Supabase에서 `profiles.role`을 `admin`으로 지정해 부여합니다.

새로 회원가입하면 Supabase가 인증 메일을 보냅니다(무료 플랜은 시간당 발송 수 제한이 있음).

## 결제 테스트

토스페이먼츠 **공개 테스트 키**를 사용하므로 실제 돈이 나가지 않습니다. 결제창에서 아무 카드나 선택해 진행하면 됩니다.

흐름: 장바구니 → `/checkout` → DB 함수 `create_order`가 **DB 가격으로** 금액 계산 → 토스 결제창 → `/checkout/success` → Edge Function `payments-confirm`이 금액 검증 후 토스 승인 API 호출 → `finalize_order_paid`로 결제 완료 처리·재고 차감·장바구니 비움.

실서비스 키로 바꿀 때: `NEXT_PUBLIC_TOSS_CLIENT_KEY`를 교체하고, Supabase 대시보드에서 Edge Function 시크릿 `TOSS_SECRET_KEY`를 설정하세요.

## 구조

```
src/
├── app/
│   ├── (shop)/          홈, 상품목록·상세, 카테고리, 장바구니, 결제, 이미지 출처
│   ├── (auth)/          로그인, 회원가입
│   ├── auth/callback/   이메일 인증 콜백
│   ├── mypage/          내 정보, 주문 내역/상세
│   └── admin/           대시보드, 상품 등록·수정(이미지 업로드), 주문 상태 관리
├── components/          ui / layout / product / cart / admin
├── lib/supabase/        브라우저·서버 클라이언트, 미들웨어(세션 갱신·보호 라우트)
├── store/cart.ts        Zustand 장바구니 (비로그인: localStorage, 로그인: DB 동기화)
└── types/
supabase/
├── migrations/          스키마·RLS·DB 함수
└── functions/payments-confirm/   결제 승인 Edge Function
```

## 보안 요약

- 모든 테이블 RLS 적용: 상품·카테고리 공개 읽기, 장바구니·주문은 본인만, 쓰기는 관리자만
- 사용자가 스스로 `role`을 admin으로 바꾸는 것을 트리거로 차단
- 결제 완료 처리 함수는 `service_role`만 실행 가능(Edge Function 전용)
