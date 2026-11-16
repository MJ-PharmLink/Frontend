/**
 * 명세 구조 그대로의 샘플 데이터.
 *
 * 백엔드가 붙기 전까지 화면을 채우는 용도이며, 각 페이지가 제각각 상수를 들고
 * 있던 것을 한곳으로 모았다. 파생 값(재고 수량, 주문 합계, 매출·마진 등)은
 * 손으로 적지 않고 기준 데이터에서 계산한다. 숫자를 따로 적어두면 금방 서로
 * 어긋나기 때문이다.
 *
 * 날짜는 고정값 대신 오늘 기준 상대값으로 만든다. 그래야 언제 실행해도
 * 대시보드의 "이번 달" 집계가 비지 않는다.
 */

import type {
  BusinessPartner,
  Category,
  Company,
  DeliveryDetail,
  DeliveryStatus,
  ExpiringLot,
  ExpiryStatus,
  Inventory,
  InventoryDetail,
  InventoryLot,
  InventoryTransaction,
  Item,
  ItemStatus,
  OrderDetail,
  OrderItem,
  OrderStatus,
  PartnerTransaction,
  PurchaseDetail,
  SaleDetail,
  StockStatus,
  Warehouse,
} from "../types/api"

/* ────────────────────────────── 날짜 도우미 ────────────────────────────── */

const DAY = 24 * 60 * 60 * 1000

function kstDate(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  })
}

function kstDateTime(offsetDays: number, hour = 9): string {
  const d = new Date(Date.now() + offsetDays * DAY)
  d.setUTCHours(hour, 0, 0, 0)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}

export const TODAY = kstDate(0)

/** 유통기한 임박 판정 기준(서버 설정값, 명세 7.) */
export const EXPIRING_SOON_DAYS = 90

