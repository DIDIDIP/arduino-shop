# 아두이노 쇼핑몰 프로젝트 계획

## 1. 기술 스택
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript |
| 스타일 | Tailwind CSS |
| 백엔드/DB/인증/이미지 | Supabase (Postgres, Auth, Storage) |
| 장바구니 상태 | Zustand (비로그인 시 localStorage 유지) |
| 결제 | 토스페이먼츠 (테스트 키로 시작) |
| 배포 | Vercel |

## 2. 핵심 기능
- **상품**: 카테고리별 목록, 검색, 상세(스펙/호환 보드/재고)
- **카테고리 예시**: 보드(Uno, Nano, Mega, ESP32), 센서, 모듈, 모터/액추에이터, 부품(저항·LED·브레드보드), 키트
- **장바구니**: 담기/수량 변경/삭제, 로그인 시 DB 동기화
- **주문/결제**: 배송지 입력 → 토스 결제 → 서버에서 결제 승인 → 주문 생성 + 재고 차감
- **회원**: 이메일 회원가입/로그인, 마이페이지 주문 내역
- **관리자**: 상품 등록/수정/이미지 업로드, 주문 상태 변경 (role 기반 접근)

## 3. DB 설계 (초안)
- `profiles` (id → auth.users, name, phone, role: customer|admin)
- `categories` (id, name, slug, parent_id)
- `products` (id, category_id, name, slug, description, price, stock, specs jsonb, images text[], is_active)
- `cart_items` (id, user_id, product_id, quantity)
- `orders` (id, user_id, status: pending|paid|shipping|delivered|cancelled, total_amount, shipping_address jsonb, payment_key)
- `order_items` (id, order_id, product_id, quantity, unit_price)

모든 테이블에 RLS 적용 — 상품/카테고리는 공개 읽기, 장바구니/주문은 본인만, 쓰기는 admin만.

## 4. 개발 단계
1. **세팅** — Next.js 생성, Tailwind, Supabase 프로젝트 연결, 환경변수
2. **DB** — 마이그레이션 작성, RLS 정책, 샘플 상품 시드 데이터
3. **상품 화면** — 메인, 카테고리 목록, 상품 상세, 검색
4. **인증** — 회원가입/로그인, 미들웨어로 보호 라우트 처리
5. **장바구니** — Zustand 스토어 + DB 동기화
6. **결제** — 체크아웃 페이지, 토스 위젯, Edge Function `payments-confirm` 승인 처리
7. **마이페이지/관리자** — 주문 내역, 상품·주문 관리
8. **마무리** — 반응형, SEO 메타, Vercel 배포

## 5. 폴더 구조
```
├── docs/                      # 기획 문서
├── public/images/             # 로고 등 정적 이미지
├── supabase/migrations/       # DB 스키마 SQL
└── src/
    ├── app/
    │   ├── (shop)/            # 고객용 화면 (URL에 포함 안 됨)
    │   │   ├── products/[slug]/ # 상품 상세
    │   │   ├── categories/[slug]/
    │   │   ├── cart/
    │   │   └── checkout/      # success/, fail/ 결제 결과
    │   ├── (auth)/            # login/, signup/
    │   ├── mypage/orders/
    │   ├── admin/             # products/, orders/
    │   └── auth/callback/     # 이메일 인증 콜백
    (결제 승인은 supabase/functions/payments-confirm Edge Function에서 처리)
    ├── components/
    │   ├── ui/                # 버튼, 인풋 등 공통 UI
    │   ├── layout/            # 헤더, 푸터
    │   ├── product/           # 상품 카드, 그리드, 필터
    │   ├── cart/
    │   └── admin/
    ├── lib/supabase/          # 브라우저/서버 클라이언트
    ├── store/                 # Zustand (장바구니)
    └── types/                 # DB 타입 등
```
