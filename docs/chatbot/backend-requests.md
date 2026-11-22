# B에게 확인·요청할 항목 (FE 연동 기준)

작성: C · 2026-11-22 · 기준 코드: Backend `feat/ai-chatbot-backend` @ `f4b6b9f`

프론트는 아래 **현재 동작**에 맞춰 이미 연결되어 있고, 요청 항목이 반영되면 별도 수정 없이 화면에 바로 나타나도록 만들어 두었다.
우선순위는 🔴(11/23 오전) → 🟠(11/23 중) → 🟡(11/24까지).

## 1. 현재 서버 동작 (코드에서 확인한 사실)

| 항목 | 현재 값 | 위치 |
|---|---|---|
| 엔드포인트 | `POST /api/v1/ai/chat` 만 있음. `GET /api/v1/ai/capabilities` 없음(404) | `AiChatController` |
| 요청 | `{ message }` 만 읽음. `history` 는 보내도 무시됨 | `AiChatRequest` |
| 검증 | `message` 빈 값 → 400 `not_blank`, 1000자 초과 → 400 `size` | `AiChatRequest` |
| 응답 `data` | `{ answer, intent }` 만. intent = `GENERAL` / `LOW_STOCK` / `INVENTORY` | `AiChatResponse` |
| 권한 | `ADMIN`·`SALES`·`WAREHOUSE` 모두 허용 | `AccessRole.ALL` |
| Gemini 오류 | 모두 503 `AI_SERVICE_UNAVAILABLE` | `GeminiLlmClient`, `AiChatService` |
| Gemini 대기 | 호출당 읽기 제한 45초, 데이터 질문은 2회 호출 → 최악 약 90초 | `GeminiLlmClient` |
| CORS | `http://localhost:5173` 만 허용 | `SecurityConfig` |

## 2. 요청 항목

### 🔴 R1. 응답 필드 확정 (API Spec v0.1 맞추기)
FE 답변 카드는 아래 필드가 오면 자동으로 표시한다. 없으면 숨긴다.

```jsonc
{
  "answer": "…",
  "intent": "LOW_STOCK",
  "sources": [
    { "type": "get_low_stock_items", "title": "부족 재고 (전체 창고)",
      "rows": [ { "item_code": "…", "item_name": "…", "warehouse_id": 1,
                  "quantity": 40, "safety_stock": 100, "shortage_quantity": 60, "stock_status": "LOW_STOCK" } ] }
  ],
  "query_context": { "function_name": "get_low_stock_items", "keyword": null, "warehouse_id": null,
                     "page": 1, "total_count": 3, "total_pages": 1, "has_next": false },
  "generated_at": "2026-11-23T01:00:00Z"
}
```
- `rows` 는 이미 만들고 있는 `LowStockResult.items` / `InventorySearchResult.items` 를 그대로 넣으면 된다 (snake_case).
- **`query_context.total_count` 가 꼭 필요**: FE는 이 값이 0이면 '결과 없음' 배지를 띄운다. 지금은 답변 문장만으로는 빈 결과를 구분할 수 없다.
- 확인할 것: 필드명이 이대로 괜찮은지, 아니면 다른 이름으로 갈지.

### 🔴 R2. 에러 코드 표 확정
FE가 현재 가정한 매핑 (`src/lib/chatbot.ts` `toChatError`):

| HTTP | code | FE 문구 | 재시도 버튼 | 상태 |
|---|---|---|---|---|
| 400 | `VALIDATION_ERROR` (`message: not_blank / size`) | 질문을 확인해 주세요 | 없음 | 서버 있음 |
| 401 | `UNAUTHORIZED` / `INVALID_TOKEN` / `TOKEN_EXPIRED` | 로그인이 필요해요 (재발급 1회 시도 후 로그인 화면) | 없음 | 서버 있음 |
| 403 | `FORBIDDEN` / `ACCOUNT_DISABLED` | 조회 권한이 없어요 / 비활성화된 계정이에요 | 없음 | 서버 있음 |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI 서비스가 잠시 응답하지 않아요 | 있음 | 서버 있음 |
| 500 | `INVENTORY_QUERY_FAILED` / 기타 | 데이터를 조회하지 못했어요 | 있음 | 서버 있음 |
| 429 | (가정) `AI_RATE_LIMITED` 등 | 요청이 너무 많아요 | 있음 | **가정 — 도입 여부 확인** |
| - | 클라이언트 95초 타임아웃 | 응답 시간이 초과되었어요 | 있음 | FE 자체 |

