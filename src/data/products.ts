export interface ProductMaster {
  code: string
  name: string
  category: string
  indication: string   // 대표 용도
  spec: string
  unit: string
  costPrice: number
  salePrice: number
  stock: number
  safetyStock: number
  manufacturer: string
  drugType: "전문의약품" | "일반의약품" | "건강기능식품"
  status: "정상" | "단종"
}

export const CATEGORIES = [
  "감염성질환 및 호흡기계",
  "소화기계 및 순환기계",
  "신경계 및 정신/행동장애",
  "호르몬 및 대사성 의약품",
  "기타",
] as const

export const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "감염성질환 및 호흡기계": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  "소화기계 및 순환기계":   { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
  "신경계 및 정신/행동장애":{ bg: "#FDF4FF", color: "#7C3AED", border: "#E9D5FF" },
  "호르몬 및 대사성 의약품":{ bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA" },
  "기타":                   { bg: "#F9FAFB", color: "#374151", border: "#E5E7EB" },
}

export const PRODUCTS: ProductMaster[] = [
  // ── 카테고리 1: 감염성질환 및 호흡기계 ──
  {
    code: "INF-001", name: "화이투벤큐연질캡슐",
    category: "감염성질환 및 호흡기계", indication: "종합 감기 증상",
    spec: "4캡슐/포", unit: "박스", costPrice: 4200, salePrice: 7500,
    stock: 148, safetyStock: 80, manufacturer: "동아제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "INF-002", name: "지르텍정",
    category: "감염성질환 및 호흡기계", indication: "알레르기성 비염·재채기·콧물",
    spec: "10mg×7정", unit: "박스", costPrice: 5800, salePrice: 9800,
    stock: 32, safetyStock: 60, manufacturer: "한국UCB제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "INF-003", name: "뮤테란캡슐 200mg",
    category: "감염성질환 및 호흡기계", indication: "가래·객담 배출 곤란",
    spec: "200mg×20캡슐", unit: "박스", costPrice: 3600, salePrice: 6200,
    stock: 95, safetyStock: 50, manufacturer: "한국파마", drugType: "일반의약품", status: "정상",
  },
  {
    code: "INF-004", name: "오트리빈멘톨 0.1% 분무제",
    category: "감염성질환 및 호흡기계", indication: "코막힘",
    spec: "10mL/병", unit: "개", costPrice: 5100, salePrice: 8800,
    stock: 14, safetyStock: 40, manufacturer: "한국노바티스", drugType: "일반의약품", status: "정상",
  },
  {
    code: "INF-005", name: "스트렙실 허니앤레몬트로키",
    category: "감염성질환 및 호흡기계", indication: "인후염·목 통증",
    spec: "8정/포", unit: "박스", costPrice: 2800, salePrice: 4900,
    stock: 210, safetyStock: 60, manufacturer: "레킷벤키저코리아", drugType: "일반의약품", status: "정상",
  },

  // ── 카테고리 2: 소화기계 및 순환기계 ──
  {
    code: "DIG-001", name: "베아제정",
    category: "소화기계 및 순환기계", indication: "소화불량·과식",
    spec: "30정/병", unit: "박스", costPrice: 3400, salePrice: 5900,
    stock: 320, safetyStock: 100, manufacturer: "대웅제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "DIG-002", name: "겔포스엠현탁액",
    category: "소화기계 및 순환기계", indication: "속쓰림·위산과다",
    spec: "4g×10포", unit: "박스", costPrice: 4600, salePrice: 7900,
    stock: 22, safetyStock: 50, manufacturer: "보령제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "DIG-003", name: "스멕타현탁액 20mL",
    category: "소화기계 및 순환기계", indication: "급성 설사·복통",
    spec: "20mL×10포", unit: "박스", costPrice: 5200, salePrice: 8900,
    stock: 180, safetyStock: 60, manufacturer: "한국입센", drugType: "일반의약품", status: "정상",
  },
  {
    code: "DIG-004", name: "둘코락스에스장용정",
    category: "소화기계 및 순환기계", indication: "변비",
    spec: "5mg×30정", unit: "박스", costPrice: 3800, salePrice: 6600,
    stock: 67, safetyStock: 80, manufacturer: "한국사노피", drugType: "일반의약품", status: "정상",
  },
  {
    code: "DIG-005", name: "치센캡슐",
    category: "소화기계 및 순환기계", indication: "치질·정맥순환 증상",
    spec: "300mg×20캡슐", unit: "박스", costPrice: 9800, salePrice: 16500,
    stock: 11, safetyStock: 40, manufacturer: "동국제약", drugType: "일반의약품", status: "정상",
  },

  // ── 카테고리 3: 신경계 및 정신/행동장애 ──
  {
    code: "NEU-001", name: "타이레놀정 500mg",
    category: "신경계 및 정신/행동장애", indication: "두통·발열·각종 통증",
    spec: "500mg×10정", unit: "박스", costPrice: 1800, salePrice: 3200,
    stock: 512, safetyStock: 200, manufacturer: "한국얀센", drugType: "일반의약품", status: "정상",
  },
  {
    code: "NEU-002", name: "이지엔6이브연질캡슐",
    category: "신경계 및 정신/행동장애", indication: "생리통·염증성 통증",
    spec: "400mg×10캡슐", unit: "박스", costPrice: 2600, salePrice: 4500,
    stock: 88, safetyStock: 60, manufacturer: "대웅제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "NEU-003", name: "보나링에이정",
    category: "신경계 및 정신/행동장애", indication: "멀미·구역·어지럼",
    spec: "50mg×12정", unit: "박스", costPrice: 3200, salePrice: 5600,
    stock: 19, safetyStock: 40, manufacturer: "일동제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "NEU-004", name: "아론정",
    category: "신경계 및 정신/행동장애", indication: "일시적 불면·진정",
    spec: "25mg×10정", unit: "박스", costPrice: 4400, salePrice: 7600,
    stock: 44, safetyStock: 30, manufacturer: "한국유나이티드제약", drugType: "전문의약품", status: "정상",
  },
  {
    code: "NEU-005", name: "노이로민정",
    category: "신경계 및 정신/행동장애", indication: "가볍고 일시적인 우울감·무기력",
    spec: "100mg×30정", unit: "박스", costPrice: 5600, salePrice: 9600,
    stock: 33, safetyStock: 30, manufacturer: "삼아제약", drugType: "전문의약품", status: "정상",
  },

  // ── 카테고리 4: 호르몬 및 대사성 의약품 ──
  {
    code: "HOR-001", name: "아로나민골드정",
    category: "호르몬 및 대사성 의약품", indication: "피로 시 비타민 B군 보급",
    spec: "100정/병", unit: "병", costPrice: 7200, salePrice: 12500,
    stock: 460, safetyStock: 100, manufacturer: "일동제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "HOR-002", name: "마그비맥스연질캡슐",
    category: "호르몬 및 대사성 의약품", indication: "마그네슘·비타민 보급",
    spec: "60캡슐/병", unit: "병", costPrice: 8400, salePrice: 14500,
    stock: 27, safetyStock: 50, manufacturer: "광동제약", drugType: "건강기능식품", status: "정상",
  },
  {
    code: "HOR-003", name: "훼로바유서방정",
    category: "호르몬 및 대사성 의약품", indication: "철결핍성 빈혈·철분 보충",
    spec: "150mg×30정", unit: "박스", costPrice: 6600, salePrice: 11400,
    stock: 74, safetyStock: 40, manufacturer: "유한양행", drugType: "전문의약품", status: "정상",
  },
  {
    code: "HOR-004", name: "칼디쓰리정",
    category: "호르몬 및 대사성 의약품", indication: "칼슘·비타민 D 보충",
    spec: "60정/병", unit: "병", costPrice: 9200, salePrice: 15800,
    stock: 135, safetyStock: 60, manufacturer: "종근당", drugType: "건강기능식품", status: "정상",
  },
  {
    code: "HOR-005", name: "마이보라정",
    category: "호르몬 및 대사성 의약품", indication: "경구 피임",
    spec: "21정/시트", unit: "박스", costPrice: 7800, salePrice: 13400,
    stock: 8, safetyStock: 30, manufacturer: "바이엘코리아", drugType: "전문의약품", status: "정상",
  },

  // ── 카테고리 5: 기타 ──
  {
    code: "ETC-001", name: "후시딘연고",
    category: "기타", indication: "세균성 피부감염·상처의 2차 감염",
    spec: "10g/튜브", unit: "개", costPrice: 3600, salePrice: 6200,
    stock: 195, safetyStock: 80, manufacturer: "동화약품", drugType: "일반의약품", status: "정상",
  },
  {
    code: "ETC-002", name: "라미실크림 1%",
    category: "기타", indication: "무좀·피부 진균증",
    spec: "10g/튜브", unit: "개", costPrice: 6400, salePrice: 10900,
    stock: 43, safetyStock: 50, manufacturer: "한국노바티스", drugType: "일반의약품", status: "정상",
  },
  {
    code: "ETC-003", name: "비판텐연고",
    category: "기타", indication: "가벼운 상처·화상 피부 회복",
    spec: "30g/튜브", unit: "개", costPrice: 5800, salePrice: 9900,
    stock: 16, safetyStock: 60, manufacturer: "바이엘코리아", drugType: "일반의약품", status: "정상",
  },
  {
    code: "ETC-004", name: "오라메디연고",
    category: "기타", indication: "구내염·구강 염증",
    spec: "5g/튜브", unit: "개", costPrice: 3200, salePrice: 5500,
    stock: 58, safetyStock: 40, manufacturer: "동국제약", drugType: "일반의약품", status: "정상",
  },
  {
    code: "ETC-005", name: "신신파스아렉스",
    category: "기타", indication: "근육통·관절통·삠",
    spec: "6매/봉", unit: "박스", costPrice: 2400, salePrice: 4200,
    stock: 280, safetyStock: 100, manufacturer: "신신제약", drugType: "일반의약품", status: "정상",
  },
]
