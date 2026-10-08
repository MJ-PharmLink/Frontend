/**
 * 최종 API 명세서(v1)의 엔드포인트를 그대로 옮긴 호출 함수 모음.
 * 장 번호는 명세서 목차를 따른다.
 */

import { request, requestBlob, requestEmpty, requestPage } from "./client"
import type {
  ApproveOrderResponse,
  BusinessPartner,
  CancelOrderResponse,
  Category,
  Company,
  CompleteDeliveryResponse,
  CreateCategoryRequest,
  CreateItemRequest,
  CreateOrderRequest,
  CreatePartnerRequest,
  CreatePurchaseRequest,
  CreateUserRequest,
  DashboardSummary,
  DateRangeParams,
  DeliveryDetail,
  DeliveryListParams,
  DeliverySummary,
  ExpiringLot,
  ExpiringLotParams,
  Inventory,
  InventoryAdjustmentRequest,
  InventoryDetail,
  InventoryListParams,
  InventoryTransaction,
  Item,
  ItemListParams,
  LowStockItem,
  MarginSummaryParams,
  MarginSummaryResponse,
  MeResponse,
  OrderDetail,
  OrderListParams,
  OrderSummary,
  Page,
  PartnerListParams,
  PartnerTransaction,
  PartnerTransactionParams,
  PurchaseDetail,
  PurchaseListParams,
  PurchaseSummary,
  RecentOrder,
  SaleDetail,
  SaleListParams,
  SaleSummary,
  ShipDeliveryResponse,
  TransactionListParams,
  UpdateCategoryRequest,
  UpdateCompanyRequest,
  UpdateItemRequest,
  UpdatePartnerRequest,
  UpdateUserRequest,
  User,
  UserListParams,
  Warehouse,
  WarehouseDetail,
} from "../types/api"

/** 타입이 있는 쿼리 객체를 buildQuery가 받는 형태로 넘기기 위한 변환 */
const q = (params?: object) => params as Record<string, string | number | boolean | undefined>

/* ───────────────────── 3. 인증 ───────────────────── */
/** 로그인·로그아웃은 토큰을 다뤄야 해서 client.ts에 있다 (login / logout) */

export const authApi = {
  /** 3.4 내 정보 조회 */
  me: () => request<MeResponse>("/auth/me"),
}

/* ───────────────────── 4. 사용자 — 관리자 전용 ───────────────────── */

export const usersApi = {
  /** 4.1 사용자 목록 조회 */
  list: (params?: UserListParams) => requestPage<User>("/users", { query: q(params) }),
  /** 4.2 사용자 계정 생성 */
  create: (body: CreateUserRequest) => request<User>("/users", { method: "POST", body }),
  /** 4.3 사용자 정보/역할 수정 — 보낸 필드만 수정 */
  update: (userId: number, body: UpdateUserRequest) =>
    request<User>(`/users/${userId}`, { method: "PATCH", body }),
  /** 4.4 사용자 삭제(비활성화) */
  deactivate: (userId: number) => requestEmpty(`/users/${userId}`, { method: "DELETE" }),
}

/* ───────────────────── 5. 거래처 ───────────────────── */

export const partnersApi = {
  /** 5.1 거래처 목록 조회 */
  list: (params?: PartnerListParams) =>
    requestPage<BusinessPartner>("/business-partners", { query: q(params) }),
  /** 5.2 거래처 등록 */
  create: (body: CreatePartnerRequest) =>
    request<BusinessPartner>("/business-partners", { method: "POST", body }),
  /** 5.3 거래처 상세 조회 — 비활성 거래처도 조회된다 */
  get: (partnerId: number) => request<BusinessPartner>(`/business-partners/${partnerId}`),
  /** 5.4 거래처 정보 수정 — 전체 교체(PUT). partner_type은 변경 불가 */
  update: (partnerId: number, body: UpdatePartnerRequest) =>
    request<BusinessPartner>(`/business-partners/${partnerId}`, { method: "PUT", body }),
  /** 5.5 거래처 삭제(비활성화) */
  deactivate: (partnerId: number) =>
    requestEmpty(`/business-partners/${partnerId}`, { method: "DELETE" }),
  /** 5.6 거래처별 거래 이력 조회 */
  transactions: (partnerId: number, params?: PartnerTransactionParams) =>
    requestPage<PartnerTransaction>(`/business-partners/${partnerId}/transactions`, {
      query: q(params),
    }),
}

