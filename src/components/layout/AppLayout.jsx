import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import CartDrawer from './CartDrawer'

export default function AppLayout({ children }) {
  const location = useLocation()
  const hideChrome = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink via-charcoal to-black text-white">
      {!hideChrome && (
        <>
          <Navbar />
          <CartDrawer />
        </>
      )}
      <div className={hideChrome ? '' : 'pt-24'}>{children}</div>
    </div>
  )
}