- 확인할 것: (a) Gemini 429(쿼터 초과)도 503으로 묶을지, 429로 분리할지. (b) Gemini 타임아웃을 503 말고 504로 구분할지. 둘 다 지금 매핑으로 동작은 한다.

### 🔴 R3. CORS 허용 주소
- 로컬 개발(`localhost:5173`)은 문제없음. 시연을 배포 환경에서 하면 그 프론트 주소를 `ALLOWED_ORIGINS` 에 추가해야 한다.
- 확인할 것: 시연을 로컬 Docker로 할지, 배포 주소로 할지.

### 🟠 R4. 예외·권한 보강
- `AiInventoryTool` 안의 `AccessDeniedException("인증이 필요합니다.")` 는 GlobalExceptionHandler에서 **403 FORBIDDEN** 으로 나간다. 미인증이면 401이 맞으므로 확인 부탁. (필터에서 먼저 401로 막혀서 실제로는 거의 안 탈 것으로 보임)
- 역할별로 조회 범위를 제한할 계획이 있으면 알려 주기. 지금은 모든 역할 허용이라 회귀 테스트 `AUTH-03` 기대값이 200이다. 제한하면 403으로 바꾼다.
- 데이터 변경 요청(예: "재고 100개로 바꿔줘")은 프롬프트로만 막혀 있다. 변경 함수가 아예 없으니 안전하지만, 거절 문구가 일정하게 나오는지 `GEN-02` 로 확인 예정.

### 🟠 R5. 유통기한 임박·만료 조회
- 기존 REST `GET /inventories/expiring` (`days`, `expiry_status`, `warehouse_id`, `page`) 을 함수로 감싸면 FE는 바로 붙는다.
- intent 값은 `EXPIRY` 하나로 가는 것을 제안 (FE는 `EXPIRING_SOON` · `EXPIRED` · `EXPIRING` 도 같은 '유통기한' 배지로 처리하도록 해 둠).
- `rows` 키는 `ExpiringLot` 그대로: `item_code, item_name, lot_number, expiry_date, days_until_expiry, quantity, expiry_status, warehouse_id`.
- 테스트 케이스 `EXP-01~04` 가 대기 중 (지금은 WARN으로만 기록).

### 🟡 R6. history 반영
- FE는 이미 직전 대화 최대 10개를 `history: [{ role: "user" | "assistant", content }]` 로 보낸다.
- 서버가 이를 Gemini `contents` 앞에 붙여 주면 "다음 페이지", "그 상품은?" 같은 이어지는 질문(`WH-04`)이 된다. 필드명·형식 확인 부탁.

### 🟡 R7. `GET /ai/capabilities` (선택)
- 없어도 FE는 기본 추천 질문을 쓴다. 만들면 형식은 아래로 맞춰 주면 추천 질문이 자동으로 바뀐다 (유통기한 추가 시 유용).
```json
{ "read_only": true, "capabilities": [ { "intent": "LOW_STOCK", "label": "부족 재고", "description": "…", "examples": ["…"] } ] }
```

## 3. 회귀 테스트 같이 돌리는 법
```bash
# Frontend 레포에서, 백엔드 Docker가 떠 있는 상태
AI_TEST_USERNAME=<관리자 ID> AI_TEST_PASSWORD=<비밀번호> pnpm test:ai
# WAREHOUSE 권한 케이스까지: AI_TEST_WAREHOUSE_USERNAME / AI_TEST_WAREHOUSE_PASSWORD 추가
```
결과는 `docs/chatbot/reports/` 에 마크다운으로 남는다. FAIL 항목을 B에게 전달.