export function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00+09:00`).getTime()
  const today = new Date(`${TODAY}T00:00:00+09:00`).getTime()
  return Math.round((target - today) / DAY)
}

function expiryStatusOf(dateStr: string): ExpiryStatus {
  const left = daysUntil(dateStr)
  if (left < 0) return "EXPIRED"
  if (left <= EXPIRING_SOON_DAYS) return "EXPIRING_SOON"
  return "NORMAL"
}

/* ────────────────────────────── 기준 정보 ────────────────────────────── */

/** 13. 회사 정보 — 싱글 테넌트라 항상 1건이다 */
export const COMPANY: Company = {
  company_id: 1,
  name: "팜링크약품",
  business_number: "220-81-12345",
  representative_name: "김대표",
  wholesale_license_number: "제2026-서울-00123호",
  address: "서울시 송파구 올림픽로 300 15층",
  phone: "02-555-1234",
  fax: "02-555-1235",
  email: "contact@pharmlink.co.kr",
  updated_at: kstDateTime(-30),
}

export const WAREHOUSES: Warehouse[] = [
  { warehouse_id: 1, name: "본사 창고", location: "서울시 송파구 올림픽로 300", is_default: true },
]

export const DEFAULT_WAREHOUSE = WAREHOUSES[0]

export const CATEGORIES: Category[] = [
  { category_id: 1, category_name: "감염성질환 및 호흡기계", description: "감기, 알레르기, 객담, 코막힘, 인후염 등", created_at: kstDateTime(-250) },
  { category_id: 2, category_name: "소화기계 및 순환기계", description: "소화불량, 위산과다, 설사, 변비, 치질 등", created_at: kstDateTime(-250) },
  { category_id: 3, category_name: "신경계 및 정신/행동장애", description: "해열, 진통, 두통, 생리통 등", created_at: kstDateTime(-250) },
  { category_id: 4, category_name: "호르몬 및 대사성 의약품", description: "당뇨, 갑상선, 호르몬 조절 등", created_at: kstDateTime(-250) },
  { category_id: 5, category_name: "기타", description: "외용제, 의약외품 등", created_at: kstDateTime(-250) },
]

export const PARTNERS: BusinessPartner[] = [
  // 고객사 (CUSTOMER)
  { partner_id: 1, partner_type: "CUSTOMER", name: "새봄약국", business_number: "123-45-67890", phone: "02-1234-5678", address: "서울 마포구 양화로 12", manager_name: "김약사", is_active: true },
  { partner_id: 2, partner_type: "CUSTOMER", name: "라온종합병원", business_number: "124-86-10234", phone: "02-2258-5000", address: "서울 서초구 반포대로 222", manager_name: "이구매", is_active: true },
  { partner_id: 3, partner_type: "CUSTOMER", name: "다온메디유통", business_number: "128-81-55234", phone: "031-456-7890", address: "경기 고양시 덕양구 화정로 100", manager_name: "박대리", is_active: true },
  { partner_id: 4, partner_type: "CUSTOMER", name: "푸른길약국", business_number: "211-09-33451", phone: "02-555-1234", address: "서울 강남구 테헤란로 55", manager_name: "최약사", is_active: true },
  { partner_id: 5, partner_type: "CUSTOMER", name: "해솔메디컬센터", business_number: "602-81-77120", phone: "051-123-4567", address: "부산 해운대구 해운대로 15", manager_name: "정팀장", is_active: false },
  { partner_id: 6, partner_type: "CUSTOMER", name: "한빛대학병원", business_number: "129-82-44510", phone: "031-787-7000", address: "경기 성남시 분당구 구미로 173", manager_name: "한구매팀", is_active: true },
  { partner_id: 7, partner_type: "CUSTOMER", name: "별하약국", business_number: "110-23-88190", phone: "02-362-8800", address: "서울 서대문구 이화여대길 33", manager_name: "이약사", is_active: true },
  { partner_id: 8, partner_type: "CUSTOMER", name: "케이메드유통", business_number: "204-81-62330", phone: "02-966-5500", address: "서울 동대문구 왕산로 40", manager_name: "조부장", is_active: true },
  { partner_id: 9, partner_type: "CUSTOMER", name: "수원온병원", business_number: "135-82-19047", phone: "031-219-5000", address: "경기 수원시 영통구 월드컵로 164", manager_name: "강구매", is_active: true },
  { partner_id: 10, partner_type: "CUSTOMER", name: "바다약국", business_number: "601-11-25874", phone: "051-241-3300", address: "부산 중구 중앙대로 67", manager_name: "윤약사", is_active: true },
  { partner_id: 11, partner_type: "CUSTOMER", name: "늘봄병원", business_number: "305-82-30118", phone: "042-220-8000", address: "대전 중구 목중로 29", manager_name: "오팀장", is_active: false },
  { partner_id: 12, partner_type: "CUSTOMER", name: "유니온헬스유통", business_number: "119-81-70925", phone: "02-3452-7700", address: "서울 금천구 가산디지털1로 165", manager_name: "문대리", is_active: true },
  // 공급처 (SUPPLIER)
  { partner_id: 13, partner_type: "SUPPLIER", name: "아진바이오", business_number: "107-81-12345", phone: "02-8888-1234", address: "서울 영등포구 여의도동 25", manager_name: "오과장", is_active: true },
  { partner_id: 14, partner_type: "SUPPLIER", name: "메디코어제약", business_number: "220-81-83158", phone: "02-550-8100", address: "서울 강남구 삼성동 167", manager_name: "신부장", is_active: true },
  { partner_id: 15, partner_type: "SUPPLIER", name: "세움파마", business_number: "108-81-02290", phone: "02-828-0114", address: "서울 동작구 노량진로 74", manager_name: "권차장", is_active: true },
  { partner_id: 16, partner_type: "SUPPLIER", name: "한결제약", business_number: "101-81-06192", phone: "02-2194-0114", address: "서울 종로구 새문안로 5길 32", manager_name: "임과장", is_active: true },
  { partner_id: 17, partner_type: "SUPPLIER", name: "이노젠파마", business_number: "211-81-29774", phone: "02-480-3300", address: "서울 강남구 역삼로 514", manager_name: "남팀장", is_active: true },
  { partner_id: 18, partner_type: "SUPPLIER", name: "노바헬스코리아", business_number: "106-81-51510", phone: "02-2094-1114", address: "서울 용산구 한강대로 92", manager_name: "엄부장", is_active: true },
  { partner_id: 19, partner_type: "SUPPLIER", name: "그린셀제약", business_number: "135-81-11891", phone: "031-260-9114", address: "경기 용인시 기흥구 이현로 30", manager_name: "심차장", is_active: true },
  { partner_id: 20, partner_type: "SUPPLIER", name: "다온메디텍", business_number: "201-81-02355", phone: "02-6477-3114", address: "서울 서초구 신반포로 177", manager_name: "서과장", is_active: true },
  { partner_id: 21, partner_type: "SUPPLIER", name: "유니랩제약", business_number: "124-81-00998", phone: "031-580-7114", address: "경기 화성시 향남읍 향남로 641", manager_name: "류팀장", is_active: true },
  { partner_id: 22, partner_type: "SUPPLIER", name: "태성바이오", business_number: "109-81-37258", phone: "02-820-0114", address: "서울 강서구 양천로 583", manager_name: "안대리", is_active: false },
  { partner_id: 23, partner_type: "SUPPLIER", name: "웰니스팜", business_number: "101-86-41800", phone: "02-2194-1300", address: "서울 종로구 새문안로 5가길 28", manager_name: "배과장", is_active: true },
]

export const CUSTOMERS = PARTNERS.filter((p) => p.partner_type === "CUSTOMER")
export const SUPPLIERS = PARTNERS.filter((p) => p.partner_type === "SUPPLIER")

function partnerName(partnerId: number): string {
  return PARTNERS.find((p) => p.partner_id === partnerId)?.name ?? "-"
}

/* ────────────────────────────── 상품 ────────────────────────────── */

export const ITEMS: Item[] = [
  { item_id: 101, item_code: "IT-MED-RI-0001", item_name: "아목시실린 캡슐 500mg", category_id: 1, category_name: "감염성질환 및 호흡기계", spec: "500mg x 10캡슐", unit: "캡슐", unit_cost: 8500, unit_price: 13500, safety_stock: 100, supplier_id: 21, supplier_name: "유니랩제약", is_active: true },
  { item_id: 102, item_code: "IT-MED-RI-0002", item_name: "세프라딘 정 500mg", category_id: 1, category_name: "감염성질환 및 호흡기계", spec: "100정/PTP", unit: "정", unit_cost: 12000, unit_price: 18000, safety_stock: 100, supplier_id: 16, supplier_name: "한결제약", is_active: true },
  { item_id: 103, item_code: "IT-MED-RI-0003", item_name: "레보세티리진 정 5mg", category_id: 1, category_name: "감염성질환 및 호흡기계", spec: "30정/PTP", unit: "정", unit_cost: 2600, unit_price: 4300, safety_stock: 120, supplier_id: 21, supplier_name: "유니랩제약", is_active: true },
  { item_id: 201, item_code: "IT-MED-GC-0001", item_name: "아제스틴 정", category_id: 2, category_name: "소화기계 및 순환기계", spec: "500정/병", unit: "병", unit_cost: 15000, unit_price: 22000, safety_stock: 80, supplier_id: 14, supplier_name: "메디코어제약", is_active: true },
  { item_id: 202, item_code: "IT-MED-GC-0002", item_name: "암로디핀 베실산염 5mg", category_id: 2, category_name: "소화기계 및 순환기계", spec: "30정/PTP", unit: "정", unit_cost: 4200, unit_price: 6800, safety_stock: 150, supplier_id: 15, supplier_name: "세움파마", is_active: true },
  { item_id: 203, item_code: "IT-MED-GC-0003", item_name: "베아제정", category_id: 2, category_name: "소화기계 및 순환기계", spec: "100정/병", unit: "정", unit_cost: 10500, unit_price: 15000, safety_stock: 60, supplier_id: 14, supplier_name: "메디코어제약", is_active: true },
  { item_id: 301, item_code: "IT-MED-NP-0001", item_name: "뉴로펜 서방정 300mg", category_id: 3, category_name: "신경계 및 정신/행동장애", spec: "100정/병", unit: "정", unit_cost: 18000, unit_price: 27000, safety_stock: 50, supplier_id: 19, supplier_name: "그린셀제약", is_active: true },
  { item_id: 302, item_code: "IT-MED-NP-0002", item_name: "타이레놀정 500mg", category_id: 3, category_name: "신경계 및 정신/행동장애", spec: "500mg x 10정", unit: "정", unit_cost: 3500, unit_price: 5000, safety_stock: 30, supplier_id: 19, supplier_name: "그린셀제약", is_active: true },
  { item_id: 401, item_code: "IT-MED-EM-0001", item_name: "메트포르민 염산염 500mg", category_id: 4, category_name: "호르몬 및 대사성 의약품", spec: "100정/PTP", unit: "정", unit_cost: 3500, unit_price: 5500, safety_stock: 200, supplier_id: 17, supplier_name: "이노젠파마", is_active: true },
  { item_id: 402, item_code: "IT-MED-EM-0002", item_name: "레보티록신 정 0.1mg", category_id: 4, category_name: "호르몬 및 대사성 의약품", spec: "100정/병", unit: "정", unit_cost: 6400, unit_price: 9800, safety_stock: 40, supplier_id: 17, supplier_name: "이노젠파마", is_active: true },
  { item_id: 501, item_code: "IT-MED-OT-0001", item_name: "쿨렉스파스", category_id: 5, category_name: "기타", spec: "6매/봉", unit: "개", unit_cost: 2400, unit_price: 4200, safety_stock: 100, supplier_id: 13, supplier_name: "아진바이오", is_active: true },
  { item_id: 502, item_code: "IT-MED-OT-0002", item_name: "메디컬 소독용 에탄올 500mL", category_id: 5, category_name: "기타", spec: "500mL", unit: "병", unit_cost: 1800, unit_price: 3200, safety_stock: 60, supplier_id: 13, supplier_name: "아진바이오", is_active: false },
  { item_id: 104, item_code: "IT-MED-RI-0004", item_name: "뮤코라제 시럽 100mL", category_id: 1, category_name: "감염성질환 및 호흡기계", spec: "100mL/병", unit: "병", unit_cost: 3900, unit_price: 6200, safety_stock: 80, supplier_id: 16, supplier_name: "한결제약", is_active: true },
  { item_id: 204, item_code: "IT-MED-GC-0004", item_name: "라니티딘 정 150mg", category_id: 2, category_name: "소화기계 및 순환기계", spec: "100정/PTP", unit: "정", unit_cost: 2800, unit_price: 4600, safety_stock: 120, supplier_id: 15, supplier_name: "세움파마", is_active: true },
  { item_id: 303, item_code: "IT-MED-NP-0003", item_name: "이지엔6 이브 연질캡슐", category_id: 3, category_name: "신경계 및 정신/행동장애", spec: "10캡슐/PTP", unit: "캡슐", unit_cost: 4100, unit_price: 6500, safety_stock: 90, supplier_id: 19, supplier_name: "그린셀제약", is_active: true },
  { item_id: 403, item_code: "IT-MED-EM-0003", item_name: "마그비맥스 연질캡슐", category_id: 4, category_name: "호르몬 및 대사성 의약품", spec: "60캡슐/병", unit: "병", unit_cost: 7200, unit_price: 11500, safety_stock: 50, supplier_id: 17, supplier_name: "이노젠파마", is_active: true },
  { item_id: 503, item_code: "IT-MED-OT-0003", item_name: "비판텐 연고 30g", category_id: 5, category_name: "기타", spec: "30g/튜브", unit: "개", unit_cost: 5400, unit_price: 8300, safety_stock: 70, supplier_id: 23, supplier_name: "웰니스팜", is_active: true },
]

export function itemOf(itemId: number): Item {
  const found = ITEMS.find((i) => i.item_id === itemId)
  if (!found) throw new Error(`알 수 없는 item_id: ${itemId}`)
  return found
}

/* ────────────────────────────── 재고 · 로트 ────────────────────────────── */

/** 기준 데이터: (상품, 로트번호, 유통기한까지 남은 일수, 수량) */
const LOT_SEED: [number, string, number, number][] = [
  [101, "AX2609A", -12, 20],
  [101, "AX2704B", 180, 130],
  [102, "CP2612A", 65, 40],
  [102, "CP2801C", 300, 50],
  [103, "LV2610A", 25, 35],
  [201, "AZ2707A", 240, 180],
  [201, "AZ2611B", 48, 90],
  [202, "AM2802A", 360, 420],
  [203, "BA2703A", 150, 54],
  [301, "NR2609B", -5, 15],
  [301, "NR2706C", 210, 30],
  [302, "TL2512B", 80, 40],
  [302, "TL2706C", 230, 100],
  [401, "MF2804A", 400, 620],
  [402, "LT2610B", 30, 18],
  [501, "CX2705A", 190, 240],
  [502, "ET2608A", -30, 12],
  // 안전재고에 못 미치는 품목들 — 대시보드 재고 경고 목록에 쌓인다
  [104, "MC2611A", 55, 30],
  [204, "RN2705B", 175, 45],
  [303, "EZ2610C", 20, 22],
  [403, "MG2709A", 265, 38],
  [503, "BP2612B", 70, 16],
]

let lotSeq = 10
let inventorySeq = 0

interface InventoryRecord extends InventoryDetail {
  lots: InventoryLot[]
}

/** 창고 × 상품 단위로 묶고, 수량·상태는 로트에서 계산한다 */
function buildInventories(): InventoryRecord[] {
  const byItem = new Map<number, InventoryLot[]>()

  for (const [itemId, lotNumber, offset, quantity] of LOT_SEED) {
    const expiry = kstDate(offset)
    const lot: InventoryLot = {
      lot_id: ++lotSeq,
      lot_number: lotNumber,
      expiry_date: expiry,
      quantity,
      expiry_status: expiryStatusOf(expiry),
      received_at: kstDateTime(Math.min(-1, offset - 365), 4),
    }
    const list = byItem.get(itemId) ?? []
    list.push(lot)
    byItem.set(itemId, list)
  }

  return ITEMS.filter((item) => byItem.has(item.item_id)).map((item) => {
    const lots = (byItem.get(item.item_id) ?? []).sort((a, b) =>
      a.expiry_date.localeCompare(b.expiry_date),
    )
    const quantity = lots.reduce((sum, l) => sum + l.quantity, 0)
    // available_quantity 는 만료 로트를 제외한 출고 가능 수량(7.1)
    const available = lots
      .filter((l) => l.expiry_status !== "EXPIRED")
      .reduce((sum, l) => sum + l.quantity, 0)

    const stock_status: StockStatus =
      quantity === 0 ? "OUT_OF_STOCK" : quantity <= item.safety_stock ? "LOW_STOCK" : "NORMAL"

    // 가장 빠른 미출고 로트 기준으로 분류한다
    const earliest = lots.find((l) => l.quantity > 0)
    const expiry_status: ExpiryStatus = earliest ? earliest.expiry_status : "NORMAL"
    const nearest = lots.find((l) => l.quantity > 0 && l.expiry_status !== "EXPIRED")

    return {
      inventory_id: ++inventorySeq,
      warehouse_id: DEFAULT_WAREHOUSE.warehouse_id,
      warehouse_name: DEFAULT_WAREHOUSE.name,
      item_id: item.item_id,
      item_code: item.item_code,
      item_name: item.item_name,
      item_status: (item.is_active ? "ACTIVE" : "DISCONTINUED") as ItemStatus,
      quantity,
      available_quantity: available,
      safety_stock: item.safety_stock,
      stock_status,
      expiry_status,
      lots,
      lot_count: lots.filter((l) => l.quantity > 0).length,
      nearest_expiry_date: nearest?.expiry_date ?? null,
    }
  })
}

const INVENTORY_RECORDS = buildInventories()

/** 7.2 재고 상세(로트 포함) */
export const INVENTORY_DETAILS: InventoryDetail[] = INVENTORY_RECORDS

/** 7.1 전체 재고 조회 응답 모양 */
export const INVENTORIES: Inventory[] = INVENTORY_RECORDS.map(({ lots, ...rest }) => ({
  ...rest,
  lot_count: lots.filter((l) => l.quantity > 0).length,
  nearest_expiry_date:
    lots.find((l) => l.quantity > 0 && l.expiry_status !== "EXPIRED")?.expiry_date ?? null,
}))

/** 7.3 유통기한 임박/만료 로트 */
export const EXPIRING_LOTS: ExpiringLot[] = INVENTORY_RECORDS.flatMap((inv) =>
  inv.lots
    .filter((l) => l.quantity > 0 && l.expiry_status !== "NORMAL")
    .map((l) => ({
      lot_id: l.lot_id,
      inventory_id: inv.inventory_id,
      warehouse_id: inv.warehouse_id,
      item_id: inv.item_id,
      item_code: inv.item_code,
      item_name: inv.item_name,
      lot_number: l.lot_number,
      expiry_date: l.expiry_date,
      days_until_expiry: daysUntil(l.expiry_date),
      quantity: l.quantity,
      expiry_status: l.expiry_status,
    })),
).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))

/* ────────────────────────────── 주문 ────────────────────────────── */

/** 기준 데이터: (주문 번호 순번, 거래처, 며칠 전, 상태, [상품 ID, 수량][]) */
const ORDER_SEED: [number, number, number, OrderStatus, [number, number][]][] = [
  [89, 1, 0, "PENDING", [[302, 40], [103, 20]]],
  [88, 2, 1, "PENDING", [[201, 12], [202, 60]]],
  [87, 6, 2, "APPROVED", [[101, 30], [302, 50]]],
  [86, 4, 3, "APPROVED", [[401, 100], [203, 10]]],
  [85, 8, 5, "APPROVED", [[202, 80], [501, 40]]],
  [84, 3, 7, "APPROVED", [[102, 15], [301, 8]]],
  [83, 7, 9, "APPROVED", [[302, 60]]],
  [82, 9, 11, "APPROVED", [[401, 150], [402, 12]]],
  [81, 10, 14, "CANCELLED", [[501, 25]]],
  [80, 12, 16, "APPROVED", [[201, 20], [101, 25], [103, 30]]],
  [79, 2, 19, "APPROVED", [[202, 100]]],
  [78, 6, 22, "APPROVED", [[301, 12], [302, 30]]],
]

function orderNumber(seq: number, offsetDays: number): string {
  return `ORD-${kstDate(-offsetDays).replace(/-/g, "")}-${String(seq).padStart(4, "0")}`
}

let orderItemSeq = 1000

function buildOrders(): OrderDetail[] {
  return ORDER_SEED.map(([seq, partnerId, daysAgo, status, lines]) => {
    const items: OrderItem[] = lines.map(([itemId, quantity]) => {
      const item = itemOf(itemId)
      return {
        order_item_id: ++orderItemSeq,
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        quantity,
        // 등록 시점 단가 스냅샷 (3.12). 상품 마스터가 바뀌어도 변하지 않는다
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        line_amount: quantity * item.unit_price,
      }
    })

    const approved = status === "APPROVED"
    return {
      order_id: seq,
      order_number: orderNumber(seq, daysAgo),
      partner_id: partnerId,
      partner_name: partnerName(partnerId),
      status,
      items,
      total_amount: items.reduce((sum, i) => sum + i.line_amount, 0),
      delivery_id: approved ? seq : null,
      cancel_reason: status === "CANCELLED" ? "거래처 요청으로 주문 철회" : null,
      approved_at: approved ? kstDateTime(-daysAgo, 6) : null,
      cancelled_at: status === "CANCELLED" ? kstDateTime(-daysAgo, 7) : null,
      cancelled_by: status === "CANCELLED" ? 2 : null,
      created_by: 2,
      created_at: kstDateTime(-daysAgo, 5),
    }
  })
}

export const ORDERS: OrderDetail[] = buildOrders()

function orderOf(orderId: number): OrderDetail | undefined {
  return ORDERS.find((o) => o.order_id === orderId)
}

/* ────────────────────────────── 납품 ────────────────────────────── */

/** 승인된 주문에만 납품이 생긴다(8.4). 오래된 건일수록 진행 단계가 앞서 있다 */
function deliveryStatusFor(daysAgo: number): DeliveryStatus {
  if (daysAgo >= 7) return "DELIVERED"
  if (daysAgo >= 3) return "SHIPPED"
  return "WAITING"
}

function buildDeliveries(): DeliveryDetail[] {
  return ORDERS.filter((o) => o.status === "APPROVED").map((order) => {
    const daysAgo = Math.round(
      (Date.parse(`${TODAY}T00:00:00Z`) - Date.parse(order.created_at)) / DAY,
    )
    const status = deliveryStatusFor(daysAgo)
    return {
      delivery_id: order.order_id,
      order_id: order.order_id,
      order_number: order.order_number,
      partner_id: order.partner_id,
      partner_name: order.partner_name,
      status,
      items: order.items.map((i) => ({
        item_id: i.item_id,
        item_code: i.item_code,
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_amount: i.line_amount,
      })),
      total_amount: order.total_amount,
      created_at: order.approved_at ?? order.created_at,
      shipped_at: status === "WAITING" ? null : kstDateTime(-daysAgo, 7),
      delivered_at: status === "DELIVERED" ? kstDateTime(-daysAgo, 9) : null,
    }
  })
}

export const DELIVERIES: DeliveryDetail[] = buildDeliveries()

/* ────────────────────────────── 매출 · 마진 ────────────────────────────── */

/** 매출은 납품 완료 시에만 생성된다(9.4). 단가는 주문 라인 스냅샷을 쓴다 */
function buildSales(): SaleDetail[] {
  let saleSeq = 300
  return DELIVERIES.filter((d) => d.status === "DELIVERED").map((delivery) => {
    const order = orderOf(delivery.order_id)!
    const items = order.items.map((i) => ({
      item_id: i.item_id,
      item_code: i.item_code,
      item_name: i.item_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      unit_cost: i.unit_cost ?? 0,
      sales_amount: i.quantity * i.unit_price,
      cost_amount: i.quantity * (i.unit_cost ?? 0),
      margin_amount: i.quantity * (i.unit_price - (i.unit_cost ?? 0)),
    }))
    const sales_amount = items.reduce((s, i) => s + i.sales_amount, 0)
    const cost_amount = items.reduce((s, i) => s + i.cost_amount, 0)
    const margin_amount = sales_amount - cost_amount
    return {
      sale_id: ++saleSeq,
      order_id: order.order_id,
      order_number: order.order_number,
      delivery_id: delivery.delivery_id,
      partner_id: order.partner_id,
      partner_name: order.partner_name,
      items,
      sales_amount,
      cost_amount,
      margin_amount,
      // sales_amount 가 0이면 마진율은 0 (3.16)
      margin_rate: sales_amount === 0 ? 0 : Number(((margin_amount / sales_amount) * 100).toFixed(2)),
      sale_date: (delivery.delivered_at ?? "").slice(0, 10),
    }
  })
}

export const SALES: SaleDetail[] = buildSales()

/* ────────────────────────────── 매입 ────────────────────────────── */

/** 기준 데이터: (매입 ID, 공급처, 며칠 전, [상품 ID, 수량, 로트번호, 유통기한까지 일수][]) */
const PURCHASE_SEED: [number, number, number, [number, number, string, number][]][] = [
  [208, 21, 1, [[101, 200, "AX2705C", 210], [103, 150, "LV2708B", 300]]],
  [207, 14, 3, [[201, 100, "AZ2709C", 270], [203, 80, "BA2707B", 240]]],
  [206, 19, 6, [[301, 60, "NR2707D", 240], [302, 200, "TL2708E", 280]]],
  [205, 17, 10, [[401, 500, "MF2805B", 420], [402, 60, "LT2707C", 250]]],
  [204, 15, 13, [[202, 300, "AM2806B", 380]]],
  [203, 16, 17, [[102, 120, "CP2804D", 330]]],
  [202, 13, 21, [[501, 180, "CX2706B", 200]]],
  [201, 21, 26, [[101, 150, "AX2704B", 180]]],
]

let purchaseItemSeq = 400
let purchaseLotSeq = 200

function buildPurchases(): PurchaseDetail[] {
  return PURCHASE_SEED.map(([purchaseId, partnerId, daysAgo, lines]) => {
    const items = lines.map(([itemId, quantity, lotNumber, expiryOffset]) => {
      const item = itemOf(itemId)
      return {
        purchase_item_id: ++purchaseItemSeq,
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        quantity,
        // 매입 시점 원가 스냅샷 (3.15)
        unit_cost: item.unit_cost,
        line_amount: quantity * item.unit_cost,
        lot_id: ++purchaseLotSeq,
        lot_number: lotNumber,
        expiry_date: kstDate(expiryOffset),
      }
    })
    return {
      purchase_id: purchaseId,
      partner_id: partnerId,
      partner_name: partnerName(partnerId),
      warehouse_id: DEFAULT_WAREHOUSE.warehouse_id,
      purchase_date: kstDate(-daysAgo),
      items,
      total_amount: items.reduce((sum, i) => sum + i.line_amount, 0),
      created_by: 3,
      created_at: kstDateTime(-daysAgo, 4),
    }
  })
}

export const PURCHASES: PurchaseDetail[] = buildPurchases()

/* ────────────────────────────── 재고 이력 ────────────────────────────── */

/**
 * 입고는 매입(10.2), 출고는 주문 승인(8.4)에서 생긴다. 조정은 7.4로만 가능하다.
 * quantity_after 는 샘플이므로 현재 재고 수량을 기준으로 근사한다.
 */
function buildTransactions(): InventoryTransaction[] {
  const rows: InventoryTransaction[] = []
  let seq = 100

  for (const purchase of PURCHASES) {
    for (const line of purchase.items) {
      const inv = INVENTORIES.find((i) => i.item_id === line.item_id)
      rows.push({
        transaction_id: ++seq,
        type: "IN",
        reference_type: "PURCHASE",
        reference_id: purchase.purchase_id,
        warehouse_id: purchase.warehouse_id,
        item_id: line.item_id,
        item_code: line.item_code,
        item_name: line.item_name,
        lot_id: line.lot_id,
        lot_number: line.lot_number,
        quantity: line.quantity,
        quantity_after: inv?.quantity ?? line.quantity,
        reason: null,
        memo: null,
        created_by: 3,
        created_at: purchase.created_at,
      })
    }
  }

  for (const order of ORDERS.filter((o) => o.status === "APPROVED")) {
    for (const line of order.items) {
      const inv = INVENTORY_DETAILS.find((i) => i.item_id === line.item_id)
      const lot = inv?.lots[0]
      rows.push({
        transaction_id: ++seq,
        type: "OUT",
        reference_type: "ORDER",
        reference_id: order.order_id,
        warehouse_id: DEFAULT_WAREHOUSE.warehouse_id,
        item_id: line.item_id,
        item_code: line.item_code,
        item_name: line.item_name,
        lot_id: lot?.lot_id ?? 0,
        lot_number: lot?.lot_number ?? "-",
        quantity: line.quantity,
        quantity_after: inv?.quantity ?? 0,
        reason: null,
        memo: null,
        created_by: 2,
        created_at: order.approved_at ?? order.created_at,
      })
    }
  }

  rows.push({
    transaction_id: ++seq,
    type: "ADJUST_OUT",
    reference_type: "ADJUSTMENT",
    reference_id: null,
    warehouse_id: DEFAULT_WAREHOUSE.warehouse_id,
    item_id: 502,
    item_code: "IT-MED-OT-0002",
    item_name: "메디컬 소독용 에탄올 500mL",
    lot_id: 27,
    lot_number: "ET2608A",
    quantity: 8,
    quantity_after: 12,
    reason: "EXPIRED_DISPOSAL",
    memo: "유통기한 만료 로트 폐기",
    created_by: 1,
    created_at: kstDateTime(-4, 8),
  })

  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export const TRANSACTIONS: InventoryTransaction[] = buildTransactions()

/* ────────────────────────────── 거래처별 거래 이력 ────────────────────────────── */

/** 행 정렬 우선순위 — 시각이 같으면 SALE → PURCHASE → ORDER 순(5.6) */
const TRANSACTION_ORDER: Record<PartnerTransaction["type"], number> = {
  SALE: 0,
  PURCHASE: 1,
  ORDER: 2,
}

/**
 * 5.6 거래처별 거래 이력.
 * 고객사는 ORDER·SALE, 공급처는 PURCHASE만 발생한다. 취소된 주문도 포함한다.
 */
export function partnerTransactions(partnerId: number): PartnerTransaction[] {
  const rows: PartnerTransaction[] = []

  for (const order of ORDERS.filter((o) => o.partner_id === partnerId)) {
    rows.push({
      type: "ORDER",
      status: order.status,
      reference_id: order.order_id,
      reference_number: order.order_number,
      amount: order.total_amount,
      transaction_date: order.created_at,
    })
  }

  for (const sale of SALES.filter((s) => s.partner_id === partnerId)) {
    rows.push({
      type: "SALE",
      status: null,
      reference_id: sale.sale_id,
      reference_number: sale.order_number,
      amount: sale.sales_amount,
      transaction_date: `${sale.sale_date}T09:00:00Z`,
    })
  }

  for (const purchase of PURCHASES.filter((p) => p.partner_id === partnerId)) {
    rows.push({
      type: "PURCHASE",
      status: null,
      reference_id: purchase.purchase_id,
      reference_number: null,
      amount: purchase.total_amount,
      transaction_date: purchase.created_at,
    })
  }

  return rows.sort(
    (a, b) =>
      b.transaction_date.localeCompare(a.transaction_date) ||
      TRANSACTION_ORDER[a.type] - TRANSACTION_ORDER[b.type],
  )
}
