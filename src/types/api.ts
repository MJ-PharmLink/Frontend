/**
 * 최종 API 명세서(v1) · 도메인 명세서(DB 설계서) 기준 타입 정의.
 *
 * 필드명은 서버 응답 그대로 snake_case를 유지한다. 화면에서 쓰기 좋은 이름으로
 * 바꾸지 않는 이유는, 중간에 매핑 계층을 두면 명세와 대조할 때 어느 쪽이 맞는지
 * 매번 확인해야 하기 때문이다.
 */

/* ────────────────────────────── 공통 ────────────────────────────── */

/** ISO 8601 UTC 문자열 (예: 2026-09-10T05:00:00Z). 화면 표시용 KST 변환은 클라이언트 담당 */
export type IsoDateTime = string
/** yyyy-MM-dd (KST 기준 업무 날짜) */
export type IsoDate = string

export interface ResponseMeta {
  request_id: string
  timestamp: IsoDateTime
}

export interface Pagination {
  page: number
  page_size: number
  total_count: number
  total_pages: number
}

export interface ApiErrorDetail {
  field?: string
  issue?: string
  [key: string]: unknown
}

export interface ApiErrorBody {
  code: ErrorCode
  message: string
  details: ApiErrorDetail[]
}

export interface SuccessResponse<T> {
  success: true
  data: T
  pagination?: Pagination
  meta: ResponseMeta
}

