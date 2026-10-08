# PharmLink Frontend

의약품 유통 관리 ERP 어드민 프론트엔드.

## 기술 스택

- **React 18** + **TypeScript 5**
- **Vite 5** — 개발 서버 / 번들러
- **Tailwind CSS 4** — `@tailwindcss/vite` 플러그인 방식
- **Recharts** — 차트, **lucide-react** — 아이콘
- **clsx** / **tailwind-merge** — 클래스 조합

패키지 매니저는 **pnpm** 을 사용합니다.

## 시작하기

Node 22 / pnpm 10.34.3 기준입니다. [mise](https://mise.jdx.dev) 를 쓰면 `.mise.toml` 로 버전이 자동으로 맞춰집니다.

```bash
pnpm install
pnpm dev
```

개발 서버는 http://localhost:5173 에서 열립니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 실행 (HMR) |
| `pnpm build` | 타입체크 후 `dist/` 로 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과물 로컬 확인 |

## 화면 구성

로그인 전에는 랜딩(`HomePage`)과 로그인(`LoginPage`), 로그인 후에는 `AdminLayout` 안에서 아래 10개 화면이 전환됩니다. 라우팅 라이브러리 없이 `App.tsx` 의 `route` 상태로 전환합니다.

| 메뉴 | 컴포넌트 |
| --- | --- |
| 대시보드 | `DashboardPage` |
| 거래처 관리 | `PartnerPage` |
| 상품 관리 | `ProductPage` |
| 재고 관리 | `InventoryPage` |
| 주문 관리 | `OrderPage` |
| 납품 관리 | `DeliveryPage` |
| 매입 관리 | `PurchasePage` |
| 매출 관리 | `SalesPage` |
| 마진 분석 | `MarginPage` |
| 사용자 관리 | `UsersPage` |

사용자 역할(`UserRole`)은 `admin`, `sales`, `warehouse` 세 가지입니다.

## 구조

```
src/
├── main.tsx              # 엔트리포인트
├── App.tsx               # 라우팅(상태 기반) · 공용 타입 정의
├── index.css             # Tailwind 진입점
├── components/
│   └── AdminLayout.tsx   # 사이드바 + 헤더 레이아웃
├── pages/                # 화면 12개 (랜딩 · 로그인 + 어드민 10개)
├── data/
│   └── products.ts       # 샘플 데이터
└── imports/
    └── pasted_text/      # 디자인 브리프 등 참고 문서
```

## 브랜치

- `main` — 기본 브랜치
- `dev` — 개발 브랜치. 작업은 여기에 올리고 `main` 으로 PR을 보냅니다.
