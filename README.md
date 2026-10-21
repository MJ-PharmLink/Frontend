# PharmLink Frontend

의약품 유통 관리 ERP 어드민 프론트엔드.

기준 문서는 **최종 API 명세서(v1)** 와 **도메인 명세서(DB 설계서)** 이며, 타입과 필드명은
서버 응답을 그대로(snake_case) 따른다.

## 기술 스택

- **React 18** + **TypeScript 5**
- **Vite 5** — 개발 서버 / 번들러
- **Tailwind CSS 4** — `@tailwindcss/vite` 플러그인 방식
- **Recharts** — 차트, **lucide-react** — 아이콘

패키지 매니저는 **pnpm** 을 사용한다.

## 시작하기

Node 22 / pnpm 10.34.3 기준이다. [mise](https://mise.jdx.dev) 를 쓰면 `.mise.toml` 로 버전이 맞춰진다.

```bash
pnpm install
pnpm dev
```

개발 서버는 http://localhost:5173 에서 열린다. 백엔드 dev 의 CORS 허용 주소도 이 주소다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 (HMR) |
| `pnpm build` | 타입체크(`tsc`) 후 `dist/` 로 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과물 로컬 확인 |

## 백엔드 연동

`.env.example` 을 `.env` 로 복사한다. 기본값이 로컬 백엔드(`http://localhost:8080/api/v1`)를 가리킨다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | API Base URL. 설정하면 로그인을 포함한 모든 요청이 이 주소로 간다. 미설정 시 `/api/v1` 로 요청하고, 로그인은 아래 임시 계정으로만 동작한다 |

`vite.config.ts` 에 프록시 설정이 없으므로, `VITE_API_BASE_URL` 없이 실행하면 서버 API를 부르는 화면은
데이터를 불러오지 못한다. 백엔드 없이 볼 수 있는 것은 샘플 데이터를 쓰는 화면(상품 관리 · 재고 관리)이다.

### 로그인 계정

`VITE_API_BASE_URL` 을 설정하면 실제 `POST /auth/login` 만 사용한다. 처음에는 백엔드
`application-secret.yml` 의 `admin.*` 으로 만들어진 관리자 계정으로 로그인하고, 영업·창고 계정은
사용자 관리 화면에서 만든다.

아래는 `VITE_API_BASE_URL` 이 없을 때만 쓰는 임시 계정이다(`LoginPage` 의 `OFFLINE_ACCOUNTS`).

| 역할 | 아이디 | 비밀번호 |
| --- | --- | --- |
| 관리자 (ADMIN) | `admin01` | `admin123` |
| 영업담당 (SALES) | `sales01` | `sales123` |
| 창고담당 (WAREHOUSE) | `wh01` | `wh123` |

### API 계층

- `src/types/api.ts` — 명세의 모든 엔티티·Enum·요청/응답 타입
- `src/api/client.ts` — 공통 Envelope 해제, Bearer 토큰 주입, 401 시 토큰 재발급 후 1회 재시도, `ApiError`,
  목록 전체 페이지 수집(`fetchAllPages`, `page_size` 100), 납품서 PDF용 `requestBlob`
- `src/api/endpoints.ts` — 명세 3~13장 엔드포인트 호출 함수. 상품·카테고리·창고·재고(`itemsApi`,
  `categoriesApi`, `warehousesApi`, `inventoriesApi`)는 정의만 되어 있고 아직 호출하는 화면이 없다
- `src/lib/domain.ts` — Enum 한글 라벨, 상태 배지 색, 상품 코드 접두어, 금액·날짜 표기, KST 오늘·이번 달 1일
- `src/lib/concurrency.ts` — 목록 행마다 상세 API를 부를 때 동시 요청 수 제한(`DETAIL_FETCH_CONCURRENCY` = 5)

```ts
import { ordersApi, ApiError, errorMessage } from "./api"

try {
  await ordersApi.approve(orderId)
} catch (err) {
  if (err instanceof ApiError && err.code === "INSUFFICIENT_STOCK") {
    // err.details 에 부족한 상품별 요청·가용 수량이 들어 있다
  } else {
    alert(errorMessage(err))
  }
}
```

## 화면 구성

로그인 전에는 랜딩(`HomePage`)과 로그인(`LoginPage`), 로그인 후에는 `AdminLayout` 안에서
아래 11개 화면이 전환된다. 라우팅 라이브러리 없이 `App.tsx` 의 `route` 상태로 전환한다.
새로고침하면 저장된 토큰으로 `GET /auth/me` 를 불러 로그인 상태를 되살린다.

메뉴는 역할(`ADMIN` / `SALES` / `WAREHOUSE`)에 따라 노출이 달라진다(`AdminLayout` 의 `NAV_ITEMS`).
표는 사이드바 순서다.

| 메뉴 | 컴포넌트 | 관련 API | 노출 역할 | 데이터 |
| --- | --- | --- | --- | --- |
| 대시보드 | `DashboardPage` | 12 | 관리자 · 영업 · 창고 | 서버 API (일부 샘플) |
| 거래처 관리 | `PartnerPage` | 5 | 관리자 · 영업 | 서버 API |
| 상품 관리 | `ProductPage` | 6 | 관리자 · 창고 | 샘플 |
| 재고 관리 | `InventoryPage` | 7 | 관리자 · 영업 · 창고 | 샘플 |
| 주문 관리 | `OrderPage` | 8 | 관리자 · 영업 | 서버 API (일부 샘플) |
| 납품 관리 | `DeliveryPage` | 9 | 관리자 · 영업 · 창고 | 서버 API |
| 매입 관리 | `PurchasePage` | 10 | 관리자 · 창고 | 서버 API (일부 샘플) |
| 매출 관리 | `SalesPage` | 11 | 관리자 · 영업 | 서버 API |
| 마진 분석 | `MarginPage` | 11.3 | 관리자 · 영업 | 서버 API (일부 샘플) |
| 회사 정보 | `CompanyPage` | 13 | 관리자 · 영업 · 창고 | 서버 API |
| 사용자 관리 | `UsersPage` | 4 | 관리자 | 서버 API |

화면 안의 버튼도 역할을 따른다. 회사 정보 수정은 관리자, 주문 등록·승인·취소는 관리자·영업,
출고·납품 완료 처리는 관리자·창고만 할 수 있다.

카테고리 관리(6.5~6.7)는 상품 관리의 탭, 거래처별 거래 이력(5.6)은 거래처 상세 모달의
탭으로 들어가 있다. 대시보드의 기간 매입 건수는 10.1 매입 목록으로 구하며, 매입 조회 권한이 없는
영업 계정에는 `-` 로 표시된다.

## 구조

```
src/
├── main.tsx              # 엔트리포인트
├── App.tsx               # 라우팅(상태 기반) · 로그인 상태 복원 · 공용 타입 재노출
├── index.css             # Tailwind 진입점
├── api/                  # API 클라이언트 · 엔드포인트
├── types/api.ts          # 명세 기반 도메인 타입
├── lib/
│   ├── domain.ts         # Enum 라벨 · 표기 규칙
│   └── concurrency.ts    # 상세 API 동시 호출 수 제한
├── components/
│   └── AdminLayout.tsx   # 사이드바 + 헤더 레이아웃, 역할별 메뉴
├── pages/                # 화면 13개 (랜딩 · 로그인 + 어드민 11개)
├── data/
│   └── sample.ts         # 명세 구조의 샘플 데이터 (상품 · 재고 API 연동 전까지)
└── imports/
    └── pasted_text/      # 디자인 브리프 등 참고 문서
```

## 샘플 데이터

서버 API가 아직 없는 부분을 채우는 데이터는 `src/data/sample.ts` 한곳에 모여 있다.
재고 수량·주문 합계·매출·마진 같은 파생 값은 손으로 적지 않고 기준 데이터에서 계산하며,
날짜는 오늘 기준 상대값으로 만든다.

현재 이 파일을 쓰는 곳은 다음과 같다.

| 화면 | 샘플에서 가져오는 것 |
| --- | --- |
| 상품 관리 | 상품 · 카테고리 · 공급처 목록 전체 |
| 재고 관리 | 재고 · 로트 · 유통기한 임박 · 재고 이력 · 상품 · 창고 · 카테고리 전체 |
| 주문 관리 | 주문 등록 모달의 상품 선택 목록 |
| 매입 관리 | 매입 등록 모달의 상품 · 창고 선택 목록, 창고 이름 표시 |
| 대시보드 | 재고 부족 품목의 단위 표기 |
| 마진 분석 | 안내 문구의 등록 상품 수 |
| 납품 관리 | `VITE_API_BASE_URL` 이 없을 때 띄우는 납품서 인쇄 미리보기의 회사 · 거래처 정보 |

주문·매입 화면은 샘플 상품의 `item_id`(101, 102 …)와 창고 `warehouse_id`(1)로 요청을 보내므로,
로컬 DB `items` 테이블에 같은 `item_id` 의 상품이 있어야 등록이 된다.

## 남은 작업

인증, 사용자, 거래처, 회사 정보, 주문, 납품, 매입, 매출, 마진, 대시보드 화면은 서버 API와 연동되어 있다.

- 상품 관리 · 재고 관리 화면은 아직 샘플 데이터로 동작한다. 백엔드 dev 에 상품·카테고리·창고·재고 API가
  들어오면 `itemsApi` · `categoriesApi` · `warehousesApi` · `inventoriesApi` 호출로 바꾸고, 주문·매입·대시보드·마진
  화면의 샘플 상품·창고 참조도 같은 API로 바꾼다
- 서버와 연동된 목록은 `fetchAllPages` 로 모든 페이지를 받은 뒤 클라이언트에서 필터링한다(마진 분석은 서버 집계).
  납품 · 매입 · 매출 목록은 행마다 상세 API를 동시 5개까지 부른다. 데이터가 많아지면 서버 필터와 `pagination` 을 사용한다
- 납품서는 `VITE_API_BASE_URL` 이 있으면 9.5 PDF를 내려받고, 없으면 같은 내용을 브라우저
  인쇄 창으로 띄운다

## 브랜치

- `main` — 기본 브랜치
- `dev` — 개발 통합 브랜치. `feat/{기능명}`, `fix/{내용}` 브랜치에서 작업하고 `dev` 로 PR을 보낸다
