import { useState } from "react"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import AdminLayout from "./components/AdminLayout"
import DashboardPage from "./pages/DashboardPage"
import PartnerPage from "./pages/PartnerPage"
import ProductPage from "./pages/ProductPage"
import InventoryPage from "./pages/InventoryPage"
import OrderPage from "./pages/OrderPage"
import MarginPage from "./pages/MarginPage"
import DeliveryPage from './pages/DeliveryPage'
import PurchasePage from './pages/PurchasePage'
import SalesPage from './pages/SalesPage'
import UsersPage from './pages/UsersPage'

import type { AuthUser } from "./types/api"

// 로그인 사용자와 역할은 API 명세(3.1 로그인 응답)를 그대로 따른다.
// 기존 화면들이 "../App" 에서 가져다 쓰고 있어 여기서 다시 내보낸다.
export type { AuthUser, UserRole } from "./types/api"

export type AdminRoute =
    | "dashboard"
    | "partners"
    | "products"
    | "inventory"
    | "orders"
    | "margin"
    | "delivery"
    | "purchase"
    | "sales"
    | "users"

export type AppRoute = "home" | "login" | AdminRoute

export default function App() {
  const [route, setRoute] = useState<AppRoute>("home")
  const [user, setUser] = useState<AuthUser | null>(null)

  const handleLogin = (u: AuthUser) => {
    setUser(u)
    setRoute("dashboard")
  }

  const handleLogout = () => {
    setUser(null)
    setRoute("home")
  }

  if (route === "home") {
    return (
        <HomePage
            onLoginClick={() => setRoute("login")}
        />
    )
  }

  if (route === "login") {
    return (
        <LoginPage
            onLogin={handleLogin}
            onBack={() => setRoute("home")}
        />
    )
  }

  // 로그인 없이 어드민 경로로 들어온 경우. 렌더링 중 setState를 호출하면
  // React가 경고하므로 상태를 바꾸지 않고 로그인 화면을 그대로 보여준다.
  if (!user) {
    return (
        <LoginPage
            onLogin={handleLogin}
            onBack={() => setRoute("home")}
        />
    )
  }

  const adminRoute = route as AdminRoute

  return (
      <AdminLayout
          user={user}
          currentRoute={adminRoute}
          onNavigate={(r) => setRoute(r)}
          onLogout={handleLogout}
      >
        {adminRoute === "dashboard" && <DashboardPage user={user} onNavigate={(r) => setRoute(r)} />}
        {adminRoute === "partners" && <PartnerPage />}
        {adminRoute === "products" && <ProductPage />}
        {adminRoute === "inventory" && <InventoryPage />}
        {adminRoute === "orders" && <OrderPage user={user} />}
        {adminRoute === "margin" && <MarginPage />}
        {adminRoute === "delivery" && <DeliveryPage user={user} />}
        {adminRoute === "purchase" && <PurchasePage />}
        {adminRoute === "sales" && <SalesPage />}
        {adminRoute === "users" && <UsersPage />}
      </AdminLayout>
  )
}