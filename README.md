# PharmLink Frontend

의약품 유통 관리 어드민 프론트엔드.

## 기술 스택

- **React 18** + **TypeScript 5** (strict)
- **Vite 5** — 개발 서버 / 번들러
- **Tailwind CSS 3** — 스타일링
- **Recharts** — 차트, **lucide-react** — 아이콘
- **ESLint 10** (flat config) + typescript-eslint

## 시작하기

사전 요구: Node.js 20 이상 (개발 환경 기준 v24)

```bash
npm install
npm run dev
```

개발 서버는 http://localhost:5173 에서 열립니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (HMR) |
| `npm run build` | 타입체크 후 `dist/` 로 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 로컬 확인 |
| `npm run typecheck` | 타입체크만 실행 |
| `npm run lint` | ESLint 실행 |

## 구조

```
src/
├── main.tsx              # 엔트리포인트
├── App.tsx               # 라우팅(상태 기반) · 공용 타입 정의
├── index.css             # Tailwind 디렉티브
├── components/
│   └── AdminLayout.tsx   # 어드민 사이드바 + 헤더 레이아웃
├── pages/
│   ├── HomePage.tsx      # 랜딩
│   ├── LoginPage.tsx     # 로그인
│   ├── DashboardPage.tsx # 대시보드
│   ├── PartnerPage.tsx   # 거래처 관리
│   ├── ProductPage.tsx   # 상품 관리
│   ├── InventoryPage.tsx # 재고 관리
│   ├── OrderPage.tsx     # 주문 관리
│   └── MarginPage.tsx    # 마진 분석
└── data/
    └── products.ts       # 샘플 데이터
```

## 설정 파일

- `vite.config.ts` — Vite 설정 (React 플러그인)
- `tsconfig.json` — 앱 소스(`src/`) 타입 설정
- `tsconfig.node.json` — `vite.config.ts` 타입 설정
- `tailwind.config.js` / `postcss.config.js` — Tailwind 파이프라인
- `eslint.config.js` — ESLint flat config

## 브랜치

- `main` — 기본 브랜치
- `dev` — 개발 브랜치
