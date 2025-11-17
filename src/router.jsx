import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ClientHome from './pages/ClientHome'
import SellerShell from './pages/seller/SellerShell'
import SellerProfile from './pages/seller/SellerProfile'
import SellerPublish from './pages/seller/SellerPublish'
import SellerProducts from './pages/seller/SellerProducts'
import SellerOrders from './pages/seller/SellerOrders'
import NotFound from './pages/NotFound'
import { useAuth } from './context/AuthContext'

function RequireRole({ allowedRoles, children }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/80">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/cliente" replace />
  }

  return children
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cliente" element={<ClientHome />} />

      <Route
        path="/seller"
        element={
          <RequireRole allowedRoles={["vendedor"]}>
            <SellerShell />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="perfil" replace />} />
        <Route path="perfil" element={<SellerProfile />} />
        <Route path="publicar" element={<SellerPublish />} />
        <Route path="productos" element={<SellerProducts />} />
        <Route path="pedidos" element={<SellerOrders />} />
      </Route>

      <Route
        path="/vendedor"
        element={
          <RequireRole allowedRoles={["vendedor"]}>
            <SellerShell />
          </RequireRole>
        }
      >
        <Route index element={<Navigate to="perfil" replace />} />
        <Route path="perfil" element={<SellerProfile />} />
        <Route path="publicar" element={<SellerPublish />} />
        <Route path="productos" element={<SellerProducts />} />
        <Route path="pedidos" element={<SellerOrders />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
