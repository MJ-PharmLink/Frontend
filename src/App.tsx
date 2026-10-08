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

export type UserRole = "admin" | "sales" | "warehouse"

export interface AuthUser {
  name: string
  role: UserRole
  email: string
}

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

  if (!user) {
    setRoute("login")
    return null
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