/* ───────────────────── 6. 상품 · 카테고리 · 창고 ───────────────────── */

export const itemsApi = {
  /** 6.1 상품 목록 조회 */
  list: (params?: ItemListParams) => requestPage<Item>("/items", { query: q(params) }),
  /** 6.2 상품 상세 조회 — 단종 상품도 조회된다 */
  get: (itemId: number) => request<Item>(`/items/${itemId}`),
  /** 6.3 상품 등록 — item_code 미입력 시 서버가 채번 */
  create: (body: CreateItemRequest) => request<Item>("/items", { method: "POST", body }),
  /** 6.4 상품 수정 — 변경할 필드만 전송. is_active:false 로 단종 처리 */
  update: (itemId: number, body: UpdateItemRequest) =>
    request<Item>(`/items/${itemId}`, { method: "PATCH", body }),
}

export const categoriesApi = {
  /** 6.5 카테고리 목록 조회 — 페이지네이션 없음 */
  list: () => request<Category[]>("/categories"),
  /** 6.6 카테고리 생성 — 관리자 */
  create: (body: CreateCategoryRequest) =>
    request<Category>("/categories", { method: "POST", body }),
  /** 6.7 카테고리 수정 — 관리자. 삭제 API는 제공되지 않는다 */
  update: (categoryId: number, body: UpdateCategoryRequest) =>
    request<Category>(`/categories/${categoryId}`, { method: "PATCH", body }),
}

export const warehousesApi = {
  /** 6.8 창고 목록 조회 — 생성 API는 제공되지 않는다 */
  list: () => request<Warehouse[]>("/warehouses"),
  /** 6.9 창고 상세(재고 요약) 조회 */
  get: (warehouseId: number) => request<WarehouseDetail>(`/warehouses/${warehouseId}`),
}

/* ───────────────────── 7. 재고 ───────────────────── */

export const inventoriesApi = {
  /** 7.1 전체 재고 조회 */
  list: (params?: InventoryListParams) =>
    requestPage<Inventory>("/inventories", { query: q(params) }),
  /** 7.2 재고 상세(로트 포함) 조회 — 로트는 FEFO 순, 수량 0은 제외 */
  get: (inventoryId: number) => request<InventoryDetail>(`/inventories/${inventoryId}`),
  /** 7.3 유통기한 임박/만료 로트 조회 */
  expiring: (params?: ExpiringLotParams) =>
    requestPage<ExpiringLot>("/inventories/expiring", { query: q(params) }),
  /** 7.4 재고 조정 — 관리자 전용 */
  adjust: (body: InventoryAdjustmentRequest) =>
    request<InventoryTransaction>("/inventory-adjustments", { method: "POST", body }),
  /** 7.5 재고 이력 조회 */
  transactions: (params?: TransactionListParams) =>
    requestPage<InventoryTransaction>("/inventory-transactions", { query: q(params) }),
}

/* ───────────────────── 8. 주문 ───────────────────── */

export const ordersApi = {
  /** 8.1 주문 목록 조회 */
  list: (params?: OrderListParams) => requestPage<OrderSummary>("/orders", { query: q(params) }),
  /** 8.2 주문 등록 — 등록 직후 PENDING. 재고는 승인 시 차감된다 */
  create: (body: CreateOrderRequest) => request<OrderDetail>("/orders", { method: "POST", body }),
  /** 8.3 주문 상세 조회 */
  get: (orderId: number) => request<OrderDetail>(`/orders/${orderId}`),
  /** 8.4 주문 승인 — 재고 차감(FEFO) + 납품 생성. 재고 부족 시 409 INSUFFICIENT_STOCK */
  approve: (orderId: number) =>
    request<ApproveOrderResponse>(`/orders/${orderId}/approve`, { method: "POST" }),
  /** 8.5 주문 취소 — PENDING 상태에서만 가능 */
  cancel: (orderId: number, cancel_reason?: string) =>
    request<CancelOrderResponse>(`/orders/${orderId}/cancel`, {
      method: "POST",
      body: { cancel_reason },
    }),
}

