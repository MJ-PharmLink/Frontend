import { useState, useEffect, useRef } from "react"

interface Props {
  onLoginClick: () => void
}

const heroSlides = [
  {
    img: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1400&h=900&fit=crop&auto=format",
    alt: "현대적인 의약품 물류센터",
    caption: "더 안전하게, 더 빠르게,\n의약품을 연결합니다.",
    sub: "팜링크는 제약회사와 거래처를 연결하는 신뢰의 의약품 유통 파트너입니다.",
  },
  {
    img: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=1400&h=900&fit=crop&auto=format",
    alt: "제약 연구실",
    caption: "의약품 유통의\n새로운 연결.",
    sub: "전문적인 공급망 관리로 안정적인 의약품 유통 환경을 제공합니다.",
  },
  {
    img: "https://images.unsplash.com/photo-1627309366653-2dedc084cdf1?w=1400&h=900&fit=crop&auto=format",
    alt: "정리된 대형 창고",
    caption: "정확한 재고 관리,\n완벽한 납품 시스템.",
    sub: "실시간 재고 추적과 체계적인 물류 관리로 신뢰를 쌓아갑니다.",
  },
]

const topProducts = [
  {
    rank: 1,
    name: "아스피린 100mg",
    category: "일반의약품",
    manufacturer: "팜링크 유통",
    monthly: "48,200개",
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop&auto=format",
    badge: "#0B3D91",
  },
  {
    rank: 2,
    name: "아모빈 500mg",
    category: "전문의약품",
    manufacturer: "팜링크 유통",
    monthly: "31,500개",
    img: "https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=400&h=300&fit=crop&auto=format",
    badge: "#1677FF",
  },
  {
    rank: 3,
    name: "비타민C 1000mg",
    category: "건강기능식품",
    manufacturer: "팜링크 유통",
    monthly: "27,800개",
    img: "https://images.unsplash.com/photo-1549477754-350cf45a1772?w=400&h=300&fit=crop&auto=format",
    badge: "#4A90A4",
  },
]

const notices = [
  { date: "2026.09.10", title: "2026년 하반기 의약품 공급 일정 안내" },
  { date: "2026.09.05", title: "팜링크 물류센터 추가 확장 완료 안내" },
  { date: "2026.08.28", title: "의약품 유통 관련 규정 개정 사항 공지" },
  { date: "2026.08.15", title: "추석 연휴 기간 납품 일정 변경 안내" },
]

const navItems = ["회사소개", "사업소개", "제품정보", "의약품 유통", "물류센터", "공지사항", "문의하기"]