export interface ErrorResponse {
  success: false
  error: ApiErrorBody
  meta: ResponseMeta
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

/** 목록 API 공통 결과. data와 pagination을 함께 돌려준다 */
export interface Page<T> {
  data: T[]
  pagination: Pagination
}

/** page 기본 1, page_size 기본 20 · 최대 100 (초과 시 서버가 100으로 절삭) */
export interface PageParams {
  page?: number
  page_size?: number
}

export interface DateRangeParams {
  start_date?: IsoDate
  end_date?: IsoDate
}

/* ────────────────────────────── Enum ────────────────────────────── */

export const USER_ROLES = ["ADMIN", "SALES", "WAREHOUSE"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const PARTNER_TYPES = ["CUSTOMER", "SUPPLIER"] as const
export type PartnerType = (typeof PARTNER_TYPES)[number]

export const ORDER_STATUSES = ["PENDING", "APPROVED", "CANCELLED"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const DELIVERY_STATUSES = ["WAITING", "SHIPPED", "DELIVERED"] as const
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

export const STOCK_STATUSES = ["NORMAL", "LOW_STOCK", "OUT_OF_STOCK"] as const
export type StockStatus = (typeof STOCK_STATUSES)[number]

export const EXPIRY_STATUSES = ["NORMAL", "EXPIRING_SOON", "EXPIRED"] as const
export type ExpiryStatus = (typeof EXPIRY_STATUSES)[number]

export const ITEM_STATUSES = ["ACTIVE", "DISCONTINUED"] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const TRANSACTION_TYPES = ["IN", "OUT", "ADJUST_IN", "ADJUST_OUT"] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const REFERENCE_TYPES = ["PURCHASE", "ORDER", "ADJUSTMENT"] as const
export type ReferenceType = (typeof REFERENCE_TYPES)[number]

export const ADJUSTMENT_TYPES = ["INCREASE", "DECREASE"] as const
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number]

export const ADJUSTMENT_REASONS = [
  "DAMAGED",
  "EXPIRED_DISPOSAL",
  "COUNT_CORRECTION",
  "RETURN",
  "OTHER",
] as const
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]

export const PARTNER_TRANSACTION_TYPES = ["ORDER", "SALE", "PURCHASE"] as const
export type PartnerTransactionType = (typeof PARTNER_TRANSACTION_TYPES)[number]

export const MARGIN_GROUP_BY = ["PARTNER", "ITEM"] as const
export type MarginGroupBy = (typeof MARGIN_GROUP_BY)[number]

/** 명세서 16장 Error Code 전체 목록 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "UNAUTHORIZED"
  | "ACCOUNT_DISABLED"
  | "FORBIDDEN"
  | "USER_NOT_FOUND"
  | "COMPANY_NOT_FOUND"
  | "PARTNER_NOT_FOUND"
  | "ITEM_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "WAREHOUSE_NOT_FOUND"
  | "INVENTORY_NOT_FOUND"
  | "LOT_NOT_FOUND"
  | "ORDER_NOT_FOUND"
  | "DELIVERY_NOT_FOUND"
  | "PURCHASE_NOT_FOUND"
  | "SALE_NOT_FOUND"
  | "RESOURCE_NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "DUPLICATE_USERNAME"
  | "DUPLICATE_BUSINESS_NUMBER"
  | "ITEM_ALREADY_EXISTS"
  | "CATEGORY_ALREADY_EXISTS"
  | "PARTNER_IN_USE"
  | "PARTNER_INACTIVE"
  | "ITEM_INACTIVE"
  | "INSUFFICIENT_STOCK"
  | "ORDER_ALREADY_APPROVED"
  | "INVALID_ORDER_STATUS"
  | "INVALID_DELIVERY_STATUS"
  | "SALE_ALREADY_RECORDED"
  | "INVALID_QUANTITY"
  | "INVALID_PARTNER_TYPE"
  | "INVALID_DATE_RANGE"
  | "INVALID_EXPIRY_DATE"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_SERVER_ERROR"
  | "INVENTORY_UPDATE_FAILED"
  | "SALE_CREATION_FAILED"
  | "PDF_GENERATION_FAILED"
  | "INVENTORY_QUERY_FAILED"

/* ───────────────────── 3. 인증 · 4. 사용자 ───────────────────── */

export interface AuthUser {
  user_id: number
  username: string
  name: string
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: "Bearer"
  /** Access Token 유효기간(초). refresh_token 유효기간은 응답에 포함되지 않는다 */
  expires_in: number
  user: AuthUser
}

export interface RefreshResponse {
  access_token: string
  token_type: "Bearer"
  expires_in: number
}

export interface MeResponse extends AuthUser {
  created_at: IsoDateTime
}

export interface User extends AuthUser {
  is_active: boolean
  created_at?: IsoDateTime
}

export interface UserListParams extends PageParams {
  role?: UserRole
  include_inactive?: boolean
}

export interface CreateUserRequest {
  username: string
  /** 8~64자 */
  password: string
  name: string
  role: UserRole
}

/** 보낸 필드만 수정된다 */
export interface UpdateUserRequest {
  name?: string
  role?: UserRole
  is_active?: boolean
  password?: string
}

/* ───────────────────── 5. 거래처 ───────────────────── */

export interface BusinessPartner {
  partner_id: number
  /** 등록 후 변경 불가 */
  partner_type: PartnerType
  name: string
  /** NNN-NN-NNNNN */
  business_number: string
  phone: string
  address: string
  manager_name: string | null
  is_active: boolean
  created_at?: IsoDateTime
  updated_at?: IsoDateTime
}

export interface PartnerListParams extends PageParams {
  partner_type?: PartnerType
  /** 거래처명 또는 사업자등록번호 검색 */
  keyword?: string
  include_inactive?: boolean
}

export interface CreatePartnerRequest {
  partner_type: PartnerType
  name: string
  business_number: string
  phone: string
  address: string
  manager_name?: string
}

/** PUT — 전체 교체. 보내지 않은 manager_name은 null이 된다. partner_type은 변경 불가 */
export type UpdatePartnerRequest = Omit<CreatePartnerRequest, "partner_type">

export interface PartnerTransaction {
  type: PartnerTransactionType
  /** ORDER 행에만 주문 상태가 들어가고 SALE·PURCHASE는 null */
  status: OrderStatus | null
  /** ORDER→order_id, SALE→sale_id, PURCHASE→purchase_id */
  reference_id: number
  /** ORDER·SALE이면 order_number, PURCHASE면 null */
  reference_number: string | null
  amount: number
  transaction_date: IsoDateTime
}

export interface PartnerTransactionParams extends PageParams, DateRangeParams {
  type?: PartnerTransactionType
}

/* ───────────────────── 6. 상품 · 카테고리 · 창고 ───────────────────── */

export interface Item {
  item_id: number
  /** IT-MED-{CC}-NNNN (CC: RI/GC/NP/EM/OT). 등록 후 수정 불가 */
  item_code: string
  item_name: string
  category_id: number
  category_name: string
  spec: string | null
  /** 정, 캡슐, 포, 병, 개 등 */
  unit: string
  unit_cost: number
  unit_price: number
  safety_stock: number
  supplier_id: number
  supplier_name: string
  is_active: boolean
  created_at?: IsoDateTime
  updated_at?: IsoDateTime
}

export interface ItemListParams extends PageParams {
  /** 상품 코드 또는 제품명 검색 */
  keyword?: string
  category_id?: number
  supplier_id?: number
  include_inactive?: boolean
}

export interface CreateItemRequest {
  /** 미입력 시 서버가 IT-MED-{카테고리코드}-NNNN 으로 자동 채번 */
  item_code?: string
  item_name: string
  category_id: number
  spec?: string
  unit: string
  unit_cost: number
  unit_price: number
  safety_stock?: number
  supplier_id: number
}

/** PATCH — 변경할 필드만 전송. item_code는 수정 불가 */
export interface UpdateItemRequest {
  item_name?: string
  category_id?: number
  spec?: string
  unit?: string
  unit_cost?: number
  unit_price?: number
  safety_stock?: number
  supplier_id?: number
  /** false = 단종, true = 단종 해제 */
  is_active?: boolean
}

export interface Category {
  category_id: number
  category_name: string
  description: string | null
  created_at: IsoDateTime
  updated_at?: IsoDateTime
}

export interface CreateCategoryRequest {
  category_name: string
  description?: string
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>

export interface Warehouse {
  warehouse_id: number
  name: string
  location: string | null
  is_default: boolean
}

export interface WarehouseSummary {
  total_item_count: number
  total_quantity: number
  by_stock_status: { normal: number; low_stock: number; out_of_stock: number }
  by_item_status: { active: number; discontinued: number }
  by_expiry_status: { normal: number; expiring_soon: number; expired: number }
}

export interface WarehouseDetail extends Warehouse {
  summary: WarehouseSummary
}

/* ───────────────────── 7. 재고 ───────────────────── */

export interface Inventory {
  inventory_id: number
  warehouse_id: number
  warehouse_name: string
  item_id: number
  item_code: string
  item_name: string
  item_status: ItemStatus
  /** 전체 수량 */
  quantity: number
  /** 만료 로트를 제외한 출고 가능 수량. 주문 승인 가능 여부는 이 값 기준 */
  available_quantity: number
  safety_stock: number
  stock_status: StockStatus
  lot_count?: number
  /** 만료되지 않은 로트 중 가장 빠른 유통기한 */
  nearest_expiry_date?: IsoDate | null
  expiry_status: ExpiryStatus
}

export interface InventoryLot {
  lot_id: number
  lot_number: string
  expiry_date: IsoDate
  quantity: number
  expiry_status: ExpiryStatus
  received_at: IsoDateTime
}

/** 로트는 유통기한 오름차순(FEFO). 수량 0인 로트는 제외된다 */
export interface InventoryDetail extends Omit<Inventory, "lot_count" | "nearest_expiry_date"> {
  lots: InventoryLot[]
}

export interface InventoryListParams extends PageParams {
  keyword?: string
  warehouse_id?: number
  category_id?: number
  stock_status?: StockStatus
  item_status?: ItemStatus
  expiry_status?: ExpiryStatus
}

export interface ExpiringLot {
  lot_id: number
  inventory_id: number
  warehouse_id: number
  item_id: number
  item_code: string
  item_name: string
  lot_number: string
  expiry_date: IsoDate
  /** 음수면 이미 만료 */
  days_until_expiry: number
  quantity: number
  expiry_status: ExpiryStatus
}

export interface ExpiringLotParams extends PageParams {
  /** 오늘부터 N일 이내 만료, 기본 90. EXPIRED에는 적용되지 않는다 */
  days?: number
  expiry_status?: Extract<ExpiryStatus, "EXPIRING_SOON" | "EXPIRED">
  warehouse_id?: number
}

export interface InventoryTransaction {
  transaction_id: number
  type: TransactionType
  reference_type: ReferenceType
  /** PURCHASE→purchase_id, ORDER→order_id, ADJUSTMENT→null */
  reference_id: number | null
  warehouse_id: number
  item_id: number
  item_code: string
  item_name: string
  lot_id: number
  lot_number: string
  /** 항상 양수 */
  quantity: number
  /** 해당 이력 반영 직후의 재고 수량 */
  quantity_after: number
  reason: AdjustmentReason | null
  memo: string | null
  created_by: number
  created_at: IsoDateTime
}

export interface TransactionListParams extends PageParams, DateRangeParams {
  item_id?: number
  warehouse_id?: number
  type?: TransactionType
}

/** DECREASE는 lot_id 필수, INCREASE로 신규 로트를 만들 때는 lot_number + expiry_date 필수 */
export interface InventoryAdjustmentRequest {
  warehouse_id: number
  item_id: number
  lot_id?: number
  lot_number?: string
  expiry_date?: IsoDate
  adjustment_type: AdjustmentType
  /** 1 이상 */
  quantity: number
  reason: AdjustmentReason
  memo?: string
}

/* ───────────────────── 8. 주문 ───────────────────── */

export interface OrderItem {
  order_item_id: number
  item_id: number
  item_code: string
  item_name: string
  quantity: number
  /** 주문 시점 스냅샷 */
  unit_price: number
  /** 주문 시점 스냅샷. 목록·등록 응답에는 없고 상세에만 포함된다 */
  unit_cost?: number
  line_amount: number
}

export interface OrderSummary {
  order_id: number
  /** ORD-YYYYMMDD-NNNN */
  order_number: string
  partner_id: number
  partner_name: string
  status: OrderStatus
  total_amount: number
  item_count: number
  created_by: number
  created_at: IsoDateTime
}

export interface OrderDetail {
  order_id: number
  order_number: string
  partner_id: number
  partner_name: string
  status: OrderStatus
  items: OrderItem[]
  total_amount: number
  /** 납품 미생성(PENDING·CANCELLED) 상태면 null */
  delivery_id: number | null
  cancel_reason: string | null
  approved_at: IsoDateTime | null
  cancelled_at: IsoDateTime | null
  cancelled_by: number | null
  created_by: number
  created_at: IsoDateTime
}

export interface OrderListParams extends PageParams, DateRangeParams {
  status?: OrderStatus
  partner_id?: number
}

/** 판매단가는 서버가 상품 마스터에서 조회해 스냅샷으로 저장한다 */
export interface CreateOrderRequest {
  partner_id: number
  items: { item_id: number; quantity: number }[]
}

export interface ApproveOrderResponse {
  order_id: number
  status: Extract<OrderStatus, "APPROVED">
  inventory_deducted: boolean
  delivery_id: number
  delivery_status: Extract<DeliveryStatus, "WAITING">
  approved_at: IsoDateTime
}

export interface CancelOrderResponse {
  order_id: number
  order_number: string
  status: Extract<OrderStatus, "CANCELLED">
  cancel_reason: string | null
  cancelled_by: number
  cancelled_at: IsoDateTime
}

/** 409 INSUFFICIENT_STOCK 의 details 항목 */
export interface InsufficientStockDetail {
  item_id: number
  item_name: string
  requested_quantity: number
  available_quantity: number
}

/* ───────────────────── 9. 납품 ───────────────────── */

export interface DeliveryItem {
  item_id: number
  item_code: string
  item_name: string
  quantity: number
  unit_price: number
  line_amount: number
}

export interface DeliverySummary {
  delivery_id: number
  order_id: number
  order_number: string
  partner_id: number
  partner_name: string
  status: DeliveryStatus
  total_amount: number
  created_at: IsoDateTime
}

export interface DeliveryDetail extends Omit<DeliverySummary, "total_amount"> {
  items: DeliveryItem[]
  total_amount: number
  shipped_at: IsoDateTime | null
  delivered_at: IsoDateTime | null
}

export interface DeliveryListParams extends PageParams, DateRangeParams {
  status?: DeliveryStatus
  partner_id?: number
}

export interface ShipDeliveryResponse {
  delivery_id: number
  order_id: number
  status: Extract<DeliveryStatus, "SHIPPED">
  shipped_at: IsoDateTime
}

export interface CompleteDeliveryResponse {
  delivery_id: number
  order_id: number
  status: Extract<DeliveryStatus, "DELIVERED">
  sale_id: number
  sales_amount: number
  cost_amount: number
  margin_amount: number
  delivered_at: IsoDateTime
}

/* ───────────────────── 10. 매입 ───────────────────── */

export interface PurchaseItem {
  purchase_item_id: number
  item_id: number
  item_code: string
  item_name: string
  quantity: number
  /** 매입 시점 스냅샷 */
  unit_cost: number
  line_amount: number
  lot_id: number
  lot_number: string
  expiry_date: IsoDate
  /** 등록 응답에만 포함 */
  quantity_after?: number
}

export interface PurchaseSummary {
  purchase_id: number
  partner_id: number
  partner_name: string
  warehouse_id: number
  purchase_date: IsoDate
  total_amount: number
  item_count: number
  created_by: number
  created_at: IsoDateTime
}

export interface PurchaseDetail {
  purchase_id: number
  partner_id: number
  partner_name: string
  warehouse_id: number
  purchase_date: IsoDate
  items: PurchaseItem[]
  total_amount: number
  created_by: number
  created_at: IsoDateTime
}

export interface PurchaseListParams extends PageParams, DateRangeParams {
  partner_id?: number
  warehouse_id?: number
}

/** 원가는 서버가 상품 마스터에서 조회해 스냅샷으로 저장한다 */
export interface CreatePurchaseRequest {
  partner_id: number
  /** 생략 시 기본 창고 */
  warehouse_id?: number
  purchase_date: IsoDate
  items: {
    item_id: number
    quantity: number
    lot_number: string
    /** 매입일 이후여야 한다 */
    expiry_date: IsoDate
  }[]
}

/* ───────────────────── 11. 매출 · 마진 ───────────────────── */

export interface SaleSummary {
  sale_id: number
  order_id: number
  delivery_id: number
  partner_id: number
  partner_name: string
  sales_amount: number
  cost_amount: number
  margin_amount: number
  /** 소수점 2자리. 매출액이 0이면 0 */
  margin_rate: number
  sale_date: IsoDate
}

export interface SaleItem {
  item_id: number
  item_code: string
  item_name: string
  quantity: number
  unit_price: number
  unit_cost: number
  sales_amount: number
  cost_amount: number
  margin_amount: number
}

export interface SaleDetail extends SaleSummary {
  order_number: string
  items: SaleItem[]
}

export interface SaleListParams extends PageParams, DateRangeParams {
  partner_id?: number
}

export interface MarginAmounts {
  sales_amount: number
  cost_amount: number
  margin_amount: number
  margin_rate: number
}

export interface MarginPartnerGroup extends MarginAmounts {
  partner_id: number
  partner_name: string
}

export interface MarginItemGroup extends MarginAmounts {
  item_id: number
  item_code: string
  item_name: string
}

export type MarginGroup = MarginPartnerGroup | MarginItemGroup

export interface MarginSummaryResponse {
  summary: MarginAmounts
  /** group_by 미지정 시 없음 */
  groups?: MarginGroup[]
}

export interface MarginSummaryParams {
  start_date: IsoDate
  end_date: IsoDate
  group_by?: MarginGroupBy
  partner_id?: number
  item_id?: number
}

/* ───────────────────── 12. 대시보드 ───────────────────── */

export interface DashboardSummary {
  period: { start_date: IsoDate; end_date: IsoDate }
  total_sales: number
  total_purchases: number
  total_margin: number
  margin_rate: number
  /** 주문·납품·재고 경고 건수는 조회 기간과 무관한 현재 시점 값 */
  pending_order_count: number
  waiting_delivery_count: number
  shipped_delivery_count: number
  low_stock_count: number
  expiring_soon_count: number
  expired_count: number
}

export interface LowStockItem {
  inventory_id: number
  warehouse_id: number
  item_id: number
  item_code: string
  item_name: string
  quantity: number
  safety_stock: number
  shortage_quantity: number
  stock_status: StockStatus
}

export interface RecentOrder {
  order_id: number
  order_number: string
  partner_id: number
  partner_name: string
  order_status: OrderStatus
  /** 납품 미생성이면 null */
  delivery_id: number | null
  delivery_status: DeliveryStatus | null
  total_amount: number
  created_at: IsoDateTime
}

/* ───────────────────── 13. 회사 정보 ───────────────────── */

export interface Company {
  company_id: number
  name: string
  business_number: string
  representative_name: string
  wholesale_license_number: string | null
  address: string
  phone: string
  fax: string | null
  email: string | null
  updated_at: IsoDateTime
}

export type UpdateCompanyRequest = Omit<Company, "company_id" | "updated_at"> & {
  wholesale_license_number?: string
  fax?: string
  email?: string
}
