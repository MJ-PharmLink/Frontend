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

개발 서버는 http://localhost:5173 에서 열린다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 (HMR) |
| `pnpm build` | 타입체크 후 `dist/` 로 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과물 로컬 확인 |

## 백엔드 연동

`.env.example` 을 `.env` 로 복사하고 API 주소를 넣는다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | API Base URL. 미설정 시 `/api/v1` 로 요청하며, 로그인은 임시 계정으로 동작한다 |

### 로그인 계정

백엔드가 붙기 전까지 쓰는 임시 계정이다. `VITE_API_BASE_URL` 을 설정하면 실제
`POST /auth/login` 만 사용하고 아래 목록은 무시된다.

| 역할 | 아이디 | 비밀번호 |
| --- | --- | --- |
| 관리자 (ADMIN) | `admin01` | `admin123` |
| 영업담당 (SALES) | `sales01` | `sales123` |
| 창고담당 (WAREHOUSE) | `wh01` | `wh123` |

### API 계층

- `src/types/api.ts` — 명세의 모든 엔티티·Enum·요청/응답 타입
- `src/api/client.ts` — 공통 Envelope 해제, Bearer 토큰 주입, 401 시 토큰 재발급 후 1회 재시도, `ApiError`
- `src/api/endpoints.ts` — 명세 3~13장 엔드포인트 호출 함수
- `src/lib/domain.ts` — Enum 한글 라벨, 상태 배지 색, 상품 코드 접두어, 금액·날짜 표기

```ts
import { itemsApi, ApiError } from "./api"

try {
  const { data, pagination } = await itemsApi.list({ keyword: "타이레놀", page: 1 })
} catch (err) {
  if (err instanceof ApiError && err.code === "ITEM_NOT_FOUND") { /* ... */ }
}
```

## 화면 구성

로그인 전에는 랜딩(`HomePage`)과 로그인(`LoginPage`), 로그인 후에는 `AdminLayout` 안에서
아래 10개 화면이 전환된다. 라우팅 라이브러리 없이 `App.tsx` 의 `route` 상태로 전환한다.
메뉴는 역할(`ADMIN` / `SALES` / `WAREHOUSE`)에 따라 노출이 달라진다.

| 메뉴 | 컴포넌트 | 관련 API |
| --- | --- | --- |
| 대시보드 | `DashboardPage` | 12 |
| 거래처 관리 | `PartnerPage` | 5 |
| 상품 관리 | `ProductPage` | 6 |
| 재고 관리 | `InventoryPage` | 7 |
| 주문 관리 | `OrderPage` | 8 |
| 납품 관리 | `DeliveryPage` | 9 |
| 매입 관리 | `PurchasePage` | 10 |
| 매출 관리 | `SalesPage` | 11 |
| 마진 분석 | `MarginPage` | 11.3 |
| 사용자 관리 | `UsersPage` | 4 |

## 구조

```
src/
├── main.tsx              # 엔트리포인트
├── App.tsx               # 라우팅(상태 기반) · 공용 타입 재노출
├── index.css             # Tailwind 진입점
├── api/                  # API 클라이언트 · 엔드포인트
├── types/api.ts          # 명세 기반 도메인 타입
├── lib/domain.ts         # Enum 라벨 · 표기 규칙
├── components/
│   └── AdminLayout.tsx   # 사이드바 + 헤더 레이아웃
├── pages/                # 화면 12개 (랜딩 · 로그인 + 어드민 10개)
├── data/
│   └── sample.ts         # 명세 구조의 샘플 데이터 (백엔드 연동 전까지)
└── imports/
    └── pasted_text/      # 디자인 브리프 등 참고 문서
```

## 샘플 데이터

백엔드가 붙기 전까지 화면을 채우는 데이터는 `src/data/sample.ts` 한곳에 모여 있다.
재고 수량·주문 합계·매출·마진 같은 파생 값은 손으로 적지 않고 기준 데이터에서 계산하며,
날짜는 오늘 기준 상대값으로 만든다. 그래서 언제 실행해도 대시보드의 "이번 달" 집계가
비지 않는다.

## 남은 작업

모든 화면이 명세 스키마를 쓰도록 정렬되어 있다. 각 페이지에서 `src/data/sample.ts` 의
상수를 해당 `*Api` 호출로 바꾸면 서버 연동이 끝난다.

- 아직 화면이 없는 API: 회사 정보(13), 카테고리 생성·수정(6.6~6.7), 거래처별 거래 이력(5.6)
- 납품서 PDF(9.5)는 버튼만 있고 서버 연동 시 blob 다운로드를 연결하면 된다
- 목록은 전부 클라이언트 필터링이다. 서버 페이지네이션을 붙일 때 `pagination` 을 사용한다

## 브랜치

- `main` — 기본 브랜치
- `dev` — 개발 브랜치. 작업은 여기에 올리고 `main` 으로 PR을 보낸다
