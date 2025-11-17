import clsx from 'clsx'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase/config'

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    clearCart,
    cartTotal,
    clientLocation,
    setClientLocation,
    clientPhone,
    setClientPhone,
  } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const phoneError = clientPhone.length > 0 && clientPhone.length < 10

  if (location.pathname === '/login') return null

  const handlePhoneChange = (event) => {
    const sanitized = event.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setClientPhone(sanitized)
  }

  const handleCheckout = async () => {
    if (!clientLocation?.trim() || !clientPhone?.trim()) {
      alert('Por favor ingresa tu ubicación en el campus y teléfono de contacto.')
      return
    }

    if (clientPhone.length !== 10) {
      alert('El número de teléfono debe tener 10 dígitos.')
      return
    }

    if (!items.length) {
      alert('Tu carrito está vacío.')
      return
    }

    if (!user) {
      alert('Debes iniciar sesión para comprar.')
      navigate('/login')
      return
    }

    const grouped = new Map()
    items.forEach((item) => {
      if (!grouped.has(item.sellerId)) grouped.set(item.sellerId, [])
      grouped.get(item.sellerId).push(item)
    })

    const created = []

    for (const [sellerId, sellerItems] of grouped.entries()) {
      const total = sellerItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0)
      const payload = {
        sellerId,
        buyerId: user.uid,
        buyerEmail: user.email || 'anon',
        items: sellerItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity || 1,
        })),
        total,
        clientEmail: user.email || 'anon',
        clientPhone: clientPhone.trim(),
        clientLocation: clientLocation.trim(),
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'pedidos'), payload)
      created.push({
        sellerId,
        sellerName: sellerItems[0]?.sellerName || 'Vendedor',
        sellerPhone: sellerItems[0]?.sellerPhone || '',
        items: sellerItems,
        total,
      })
    }

    const now = new Date()
    let factura = ''
    factura += `AntojosUPB — Factura\n`
    factura += `Fecha: ${now.toLocaleString()}\n`
    factura += `Cliente: ${user.email || 'anon'}\n`
    factura += `Teléfono cliente: ${clientPhone}\n`
    factura += `Ubicación en campus: ${clientLocation}\n`
    factura += `----------------------------------------\n`

    created.forEach((group) => {
      factura += `Vendedor: ${group.sellerName} — Tel: ${group.sellerPhone}\n`
      group.items.forEach((it) => {
        factura += `  • ${it.title} x${it.quantity || 1} — $${it.price}\n`
      })
      factura += `  Subtotal vendedor: $${group.total}\n`
      factura += `----------------------------------------\n`
    })

    factura += `TOTAL: $${cartTotal}\n`

    const blob = new Blob([factura], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `factura_antojoupb_${now.toISOString()}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)

    clearCart()
    setIsOpen(false)
    alert('Pedido enviado ✅')
  }

  return (
    <div className={clsx('fixed inset-0 z-40', isOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={clsx(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={clsx(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b0b0f] text-white shadow-panel transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Tu pedido</p>
            <p className="text-lg font-semibold">Carrito</p>
          </div>
          <button
            className="rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {!items.length && (
            <p className="text-sm text-white/60">Tu carrito está vacío. Explora los productos para agregar.</p>
          )}

          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              {item.imageUrl && (
                <img src={item.imageUrl} alt="producto" className="h-16 w-16 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-white/60">{item.sellerName}</p>
                <p className="text-sm font-bold text-green-400">
                  {formatCurrency(item.price)} · x{item.quantity || 1}
                </p>
              </div>
              <button
                className="rounded-xl border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                onClick={() => removeItem(item.id)}
              >
                Quitar
              </button>
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/60">Ubicación en campus</label>
            <textarea
              rows={3}
              value={clientLocation}
              onChange={(e) => setClientLocation(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/40 focus:border-flame"
              placeholder="Ej: Bloque 6, cafetería principal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/60">Teléfono de contacto</label>
            <input
              type="tel"
              maxLength={10}
              value={clientPhone}
              onChange={handlePhoneChange}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/40 focus:border-flame"
              placeholder="300 123 4567"
            />
            {phoneError && <p className="text-xs text-red-400">El número de teléfono debe tener 10 dígitos.</p>}
          </div>
        </div>

        <footer className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Total</span>
            <span className="text-lg font-bold text-white">{formatCurrency(cartTotal)}</span>
          </div>
          <button
            className="mt-4 w-full rounded-2xl bg-flame py-3 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-ember disabled:opacity-50"
            disabled={!items.length}
            onClick={handleCheckout}
          >
            Generar factura y pedir
          </button>
        </footer>
      </aside>
    </div>
  )
}
