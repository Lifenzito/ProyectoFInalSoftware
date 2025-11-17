export default function ProductModal({ open, product, onClose, onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-lg animate-pop rounded-3xl border border-white/10 bg-[#0f0f15] p-6 shadow-panel">
        <div className="flex items-start gap-4">
          {product?.imageUrl && (
            <img src={product.imageUrl} alt={product?.title} className="h-24 w-24 rounded-2xl object-cover" />
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Agregar al carrito</p>
            <h3 className="text-2xl font-bold text-white">{product?.title}</h3>
            <p className="text-sm text-white/70">{product?.description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60">Precio</p>
            <p className="text-2xl font-black text-flame">
              ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(product?.price || 0)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="rounded-2xl bg-flame px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-ember"
              onClick={() => onConfirm(product)}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