/* ───────────────────── 9. 납품 ───────────────────── */

export const deliveriesApi = {
  /** 9.1 납품 목록 조회 */
  list: (params?: DeliveryListParams) =>
    requestPage<DeliverySummary>("/deliveries", { query: q(params) }),
  /** 9.2 납품 상세 조회 */
  get: (deliveryId: number) => request<DeliveryDetail>(`/deliveries/${deliveryId}`),
  /** 9.3 출고 완료 처리 (WAITING → SHIPPED) */
  ship: (deliveryId: number) =>
    request<ShipDeliveryResponse>(`/deliveries/${deliveryId}/ship`, { method: "POST" }),
  /** 9.4 납품 완료 처리 (SHIPPED → DELIVERED) — 매출이 자동 생성된다 */
  complete: (deliveryId: number) =>
    request<CompleteDeliveryResponse>(`/deliveries/${deliveryId}/complete`, { method: "POST" }),
  /** 9.5 납품서 PDF — Envelope가 아닌 PDF binary를 반환한다 */
  document: (deliveryId: number) => requestBlob(`/deliveries/${deliveryId}/document`),
}

/* ───────────────────── 10. 매입 ───────────────────── */

export const purchasesApi = {
  /** 10.1 매입 목록 조회 */
  list: (params?: PurchaseListParams) =>
    requestPage<PurchaseSummary>("/purchases", { query: q(params) }),
  /** 10.2 매입 등록 — 로트 생성 + 재고 증가 + 재고 이력(IN)이 한 트랜잭션 */
  create: (body: CreatePurchaseRequest) =>
    request<PurchaseDetail>("/purchases", { method: "POST", body }),
  /** 10.3 매입 상세 조회 */
  get: (purchaseId: number) => request<PurchaseDetail>(`/purchases/${purchaseId}`),
}

/* ───────────────────── 11. 매출 · 마진 ───────────────────── */

export const salesApi = {
  /** 11.1 매출 목록 조회 — 매출은 납품 완료 시 자동 생성되며 등록 API는 없다 */
  list: (params?: SaleListParams) => requestPage<SaleSummary>("/sales", { query: q(params) }),
  /** 11.2 매출 상세 및 거래 건별 마진 조회 */
  get: (saleId: number) => request<SaleDetail>(`/sales/${saleId}`),
  /** 11.3 마진 집계 조회 — start_date·end_date 필수 */
  margins: (params: MarginSummaryParams) =>
    request<MarginSummaryResponse>("/margins/summary", { query: q(params) }),
}

/* ───────────────────── 12. 대시보드 ───────────────────── */

export const dashboardApi = {
  /** 12.1 매출/매입/마진 요약 — 기간 미지정 시 당월 1일 ~ 오늘(KST) */
  summary: (params?: DateRangeParams) =>
    request<DashboardSummary>("/dashboard/summary", { query: q(params) }),
  /** 12.2 재고 부족 품목 조회 — 부족 수량 내림차순 */
  lowStockItems: (params?: { warehouse_id?: number; page?: number; page_size?: number }) =>
    requestPage<LowStockItem>("/dashboard/low-stock-items", { query: q(params) }),
  /** 12.3 최근 주문/납품 현황 조회 — 페이지네이션 없음, limit 기본 10 · 최대 50 */
  recentOrders: (limit?: number) =>
    request<RecentOrder[]>("/dashboard/recent-orders", { query: { limit } }),
}

/* ───────────────────── 13. 회사 정보 ───────────────────── */

export const companyApi = {
  /** 13.1 회사 정보 조회 */
  get: () => request<Company>("/company"),
  /** 13.2 회사 정보 수정 — 관리자. 전체 교체(PUT) */
  update: (body: UpdateCompanyRequest) => request<Company>("/company", { method: "PUT", body }),
}

export type { Page }
