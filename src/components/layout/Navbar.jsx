import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { LogOut, Menu, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const sharedButtonClasses =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors'

export default function Navbar() {
  const { role, logout } = useAuth()
  const { cartCount, setIsOpen, lastAddedId } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const baseItems = [{ label: 'Inicio', to: '/cliente', color: 'text-white' }]

  const sellerExtras = [
    { label: 'Perfil de vendedor', to: '/vendedor/perfil', color: 'text-sky-300' },
    { label: 'Publicar producto', to: '/vendedor/publicar', color: 'text-emerald-300' },
    { label: 'Mis productos', to: '/vendedor/productos', color: 'text-purple-300' },
    { label: 'Pedidos recibidos', to: '/vendedor/pedidos', color: 'text-emerald-300' },
  ]

  const navItems = role === 'vendedor' ? [...baseItems, ...sellerExtras] : baseItems

  const showNavbar = !!role

  if (!showNavbar) return null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (to) => {
    if (location.pathname.startsWith(to)) return true
    if (to.startsWith('/vendedor')) {
      const sellerAlias = to.replace('/vendedor', '/seller')
      return location.pathname.startsWith(sellerAlias)
    }
    return false
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/cliente" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-flame text-lg font-black text-white shadow-glow">
            AU
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Antojos</p>
            <p className="text-lg font-semibold text-white">UPB</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                sharedButtonClasses,
                'bg-white/5 hover:bg-white/15',
                item.color,
                isActive(item.to) && 'bg-white/20'
              )}
            >
              {item.label}
            </Link>
          ))}

          <button
            className="relative inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 font-semibold text-white shadow-md transition hover:bg-green-500"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            Carrito
            {cartCount > 0 && (
              <span
                className={clsx(
                  'ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-green-600 transition',
                  lastAddedId && 'animate-pulse'
                )}
              >
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>

        <button
          className="inline-flex rounded-full border border-white/20 p-2 text-white lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/5 bg-black/80 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold',
                  item.color,
                  isActive(item.to) && 'bg-white/10'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <button
              className="flex items-center justify-between rounded-2xl border border-green-500/40 bg-green-600 px-4 py-3 text-white"
              onClick={() => {
                setIsOpen(true)
                setMobileOpen(false)
              }}
            >
              <span>Carrito</span>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <span className="text-sm font-bold">{cartCount}</span>}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-3 text-white/80"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
