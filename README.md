# 아두몰 (ArduMall) — 아두이노 쇼핑몰 만들기 강의 노트

> **2주차 실습 · 2026-10-13**
> 기획 → 폴더 구조 → DB 설계 → 화면 개발 → 결제 연동 → 테스트 → GitHub/Vercel 배포까지
> 하루 동안 쇼핑몰 하나를 처음부터 끝까지 만들어 본 기록입니다.

| 항목 | 링크 |
|---|---|
| 배포 사이트 | https://arduino-shop-plum.vercel.app |
| GitHub 저장소 | https://github.com/DIDIDIP/arduino-shop |
| 기획 문서 | [`docs/PLAN.md`](docs/PLAN.md) |
| 이미지 출처 | 사이트의 `/credits` 페이지, [`public/images/credits.json`](public/images/credits.json) |

> ⚠️ 학습용 데모입니다. 실제로 판매하지 않으며, 결제는 토스페이먼츠 **테스트 모드**라 돈이 나가지 않습니다.

---

## 목차

1. [오늘의 학습 목표](#1-오늘의-학습-목표)
2. [기획: 무엇을 만들까](#2-기획-무엇을-만들까)
3. [폴더 구조 잡기](#3-폴더-구조-잡기)
4. [Supabase로 백엔드 만들기](#4-supabase로-백엔드-만들기)
5. [상품 데이터와 이미지 준비](#5-상품-데이터와-이미지-준비)
6. [Next.js 화면 만들기](#6-nextjs-화면-만들기)
7. [핵심 개념 깊이 보기: 장바구니와 결제](#7-핵심-개념-깊이-보기-장바구니와-결제)
8. [테스트](#8-테스트)
9. [GitHub · Vercel 배포](#9-github--vercel-배포)
10. [트러블슈팅 노트](#10-트러블슈팅-노트)
11. [남은 과제](#11-남은-과제)
12. [복습 퀴즈](#12-복습-퀴즈)
13. [부록](#부록)

---

## 1. 오늘의 학습 목표

- [x] 쇼핑몰의 기능을 나누고 **개발 순서**를 정할 수 있다
- [x] Next.js App Router의 **폴더 = URL** 규칙을 이해한다
- [x] Supabase로 **DB · 로그인 · 파일 저장 · 서버 함수**를 구성한다
- [x] **RLS(행 수준 보안)** 로 "누가 어떤 데이터를 볼 수 있는가"를 DB에서 지킨다
- [x] 결제 금액을 **클라이언트가 아닌 서버에서** 계산해야 하는 이유를 안다
- [x] GitHub CLI와 Vercel CLI로 **배포**한다

### 사용한 기술

| 영역 | 기술 | 한 줄 설명 |
|---|---|---|
| 프레임워크 | **Next.js 15** (App Router) + TypeScript | 화면 + 서버 렌더링을 한 프로젝트에서 |
| 스타일 | **Tailwind CSS 4** | 클래스 이름으로 바로 스타일링 |
| 백엔드 | **Supabase** | Postgres DB, 회원 인증, 파일 저장소, Edge Function |
| 상태 관리 | **Zustand** | 가벼운 장바구니 상태 저장 |
| 결제 | **토스페이먼츠** 결제위젯 (테스트 키) | 국내 PG 결제창 |
| 배포 | **GitHub** + **Vercel** | 코드 저장소 + Next.js 호스팅 |

---

## 2. 기획: 무엇을 만들까

> 💡 **포인트** — 코딩 전에 "기능 목록"과 "개발 순서"를 먼저 적어 두면 길을 잃지 않습니다.
> 오늘 처음 작성한 기획서는 [`docs/PLAN.md`](docs/PLAN.md)에 그대로 남겨 두었습니다.

### 핵심 기능

| 구분 | 기능 |
|---|---|
| 상품 | 카테고리별 목록, 검색, 정렬, 상세(사양·재고) |
| 장바구니 | 담기 / 수량 변경 / 삭제, 비로그인도 사용, 로그인하면 DB 저장 |
| 주문·결제 | 배송지 입력 → 토스 결제 → 서버 승인 → 재고 차감 |
| 회원 | 이메일 회원가입 / 로그인, 마이페이지 주문 내역 |
| 관리자 | 대시보드, 상품 등록·수정(사진 업로드), 주문 상태 변경 |

### 카테고리 설계

| 카테고리 | 상품 예 |
|---|---|
| 아두이노 보드 | Uno R3, Uno R4 WiFi, Nano Every, Mega 2560, ESP32 |
| 센서 | 초음파(HC-SR04), 온습도(DHT11), 인체감지(HC-SR501), 토양수분 |
| 디스플레이·모듈 | 1602 LCD, 0.96" OLED, 릴레이, 블루투스(HC-06) |
| 모터·드라이버 | SG90 서보, 28BYJ-48 스텝모터, L298N |
| 기본 부품 | 브레드보드, 점퍼선, LED, 저항 |
| 키트 | 아두이노 스타터 키트 |

### 개발 순서 (실제로 진행한 순서)

```
1. 세팅      Node.js 설치, Supabase 프로젝트 생성
2. DB        테이블 · RLS · DB 함수 마이그레이션
3. 데이터    디바이스마트 가격 조사, 무료 이미지 수집 (서브 에이전트 2개 병렬)
4. 화면      레이아웃 → 상품 → 장바구니 → 결제 → 인증 → 마이페이지 → 관리자
5. 검증      타입 체크, 빌드, API 테스트, 브라우저 테스트
6. 배포      GitHub 저장소 → Vercel
```

---

## 3. 폴더 구조 잡기

> 💡 **App Router 규칙**: `src/app` 아래 **폴더 이름이 곧 URL**입니다.
> - `(shop)`처럼 **괄호 폴더**는 URL에 나타나지 않는 "묶음용" 폴더 → `(shop)/cart` = `/cart`
> - `[slug]`처럼 **대괄호 폴더**는 변하는 값 → `/products/arduino-uno-r3`

```
2주차02/
├── docs/PLAN.md                      # 기획 문서
├── public/images/                    # 상품·카테고리·메인 사진 + credits.json
├── supabase/
│   ├── migrations/                   # DB 스키마 SQL (테이블, RLS, 함수)
│   └── functions/payments-confirm/   # 결제 승인 Edge Function
└── src/
    ├── app/
    │   ├── (shop)/                   # 손님용 화면
    │   │   ├── page.tsx              #   /            메인
    │   │   ├── products/             #   /products    전체상품·검색
    │   │   │   └── [slug]/           #   /products/x  상품 상세
    │   │   ├── categories/[slug]/    #   /categories/x
    │   │   ├── cart/                 #   /cart
    │   │   ├── checkout/             #   /checkout (+ success/, fail/)
    │   │   └── credits/              #   /credits     이미지 출처
    │   ├── (auth)/login, signup/     # 로그인·회원가입
    │   ├── auth/callback/            # 이메일 인증 링크 처리
    │   ├── mypage/                   # 내 정보, 주문 내역/상세
    │   └── admin/                    # 관리자 (대시보드, 상품, 주문)
    ├── components/                   # ui / layout / product / cart / admin
    ├── lib/
    │   ├── supabase/                 # client.ts(브라우저) · server.ts(서버) · middleware.ts
    │   └── format.ts                 # 원화 표시, 배송비, 주문상태 라벨
    ├── store/cart.ts                 # Zustand 장바구니
    ├── types/                        # 타입 정의
    └── middleware.ts                 # 로그인 필요한 페이지 보호
```

**계획에서 바뀐 점** (기획은 바뀌어도 괜찮습니다!)

| 처음 계획 | 바뀐 결과 | 이유 |
|---|---|---|
| `products/[id]` | `products/[slug]` | URL이 `/products/arduino-uno-r3`처럼 읽기 쉬움 |
| `app/api/payments/confirm` | Supabase **Edge Function** | 결제 승인에 필요한 비밀 키를 내 PC/Next.js에 두지 않아도 됨 |
| `src/hooks/` | 삭제 | 필요 없었음 |

---

## 4. Supabase로 백엔드 만들기

Supabase MCP(Claude가 Supabase를 직접 조작하는 도구)로 아래를 진행했습니다.

- 프로젝트: `arduino-shop` · 리전 **서울(ap-northeast-2)** · **Free 플랜**
- 마이그레이션: [`supabase/migrations/20261013063449_init_schema.sql`](supabase/migrations/20261013063449_init_schema.sql)

### 4-1. 테이블 설계 (ERD)

```
auth.users (Supabase 기본 회원 테이블)
   │ 1:1
   ├── profiles      (이름, 연락처, role: customer | admin)
   │ 1:N
   ├── cart_items    (user_id, product_id, quantity)
   │ 1:N
   └── orders        (상태, 총액, 배송비, 받는 분, 주소, payment_key)
          │ 1:N
          └── order_items (상품명·단가 "스냅샷", 수량)

categories 1:N products (가격, 재고, specs[jsonb], 이미지, 참고 링크)
```

> 💡 **왜 `order_items`에 상품명·가격을 복사해 두나요?**
> 나중에 상품 가격이 바뀌거나 상품이 삭제돼도, **주문 당시의 내역**은 그대로 남아야 하기 때문입니다.

### 4-2. RLS — DB가 직접 지키는 보안

RLS(Row Level Security)를 켜면, **정책에 맞는 행만** 읽고 쓸 수 있습니다.
프론트엔드 코드가 실수해도 DB가 막아 줍니다.

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| categories, products | 누구나 (숨김 상품은 관리자만) | 관리자만 |
| cart_items | 본인 것만 | 본인 것만 |
| orders, order_items | 본인 것 + 관리자 | 주문 생성은 DB 함수로만, 상태 변경은 관리자만 |
| profiles | 본인 + 관리자 | 본인 (단, `role`은 못 바꿈) |

```sql
-- 예) 장바구니는 내 것만
create policy "cart: own rows" on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

> 💡 **스스로 관리자 되기 막기**: `protect_profile_role` 트리거가 관리자가 아닌 사람이
> `role`을 바꾸려 하면 원래 값으로 되돌립니다. (실제로 이 트리거 때문에 SQL로 관리자 지정할 때도
> 막혀서, 트리거를 잠깐 끄고 지정했습니다 → [트러블슈팅](#10-트러블슈팅-노트))

### 4-3. DB 함수 (RPC)

| 함수 | 누가 호출 | 하는 일 |
|---|---|---|
| `create_order(items, 받는분, 연락처, 주소, 메모)` | 로그인 사용자 | **DB에 있는 가격으로** 금액 계산, 재고 확인, 배송비 계산(5만원 이상 무료), 주문 생성 |
| `finalize_order_paid(order_id, payment_key)` | **service_role만** (Edge Function) | 결제완료 처리 + 재고 차감 + 장바구니 비우기 |
| `is_admin()` | 정책 내부 | 현재 사용자가 관리자인지 |
| `handle_new_user()` | 회원가입 트리거 | `profiles` 행 자동 생성 |

### 4-4. Storage & Edge Function

- **Storage 버킷** `product-images` (공개 읽기, 관리자만 업로드) → 관리자 상품 사진 업로드용
- **Edge Function** `payments-confirm` → 결제 승인 (아래 7장)

### 4-5. 보안 점검 (Advisors)

`get_advisors`로 점검 → 경고 2건이 나왔지만 **의도된 것**이라 유지했습니다.
- `create_order` 를 로그인 사용자가 실행 가능 → 주문하려면 필요함
- `is_admin()` 을 누구나 실행 가능 → 자기 자신이 관리자인지만 알려줌 (정보 노출 없음)

---

## 5. 상품 데이터와 이미지 준비

### 5-1. 상품 정보 — 디바이스마트 기준 (2026-10-13 조회)

> 요청사항: "가격이나 상품 정보는 디바이스마트 기준으로 **최소한만**"
> → 상품명 · 가격 · 핵심 사양 2~4개 · 한 줄 설명 · 원본 링크만 저장했습니다.

| 카테고리 | 상품 | 가격 |
|---|---|---:|
| 보드 | 아두이노 우노 R3 정품 | 31,900원 |
| 보드 | 아두이노 우노 R4 WiFi 정품 | 42,130원 |
| 보드 | 아두이노 나노 에브리 정품 | 20,790원 |
| 보드 | 아두이노 메가 2560 R3 정품 | 64,900원 |
| 보드 | ESP32 DevKitC WROOM-32D (CP2102) | 9,900원 |
| 센서 | 초음파 거리센서 HC-SR04 | 1,210원 |
| 센서 | DHT11 온습도 센서 | 1,760원 |
| 센서 | PIR 인체감지 센서 HC-SR501 | 1,650원 |
| 센서 | 토양 습도 센서 | 1,100원 |
| 모듈 | I2C 1602 LCD | 2,750원 |
| 모듈 | 0.96" I2C OLED (SSD1306) | 10,780원 |
| 모듈 | 1채널 5V 릴레이 | 1,210원 |
| 모듈 | HC-06 블루투스 | 7,370원 |
| 모터 | SG90 미니 서보 | 2,090원 |
| 모터 | 28BYJ-48 스텝모터 + ULN2003 (3세트) | 22,000원 |
| 모터 | L298N 모터 드라이버 | 2,970원 |
| 부품 | 830핀 브레드보드 | 1,540원 |
| 부품 | 점퍼 케이블 40P 수-수 20cm | 935원 |
| 부품 | 일반 LED 6종 키트 | 2,420원 |
| 부품 | 막대저항 키트 (5종 250개) | 1,980원 |
| 키트 | 아두이노 스타터 키트 한글판 (K120007) | 152,900원 |

**메모: 대체한 상품**
- ESP32-DevKitC-32E 미판매 → WROOM-32D 개발보드로 대체
- 28BYJ-48 + ULN2003 단품 세트가 없어 **3세트 팩**으로
- 스타터 키트는 K000007 대신 **한글판 K120007**
- 5mm만 있는 LED 세트가 없어 3mm/5mm 혼합 키트로
- 가격은 디바이스마트 검색 결과의 판매가 기준 (상세 페이지에서 부가세 포함 여부는 따로 확인하지 않음)

### 5-2. 상품 이미지 — 무료 라이선스 사진

> 요청사항: "Flow에서 생성하거나 공짜 이미지 활용, **도형으로 그리지 마**"
> → Google Flow는 사용자 계정 로그인이 필요해서 사용하지 않고, **실물 사진**만 모았습니다.

- **총 27장**: 상품 21 + 메인 배너 1 + 카테고리 5
- **출처**: Wikimedia Commons 25장, Flickr(Openverse 검색) 2장
- 렌더링 이미지·회로도는 제외, **사진만** 선택
- **라이선스**: 대부분 CC BY / CC BY-SA → **출처 표시 의무** → `/credits` 페이지와 푸터 링크로 표시

| 라이선스 | 수 | 출처 표시 필요? |
|---|---:|---|
| CC BY-SA (2.0 / 3.0 / 4.0) | 19 | 필요 + 같은 조건으로 공유 |
| CC BY 2.0 | 5 | 필요 |
| CC0 / 퍼블릭 도메인 | 3 | 불필요 (그래도 표시함) |

**메모: 아쉬운 사진**
- `hc-06.jpg` 원본이 253px로 작아서 크게 보면 흐림
- `oled-096.jpg` 단독 사진이 없어 다른 부품과 연결된 사진
- `lcd-1602-i2c.jpg` I2C 모듈(뒷면)이 보이지 않음

> 💡 **저작권 팁**: "무료 이미지"도 조건이 있습니다. CC BY는 **작성자 표시**, CC BY-SA는
> 거기에 **동일 조건 공유**까지 필요합니다. 출처 목록을 데이터(`credits.json`)로 관리하면
> 출처 페이지를 자동으로 만들 수 있습니다.

---

## 6. Next.js 화면 만들기

### 6-1. 페이지 목록

| URL | 화면 | 렌더링 |
|---|---|---|
| `/` | 메인 (배너, 카테고리, 인기 상품) | 서버 |
| `/products?q=&sort=` | 전체상품 · 검색 · 정렬 | 서버 |
| `/products/[slug]` | 상품 상세 · 같은 카테고리 상품 | 서버 |
| `/categories/[slug]` | 카테고리별 목록 | 서버 |
| `/cart` | 장바구니 | 클라이언트 |
| `/checkout` | 배송정보 + 토스 결제위젯 | 클라이언트 (로그인 필요) |
| `/checkout/success`, `/fail` | 결제 결과 | 클라이언트 |
| `/login`, `/signup` | 로그인 · 회원가입 | 클라이언트 |
| `/mypage`, `/mypage/orders/[id]` | 내 정보 · 주문 내역 | 서버 (로그인 필요) |
| `/admin/**` | 대시보드 · 상품 · 주문 관리 | 서버 (관리자만) |
| `/credits` | 이미지 출처 | 서버 |

### 6-2. 서버 컴포넌트 vs 클라이언트 컴포넌트

```
서버 컴포넌트 (기본값)                  클라이언트 컴포넌트 ("use client")
- DB에서 데이터 읽어서 HTML로 그림       - 클릭, 입력, 상태(useState)
- 예: 상품 목록, 상세, 마이페이지         - 예: 장바구니, 결제위젯, 폼
```

> 💡 **규칙**: 데이터를 **보여주기만** 하면 서버, 사용자가 **조작**하면 클라이언트.

### 6-3. Supabase 클라이언트 3종

| 파일 | 어디서 | 용도 |
|---|---|---|
| `lib/supabase/client.ts` | 브라우저 | 로그인, 장바구니 저장, 관리자 수정 |
| `lib/supabase/server.ts` | 서버 컴포넌트 | 쿠키로 로그인 사용자 확인 후 조회 |
| `lib/supabase/middleware.ts` | 미들웨어 | 세션 갱신 + `/mypage` `/checkout` `/admin` 접근 시 로그인 확인 |

### 6-4. 디자인 메모

- 메인 색: 아두이노 틸 `#00979D`, 글꼴: Pretendard
- 공통 스타일은 `globals.css`의 `btn-primary`, `input`, `card` 같은 유틸리티로 통일
- 상품 이미지는 `next/image`로 자동 최적화 (화면 크기별 이미지 생성)

---

## 7. 핵심 개념 깊이 보기: 장바구니와 결제

### 7-1. 장바구니 동기화 (`store/cart.ts`, `components/cart/CartSync.tsx`)

```
[비로그인]  장바구니 → localStorage에만 저장
     │ 로그인!
     ▼
[병합]      DB 장바구니 + 로컬 장바구니 (같은 상품은 큰 수량으로)
     ▼
[로그인]    이후 변경 사항은 0.4초 뒤 DB에 반영 (debounce)
     │ 로그아웃
     ▼
[초기화]    로컬 장바구니 비우기
```

### 7-2. 결제 흐름 — "금액은 절대 브라우저를 믿지 않는다"

```
 브라우저                       Supabase DB              Edge Function            토스페이먼츠
    │ ① create_order(상품ID, 수량) ─▶│                                                │
    │                                │ DB 가격으로 금액 계산                           │
    │◀────────── 주문ID ─────────────│ (status = pending)                            │
    │ ② 결제창 열기 (주문ID, 금액) ─────────────────────────────────────────────────▶│
    │◀──────── success URL (paymentKey, orderId, amount) ───────────────────────────│
    │ ③ payments-confirm 호출 ──────────────────────────▶│                          │
    │                                │◀── 주문 조회 ──────│ 본인 주문? 금액 일치?     │
    │                                │                    │── 승인 요청 (시크릿 키) ─▶│
    │                                │◀ finalize_order_paid│◀────── 승인 OK ─────────│
    │                                │ paid, 재고 차감, 장바구니 비움                   │
    │◀───────────────── 완료 ────────────────────────────│                          │
```

> 💡 **왜 이렇게 복잡하게?**
> 브라우저에서 보낸 금액을 그대로 믿으면, 개발자 도구로 `31,900원 → 100원`으로 바꿔 결제할 수 있습니다.
> 그래서 ① 금액은 **DB 가격**으로 계산하고, ③ 결제 승인 전에 **금액이 주문과 같은지** 다시 확인합니다.
> 결제완료 처리 함수(`finalize_order_paid`)는 **service_role만** 실행할 수 있어서 사용자가 직접 부를 수 없습니다.

### 7-3. 사용한 키 정리

| 키 | 위치 | 공개 여부 |
|---|---|---|
| Supabase URL / publishable 키 | `.env.local`, Vercel | 공개 가능 (RLS가 보호) |
| 토스 **클라이언트** 키 (테스트) | `.env.local`, Vercel | 공개 가능 |
| 토스 **시크릿** 키 (테스트, 문서 공개용) | Edge Function | 실서비스에선 `TOSS_SECRET_KEY` 시크릿으로 설정 |
| Supabase service_role 키 | Edge Function 내부에만 | **절대 비공개** |

---

## 8. 테스트

| 테스트 | 방법 | 결과 |
|---|---|---|
| 타입 체크 | `npx tsc --noEmit` | ✅ 통과 |
| 프로덕션 빌드 | `npx next build` | ✅ 19개 페이지 |
| 페이지 응답 | `curl`로 주요 URL 확인 | ✅ 200, 보호 페이지는 307 → 로그인 |
| 주문 생성 RPC | API 직접 호출 | ✅ 31,900 + 2,420 + 배송비 3,000 = 37,320원 |
| 결제완료 함수 직접 호출 | 일반 사용자 토큰으로 | ✅ `permission denied` (막힘) |
| Edge Function | 금액 틀림 / 로그인 없음 / 가짜 키 | ✅ 각각 거절, 토스 API 연결 확인 |
| 브라우저 E2E | Chrome 자동화 | ✅ 담기 → 로그인 → DB 동기화 → 결제위젯 → 주문 생성 → 결제창 |
| 관리자 | 대시보드, 재고 수정 | ✅ 저장 확인 |
| 배포 사이트 | 공개 URL 응답 | ✅ 모든 페이지 정상 |

> ⚠️ **아직 확인 못 한 것**: 토스 결제창 안에서 카드 선택 → 결제 완료 → 주문 "결제 완료" 전환.
> 테스트 때 브라우저 창이 뒤에 가려져 결제창을 클릭할 수 없었습니다. 직접 결제해 보고 확인해 주세요.

### 데모 계정

| 역할 | 이메일 | 비밀번호 |
|---|---|---|
| 일반 회원 | customer@ardumall.dev | test1234! |

관리자 계정은 저장소가 공개라서 여기 적지 않습니다. 관리자 권한은 Supabase에서 `profiles.role`을 `admin`으로 지정해 부여합니다.

---

## 9. GitHub · Vercel 배포

### 9-1. GitHub (GitHub CLI)

```bash
git init -b main
git add -A
git commit -m "아두몰: Next.js + Supabase 아두이노 쇼핑몰"
gh repo create arduino-shop --public --source . --remote origin --push
```

올리지 않은 파일 (`.gitignore`): `.env*`(단, `.env.example`은 포함), `.claude/`, `.mcp.json`, `.vercel`, `node_modules`, `.next`

> 💡 **공개 저장소 체크리스트**: 비밀 키, 관리자 비밀번호, 개인정보가 들어간 파일이 없는지
> `git status`로 꼭 확인하고 올립니다.

### 9-2. 왜 GitHub Pages가 아니라 Vercel?

| | GitHub Pages | Vercel |
|---|---|---|
| 지원 | 정적 파일(HTML/CSS/JS)만 | Next.js 서버 기능 전부 |
| 이 프로젝트 | 로그인 세션·서버 렌더링·미들웨어 **동작 안 함** | 그대로 동작 |

### 9-3. Vercel (Vercel CLI)

```bash
npm install -g vercel
vercel login                         # 브라우저에서 코드 승인 (device login)
vercel link --yes --project arduino-shop
vercel env add NEXT_PUBLIC_SUPABASE_URL production      # 값은 printf로 파이프
vercel env add NEXT_PUBLIC_TOSS_CLIENT_KEY production --type config --value "..." --yes
vercel deploy --prod --yes
```

배포 결과: **https://arduino-shop-plum.vercel.app**

### 커밋 기록

```
65344e4 fix: upgrade Next.js 15.5.27 and React 19.1.9 (security patches)
b08cd38 chore: ignore Vercel files
be179f6 아두몰: Next.js + Supabase 아두이노 쇼핑몰
```

---

## 10. 트러블슈팅 노트

> 오늘 실제로 만난 문제들입니다. **에러는 배움의 재료!**

| # | 증상 | 원인 | 해결 |
|---|---|---|---|
| 1 | `node : 인식되지 않는 명령` | Node.js 미설치 | `winget install OpenJS.NodeJS.LTS` → **UAC(관리자 권한) 창 승인** 필요 |
| 2 | 설치 후에도 `node`를 못 찾음 | 이미 열린 터미널은 PATH가 갱신 안 됨 | 새 터미널을 열거나 `$env:Path`에 `C:\Program Files\nodejs` 추가 |
| 3 | Supabase MCP `Invalid or expired requestState` | 일시적 연결 오류 | 실제 반영 여부(`list_tables`) 확인 후 재시도 |
| 4 | Bash heredoc `unexpected EOF` | 긴 셸 스크립트 안 따옴표 파싱 오류 | 파일 쓰기 도구로 파일을 하나씩 작성 |
| 5 | curl로 보낸 한글 JSON이 `Empty or invalid json` | Windows Git Bash 인코딩 문제 | JSON을 파일로 저장해 `--data-binary @파일`로 전송 |
| 6 | SQL로 관리자 지정이 안 됨 | 우리가 만든 **역할 보호 트리거**가 막음 (정상 동작!) | 트리거를 잠시 끄고 지정 후 다시 켬 |
| 7 | 브라우저 자동화 스크린샷·타이핑 실패 | Chrome 탭이 백그라운드(hidden) 상태 | `form_input` + JS `requestSubmit()`으로 대체 |
| 8 | Vercel 로그인 코드 만료 | 코드 입력 후 **Allow 버튼**까지 안 누름 / 시간 초과 | 새 코드 발급 후 끝까지 승인 |
| 9 | Git Bash에서 `vercel` 실행 시 경로 깨짐 | `$APPDATA` 경로 변환 문제 | PowerShell 사용 또는 `node .../vercel/dist/vc.js` 직접 실행 |
| 10 | Vercel 환경변수 값 앞에 이상한 글자 | PowerShell 파이프가 **BOM** 문자를 붙임 | Bash `printf '%s' 값 \| vercel env add`로 재등록, `env pull`로 검증 |
| 11 | `NEXT_PUBLIC_TOSS_CLIENT_KEY` 등록 실패 | 이름에 `KEY`가 있어 공개 여부 확인 요구 | `--type config --value ... --yes` |
| 12 | 배포 실패 `Vulnerable version of Next.js` | Next 15.5.4 보안 취약점 | Next **15.5.27**, React **19.1.9**로 업그레이드 |
| 13 | `vercel link` 중 GitHub 연결 실패 | Vercel GitHub 앱 미설치 | https://github.com/apps/vercel 설치 후 `vercel git connect` |

---

## 11. 남은 과제

- [ ] **Supabase 인증 URL 설정** (필수) — Authentication → URL Configuration
  - Site URL: `https://arduino-shop-plum.vercel.app`
  - Redirect URLs: `https://arduino-shop-plum.vercel.app/**`
  - 안 하면 회원가입 인증 메일 링크가 `localhost:3000`으로 연결됨
- [ ] **GitHub 자동 배포 연결** — Vercel GitHub 앱 설치 후 `vercel git connect`
- [ ] **관리자 비밀번호를 강력하게 변경** (사이트가 공개됨)
- [ ] 토스 결제창에서 **실제 테스트 결제** 끝까지 해 보기
- [ ] (선택) 실서비스 전환 시 토스 라이브 키 + `TOSS_SECRET_KEY` 시크릿 설정
- [ ] (선택) 결제 안 하고 나간 `pending` 주문 정리 작업
- [ ] (참고) Supabase 무료 플랜은 인증 메일 발송 수가 시간당 제한됨

---

## 12. 복습 퀴즈

<details>
<summary>Q1. <code>src/app/(shop)/cart/page.tsx</code>의 URL은?</summary>

`/cart` — 괄호 폴더 `(shop)`은 URL에 포함되지 않습니다.
</details>

<details>
<summary>Q2. 주문 금액을 브라우저에서 계산해 서버로 보내면 안 되는 이유는?</summary>

사용자가 개발자 도구로 금액을 조작할 수 있기 때문입니다. 금액은 DB 가격으로 서버(DB 함수)에서 계산하고, 결제 승인 전에 한 번 더 비교합니다.
</details>

<details>
<summary>Q3. RLS를 켜고 정책을 하나도 안 만들면 어떻게 될까?</summary>

아무도(anon, authenticated) 그 테이블을 읽거나 쓸 수 없습니다. RLS는 "기본 거부"입니다.
</details>

<details>
<summary>Q4. Supabase publishable 키는 공개돼도 괜찮은데, service_role 키는 왜 안 될까?</summary>

publishable 키는 RLS 정책을 따르지만, service_role 키는 **RLS를 무시**하고 모든 데이터에 접근할 수 있습니다.
</details>

<details>
<summary>Q5. CC BY-SA 이미지를 쓸 때 지켜야 할 두 가지는?</summary>

① 작성자와 라이선스를 표시(BY) ② 이 이미지를 고쳐 만든 결과물도 같은 라이선스로 공유(SA)
</details>

<details>
<summary>Q6. 이 프로젝트를 GitHub Pages에 그대로 올릴 수 없는 이유는?</summary>

GitHub Pages는 정적 파일만 제공해서, 서버 렌더링·미들웨어·쿠키 기반 로그인 같은 Next.js 서버 기능이 동작하지 않습니다.
</details>

---

## 부록

### A. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # http://localhost:3000
```

### B. 환경변수 (`.env.example`)

| 이름 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable 키 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 결제위젯 클라이언트 키 |

### C. 이미지 출처 요약

전체 목록(제목·작성자·원본 링크)은 사이트의 `/credits` 페이지 또는 [`credits.json`](public/images/credits.json)을 보세요.

| 파일 | 라이선스 | 작성자 | 출처 |
|---|---|---|---|
| products/arduino-uno-r3.jpg | CC BY 2.0 | SparkFun Electronics | Wikimedia |
| products/arduino-uno-r4-wifi.jpg | CC BY-SA 4.0 | Lomrjyo | Wikimedia |
| products/arduino-nano-every.jpg | CC BY-SA 4.0 | Enirstad | Wikimedia |
| products/arduino-mega-2560.jpg | CC BY-SA 4.0 | Dsimic | Wikimedia |
| products/esp32-devkitc.jpg | CC0 | Ubahnverleih | Wikimedia |
| products/hc-sr04.jpg | CC BY-SA 4.0 | Suyash Dwivedi | Wikimedia |
| products/dht11.jpg | CC BY-SA 4.0 | Edwiyanto | Wikimedia |
| products/hc-sr501.jpg | CC BY-SA 4.0 | Sjilla | Wikimedia |
| products/soil-moisture.jpg | CC0 1.0 | tvluke_ | Flickr |
| products/lcd-1602-i2c.jpg | CC BY-SA 2.0 | oomlout | Wikimedia |
| products/oled-096.jpg | CC BY-SA 4.0 | Turbospok | Wikimedia |
| products/relay-1ch.jpg | CC BY-SA 4.0 | Suyash Dwivedi | Wikimedia |
| products/hc-06.jpg | CC BY-SA 4.0 | Cristobal aeorum | Wikimedia |
| products/sg90.jpg | CC BY-SA 4.0 | Suyash Dwivedi | Wikimedia |
| products/stepper-28byj48.jpg | CC BY-SA 4.0 | Kushagra Keshari | Wikimedia |
| products/l298n.jpg | CC BY-SA 2.0 | lespounder | Flickr |
| products/breadboard-830.jpg | CC BY 2.0 | The Marmot | Wikimedia |
| products/jumper-wire-mm.jpg | CC BY-SA 2.0 | oomlout | Wikimedia |
| products/led-5mm-kit.jpg | CC BY-SA 2.0 | Afrank99 | Wikimedia |
| products/resistor-kit.jpg | Public domain | Evan-Amos | Wikimedia |
| products/starter-kit.jpg | CC BY-SA 2.0 | oomlout | Wikimedia |
| hero.jpg | CC BY 2.0 | TreyDanger | Wikimedia |
| cat-boards.jpg | CC BY-SA 3.0 | SimonWaldherr | Wikimedia |
| cat-sensors.jpg | CC BY-SA 3.0 | Nevit Dilmen | Wikimedia |
| cat-modules.jpg | CC BY-SA 4.0 | Kushagra Keshari | Wikimedia |
| cat-motors.jpg | CC BY-SA 2.0 | oomlout | Wikimedia |
| cat-parts.jpg | CC BY 2.0 | Windell Oskay | Wikimedia |

### D. 용어 사전

| 용어 | 뜻 |
|---|---|
| **App Router** | Next.js에서 폴더 구조로 페이지 주소를 정하는 방식 |
| **RLS** | 행 수준 보안. 테이블의 각 행을 누가 읽고 쓸지 DB가 정책으로 결정 |
| **RPC** | DB 함수를 API처럼 호출하는 것 (`supabase.rpc("create_order")`) |
| **Edge Function** | Supabase에서 실행되는 서버 코드. 비밀 키를 안전하게 사용 |
| **service_role** | RLS를 무시하는 최고 권한. 서버에서만 사용 |
| **마이그레이션** | DB 구조 변경을 SQL 파일로 기록해 재현 가능하게 만든 것 |
| **미들웨어** | 페이지 요청 전에 실행돼 로그인 확인·리다이렉트를 하는 코드 |
| **debounce** | 연속 이벤트를 모아 마지막에 한 번만 처리 (장바구니 DB 저장) |
| **BOM** | 파일 맨 앞에 붙는 보이지 않는 문자. 값 비교·URL을 깨뜨릴 수 있음 |
| **device login** | 터미널에서 코드를 받아 브라우저에서 승인하는 로그인 방식 |