export default function HomePage({ onLoginClick }: Props) {
  const [slideIdx, setSlideIdx] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const goTo = (idx: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setSlideIdx(idx)
      setIsTransitioning(false)
    }, 300)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setSlideIdx((p) => (p + 1) % heroSlides.length)
        setIsTransitioning(false)
      }, 300)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const slide = heroSlides[slideIdx]

  return (
    <div className="min-h-screen bg-white text-[#333333]" style={{ fontFamily: "'Pretendard', 'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: "white",
          borderBottom: scrolled ? "1px solid #E5EAF0" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.06)" : "none",
          height: 80,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.08em", color: "#0B3D91" }}>PHARMLINK</span>
              <span style={{ fontSize: 11, color: "#666", letterSpacing: "0.05em", marginTop: 2 }}>팜링크</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-medium transition-colors duration-150"
                style={{ color: "#444", letterSpacing: "0.02em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0B3D91")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="tel:02-0000-0000"
              className="hidden lg:flex items-center gap-2 text-sm font-medium"
              style={{ color: "#0B3D91" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              02-0000-0000
            </a>
            <button
              onClick={onLoginClick}
              className="text-sm font-medium px-4 py-2 transition-all duration-150"
              style={{ background: "#0B3D91", color: "white", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a3280")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0B3D91")}
            >
              ERP 로그인
            </button>
            <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-white border-t" style={{ borderColor: "#E5EAF0" }}>
            {navItems.map((item) => (
              <a key={item} href="#" className="block px-8 py-3 text-sm font-medium" style={{ color: "#444", borderBottom: "1px solid #f0f0f0" }}>
                {item}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden" style={{ marginTop: 80, minHeight: "calc(100vh - 80px)" }}>
        <div className="flex h-full" style={{ minHeight: "calc(100vh - 80px)" }}>
          {/* Left text area */}
          <div
            className="flex flex-col justify-center px-16 py-20"
            style={{ width: "45%", minWidth: 400, background: "white", zIndex: 1 }}
          >
            <div
              className="transition-all duration-300"
              style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? "translateY(10px)" : "translateY(0)" }}
            >
              <p className="uppercase tracking-widest text-xs font-semibold mb-6" style={{ color: "#1677FF" }}>
                PHARMLINK · 팜링크
              </p>
              <h1
                className="font-semibold leading-tight mb-6"
                style={{ fontSize: "clamp(32px, 3vw, 48px)", color: "#1a1a1a", whiteSpace: "pre-line" }}
              >
                {slide.caption}
              </h1>
              <p className="mb-10 leading-relaxed" style={{ fontSize: 16, color: "#666", maxWidth: 360 }}>
                {slide.sub}
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  className="px-7 py-3 font-medium text-sm transition-all duration-150"
                  style={{ background: "#0B3D91", color: "white", borderRadius: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a3280")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#0B3D91")}
                >
                  회사소개
                </button>
                <button
                  className="px-7 py-3 font-medium text-sm transition-all duration-150"
                  style={{ background: "white", color: "#0B3D91", border: "1.5px solid #0B3D91", borderRadius: 8 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f5ff" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "white" }}
                >
                  유통 서비스
                </button>
              </div>
            </div>

            {/* Slide indicators */}
            <div className="flex gap-2 mt-14">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="transition-all duration-300"
                  style={{
                    width: i === slideIdx ? 28 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === slideIdx ? "#0B3D91" : "#D1D9E6",
                    border: "none",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right image area */}
          <div className="flex-1 relative overflow-hidden" style={{ background: "#0B3D91" }}>
            <img
              key={slideIdx}
              src={slide.img}
              alt={slide.alt}
              className="w-full h-full object-cover transition-all duration-500"
              style={{ opacity: isTransitioning ? 0 : 1 }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(11,61,145,0.3) 0%, transparent 60%)" }}
            />
            <div className="absolute bottom-8 right-8 text-white text-xs font-medium opacity-60 tracking-widest uppercase">
              {slideIdx + 1} / {heroSlides.length}
            </div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS AREAS ── */}
      <section className="py-24" style={{ background: "white" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="mb-16 flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#1677FF" }}>BUSINESS</p>
              <h2 className="font-semibold" style={{ fontSize: "clamp(26px, 2.4vw, 36px)", color: "#1a1a1a" }}>
                팜링크가 연결하는 의약품 유통
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0" style={{ borderTop: "1px solid #E5EAF0", borderLeft: "1px solid #E5EAF0" }}>
            {[
              { num: "01", title: "의약품 유통", desc: "제조사부터 최종 거래처까지 안전하고 신속한 의약품 유통 솔루션을 제공합니다.", icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
              { num: "02", title: "의약품 물류", desc: "최첨단 물류 시스템으로 온도·습도 관리가 필요한 의약품도 정확하게 배송합니다.", icon: <><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></> },
              { num: "03", title: "거래처 관리", desc: "병원, 약국, 도매상 등 다양한 거래처와의 체계적인 관계를 유지·관리합니다.", icon: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><path d="M16 3.13a4 4 0 010 7.75" /><path d="M21 21v-2a4 4 0 00-3-3.87" /></> },
              { num: "04", title: "공급망 관리", desc: "실시간 재고 추적과 데이터 기반 공급망 최적화로 안정적인 수급을 보장합니다.", icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></> },
            ].map((item) => (
              <div
                key={item.num}
                className="p-10 transition-all duration-200 group"
                style={{ borderRight: "1px solid #E5EAF0", borderBottom: "1px solid #E5EAF0" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F9FC" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "white" }}
              >
                <p className="text-xs font-semibold mb-6" style={{ color: "#1677FF", letterSpacing: "0.05em" }}>{item.num}</p>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                  {item.icon}
                </svg>
                <h3 className="font-semibold text-base mb-3" style={{ color: "#1a1a1a" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#777" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT PHARMLINK ── */}
      <section className="py-24" style={{ background: "#F7F9FC" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1602052577122-f73b9710adba?w=700&h=500&fit=crop&auto=format"
                alt="팜링크 연구실"
                className="w-full object-cover"
                style={{ borderRadius: 4, aspectRatio: "7/5" }}
              />
              <div
                className="absolute -bottom-6 -right-6 bg-white p-6 shadow-sm"
                style={{ borderRadius: 4, border: "1px solid #E5EAF0" }}
              >
                <p className="text-3xl font-bold" style={{ color: "#0B3D91" }}>15+</p>
                <p className="text-sm mt-1" style={{ color: "#666" }}>Years of Experience</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#1677FF" }}>ABOUT PHARMLINK</p>
              <h2 className="font-semibold leading-tight mb-6" style={{ fontSize: "clamp(24px, 2.2vw, 34px)", color: "#1a1a1a" }}>
                의약품 유통의 모든 순간,<br />팜링크가 함께합니다.
              </h2>
              <p className="leading-relaxed mb-8" style={{ fontSize: 16, color: "#666" }}>
                팜링크는 제약회사와 공급처, 병원·약국·도매상 등 거래처를 연결하여
                보다 효율적이고 안정적인 의약품 유통 환경을 제공합니다.
                15년의 경험과 전문성을 바탕으로 국내 의약품 유통 시장을 선도합니다.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 font-medium text-sm transition-all duration-150"
                style={{ color: "#0B3D91" }}
                onMouseEnter={(e) => { e.currentTarget.style.gap = "12px" }}
                onMouseLeave={(e) => { e.currentTarget.style.gap = "8px" }}
              >
                MORE VIEW →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP 3 BEST-SELLING PRODUCTS ── */}
      <section className="py-24" style={{ background: "white" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#1677FF" }}>BEST PRODUCTS</p>
            <h2 className="font-semibold" style={{ fontSize: "clamp(26px, 2.4vw, 36px)", color: "#1a1a1a" }}>
              이달의 인기 의약품 TOP 3
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {topProducts.map((p) => (
              <div
                key={p.rank}
                className="group relative overflow-hidden transition-all duration-200"
                style={{ border: "1px solid #E5EAF0", borderRadius: 4 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0B3D91"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(11,61,145,0.08)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5EAF0"; e.currentTarget.style.boxShadow = "none" }}
              >
                <div className="relative overflow-hidden" style={{ height: 200, background: "#F7F9FC" }}>
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute top-4 left-4 flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: 36, height: 36, borderRadius: "50%", background: p.badge }}
                  >
                    {p.rank}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium mb-2" style={{ color: "#1677FF" }}>{p.category}</p>
                  <h3 className="font-semibold text-base mb-1" style={{ color: "#1a1a1a" }}>{p.name}</h3>
                  <p className="text-sm mb-4" style={{ color: "#777" }}>{p.manufacturer}</p>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid #E5EAF0" }}>
                    <span className="text-xs" style={{ color: "#999" }}>월 판매량</span>
                    <span className="font-semibold text-sm" style={{ color: "#0B3D91" }}>{p.monthly}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOGISTICS SECTION (Navy) ── */}
      <section className="py-24" style={{ background: "#0B3D91" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <p className="text-xs uppercase tracking-widest font-semibold mb-4 opacity-60">PHARMLINK LOGISTICS</p>
              <h2 className="font-semibold leading-tight mb-6" style={{ fontSize: "clamp(24px, 2.2vw, 34px)" }}>
                정확한 재고 관리와<br />안정적인 의약품 물류
              </h2>
              <p className="leading-relaxed mb-12 opacity-75" style={{ fontSize: 16, maxWidth: 400 }}>
                첨단 WMS 시스템을 기반으로 실시간 재고 현황을 파악하고,
                온도·습도 관리가 필요한 냉장·냉동 의약품도 완벽하게 관리합니다.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { num: "01", label: "실시간 재고관리" },
                  { num: "02", label: "입출고 관리" },
                  { num: "03", label: "납품 관리" },
                  { num: "04", label: "거래처 관리" },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3">
                    <span className="text-sm font-semibold" style={{ color: "#1677FF" }}>{item.num}</span>
                    <span className="text-sm opacity-80">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden" style={{ borderRadius: 4, aspectRatio: "4/3" }}>
              <img
                src="https://images.unsplash.com/photo-1592085198739-ffcad7f36b54?w=800&h=600&fit=crop&auto=format"
                alt="팜링크 물류센터"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "rgba(11,61,145,0.25)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPANY STRENGTH ── */}
      <section className="py-24" style={{ background: "white" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="mb-14">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#1677FF" }}>COMPANY STRENGTH</p>
            <h2 className="font-semibold" style={{ fontSize: "clamp(26px, 2.4vw, 36px)", color: "#1a1a1a" }}>
              팜링크와 함께하는 숫자
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0" style={{ borderTop: "1px solid #E5EAF0", borderLeft: "1px solid #E5EAF0" }}>
            {[
              { value: "15+", label: "Years of Experience", sub: "업력" },
              { value: "120+", label: "Partners", sub: "거래처" },
              { value: "10,000+", label: "Products", sub: "취급 의약품" },
              { value: "99.9%", label: "Inventory Accuracy", sub: "재고 정확도" },
            ].map((item) => (
              <div key={item.label} className="p-10 text-center" style={{ borderRight: "1px solid #E5EAF0", borderBottom: "1px solid #E5EAF0" }}>
                <p className="font-bold mb-2" style={{ fontSize: "clamp(28px, 3vw, 44px)", color: "#0B3D91", fontFamily: "'Inter', sans-serif" }}>{item.value}</p>
                <p className="text-sm font-medium mb-1" style={{ color: "#333" }}>{item.label}</p>
                <p className="text-xs" style={{ color: "#999" }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTICE / NEWS ── */}
      <section className="py-24" style={{ background: "#F7F9FC" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#1677FF" }}>NOTICE</p>
              <h2 className="font-semibold leading-tight mb-4" style={{ fontSize: "clamp(22px, 2vw, 30px)", color: "#1a1a1a" }}>
                팜링크의 새로운<br />소식을 확인하세요.
              </h2>
              <a href="#" className="text-sm font-medium" style={{ color: "#0B3D91" }}>전체보기 →</a>
            </div>
            <div className="lg:col-span-2">
              <div>
                {notices.map((n, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex items-center justify-between py-5 transition-all duration-150 group"
                    style={{ borderBottom: "1px solid #E5EAF0" }}
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-medium" style={{ color: "#999", fontFamily: "'Inter', sans-serif", minWidth: 80 }}>{n.date}</span>
                      <span
                        className="text-sm font-medium transition-colors duration-150"
                        style={{ color: "#333" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#0B3D91")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
                      >
                        {n.title}
                      </span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" className="shrink-0 ml-4 group-hover:stroke-[#0B3D91] transition-colors">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="py-24" style={{ background: "white" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#1677FF" }}>CONTACT</p>
              <h2 className="font-semibold leading-tight mb-6" style={{ fontSize: "clamp(24px, 2.2vw, 34px)", color: "#1a1a1a" }}>
                팜링크와 함께<br />더 나은 의약품 유통을<br />시작하세요.
              </h2>
              <div className="space-y-4">
                {[
                  { label: "대표전화", value: "02-0000-0000" },
                  { label: "이메일", value: "info@pharmlink.co.kr" },
                  { label: "주소", value: "서울특별시 강남구 테헤란로 123, 팜링크빌딩 7층" },
                ].map((c) => (
                  <div key={c.label} className="flex gap-6">
                    <span className="text-sm font-medium w-20 shrink-0" style={{ color: "#0B3D91" }}>{c.label}</span>
                    <span className="text-sm" style={{ color: "#555" }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <button
                className="px-10 py-4 font-semibold text-base transition-all duration-150"
                style={{ background: "#0B3D91", color: "white", borderRadius: 8 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0a3280")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0B3D91")}
              >
                CONTACT US
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0B3D91" }}>
        <div className="max-w-[1200px] mx-auto px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="mb-4">
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: "white" }}>PHARMLINK</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>팜링크</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 280 }}>
                의약품 유통의 모든 순간,<br />팜링크가 함께합니다.
              </p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {[
                { title: "회사", items: ["회사소개", "사업소개", "경영이념"] },
                { title: "서비스", items: ["의약품 유통", "물류센터", "제품정보"] },
                { title: "고객지원", items: ["공지사항", "문의하기", "ERP 로그인"] },
              ].map((col) => (
                <div key={col.title}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>{col.title}</p>
                  <div className="space-y-2">
                    {col.items.map((item) => (
                      <a key={item} href="#" className="block text-sm transition-colors duration-150" style={{ color: "rgba(255,255,255,0.65)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="text-xs space-y-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              <p>서울특별시 강남구 테헤란로 123, 팜링크빌딩 7층 | 대표전화: 02-0000-0000 | info@pharmlink.co.kr</p>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Copyright © PHARMLINK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
