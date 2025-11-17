import { useSeller } from '../../context/SellerContext'

function formatDate(ts) {
  if (!ts) return new Date().toLocaleString()
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString()
  return new Date(ts).toLocaleString()
}

export default function SellerOrders() {
  const { orders, markAsDispatched } = useSeller()

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.5em] text-white/50">Pedidos</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Pedidos recibidos</h2>
      <p className="text-sm text-white/70">Confirma el despacho y mantén tu historial organizado.</p>

      {!orders.length && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center text-white/60">
          Aún no tienes pedidos.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Pedido</p>
                <p className="text-lg font-semibold text-white">{formatDate(order.createdAt)}</p>
              </div>
              <button
                className="rounded-2xl border border-emerald-500/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
                onClick={() => markAsDispatched(order.id)}
              >
                Marcar despachado
              </button>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white/80">
              <p>Cliente: {order.clientEmail}</p>
              <p>Teléfono: {order.clientPhone}</p>
              <p>Ubicación: {order.clientLocation}</p>
            </div>

            <ul className="space-y-1 text-sm text-white/80">
              {order.items?.map((item) => (
                <li key={item.id}>
                  • {item.title} x{item.quantity || 1} — ${item.price}
                </li>
              ))}
            </ul>

            <p className="text-right text-lg font-bold text-emerald-300">Total: ${order.total}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
