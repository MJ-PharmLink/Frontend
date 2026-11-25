# 챗봇 로컬 연동 실행 순서 (FE + BE + MySQL)

시연과 통합 테스트는 **로컬 Docker** 기준이다.

## 1. 백엔드 (Backend 저장소, `dev`)

1. 설정 파일 두 개를 만든다. 둘 다 `.gitignore` 대상이며 **절대 커밋하지 않는다.**
    - 저장소 루트 `.env`
      ```
      MYSQL_ROOT_PASSWORD=<비밀번호>
      MYSQL_DATABASE=pharm_erp
      ```
    - `src/main/resources/application-secret.yml`
      ```yaml
      # 값은 큰따옴표로 감싼다 (비밀번호에 : # 같은 기호가 있어도 YAML이 깨지지 않도록)
      jwt:
        secret: "<openssl rand -hex 32 결과, 32자 이상>"
      admin:
        username: "<관리자 아이디>"
        password: "<8~64자 비밀번호>"
      ai:
        gemini:
          api-key: "<Google AI Studio에서 발급한 키>"
      ```
2. `docker compose up -d --build` : MySQL(127.0.0.1:3307)과 백엔드(127.0.0.1:8080)가 뜬다
3. 시연 데이터를 넣는다. 기본 시드에는 회사·창고 1개·카테고리만 있고, 시연 데이터(`db/demo`)는 운영 프로필에서만 자동으로 들어간다.
    - 저장소 루트에 `docker-compose.override.yml` 을 만든다 (docker compose가 자동으로 같이 읽는다, **커밋하지 않는다**)
      ```yaml
      services:
        backend:
          environment:
            SPRING_FLYWAY_LOCATIONS: classpath:db/migration,classpath:db/demo
      ```
    - `docker compose up -d` → 백엔드 로그에 `Migrating schema ... to version "2.1 - demo data"` 가 보이면 적용된 것이다.
    - 시연 데이터는 업무 데이터와 **관리자 외 계정을 모두 지우고** 다시 채운다. 창고·영업 계정은 적용 뒤 사용자 관리에서 만든다.
    - 관리자 계정이 있어야 들어간다. 새로 만든 DB라면 이 파일 없이 한 번 띄워 관리자 계정을 만든 뒤 넣는다. 순서를 어겨 `Column 'created_by' cannot be null` 로 실패했다면 실패 기록을 지우고 다시 띄운다 (데이터는 되돌려져 있다).
      ```bash
      docker exec pharm-erp-db sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -uroot pharm_erp -e "DELETE FROM flyway_schema_history WHERE success = 0"'
      ```
4. 확인 : `curl -s localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"…","password":"…"}'` → `access_token`

> Gemini 키가 없어도 서버는 뜬다. 그때 챗봇은 503 `AI_SERVICE_UNAVAILABLE` 을 돌려주므로 오류 화면 확인에 쓸 수 있다. 키를 바꾼 뒤에는 `docker compose up -d --build backend` 로 다시 띄운다.

## 2. 프론트 (Frontend 저장소, `feat/ai-chatbot-frontend`)

1. `cp .env.example .env` → `VITE_API_BASE_URL=http://localhost:8080/api/v1` 확인
2. `pnpm install --frozen-lockfile` → `pnpm dev --port 5173` (백엔드 CORS 허용 주소가 5173)
3. 로그인 → 오른쪽 아래 말풍선 버튼
4. 첫 질문 : "재고 조정은 어떻게 해?" 처럼 데이터가 필요 없는 질문으로 키가 동작하는지 먼저 본다

## 3. 시연 데이터 확인

| 질문 | 기대 |
|---|---|
| 아목시실린 캡슐 500mg의 현재 재고를 실제 ERP에서 조회해서 창고명과 수량을 알려줘. | INVENTORY · 본사 창고 62개 |
| 창고 ID가 1인 창고의 재고를 실제 ERP에서 조회해서 상품명과 현재 재고 수량을 알려줘. | INVENTORY · 46개 품목 중 첫 페이지, 생리식염수 35개, 진통 소염 겔 46개 |
| 현재 재고가 부족한 상품을 실제 ERP에서 조회해서 상품명, 현재 수량, 안전재고를 알려줘. | LOW_STOCK · 6건, 1순위 판크레아틴 복합 정 (현재 5개, 안전재고 20개) |

## 4. 회귀 테스트

```bash
AI_TEST_USERNAME=<관리자> AI_TEST_PASSWORD=<PW> \
AI_TEST_WAREHOUSE_USERNAME=<창고> AI_TEST_WAREHOUSE_PASSWORD=<PW> \
AI_TEST_SALES_USERNAME=<영업> AI_TEST_SALES_PASSWORD=<PW> \
pnpm test:ai
```
- 질문 사이 기본 5초 대기(`--delay`). 29개 × AI 호출 최대 2번이라 무료 한도를 넘지 않도록 줄이지 않는다.
- 창고·영업 계정이 없으면 AUTH-03/04는 SKIP.
- 보고서 : `docs/chatbot/reports/ai-regression-<시각>.md` (Git 제외). FAIL은 원인 확인, WARN은 답변 원문을 직접 확인.
- 일부만 다시 : `pnpm test:ai --only LS-02,EXP`
