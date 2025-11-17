import { useSeller } from '../../context/SellerContext'

export default function SellerProducts() {
  const { products, deleteProduct } = useSeller()

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.5em] text-white/50">Inventario</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Mis productos</h2>
      <p className="text-sm text-white/70">Edita o elimina los productos que ya no estén disponibles.</p>

      {!products.length && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center text-white/60">
          Aún no has publicado nada.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center"
          >
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.title} className="h-24 w-24 rounded-2xl object-cover" />
            )}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">{product.category}</p>
              <h3 className="text-xl font-semibold text-white">{product.title}</h3>
              <p className="text-white/70">{product.description}</p>
              <p className="text-lg font-bold text-emerald-300">${product.price}</p>
            </div>
            <button
              className="self-start rounded-2xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              onClick={() => deleteProduct(product.id)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
