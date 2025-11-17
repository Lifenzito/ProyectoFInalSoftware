import clsx from 'clsx'

export default function ProductCard({ product, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(product)}
      className={clsx(
        'inline-flex h-[320px] w-72 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 text-left shadow-lg transition hover:-translate-y-1 hover:border-flame hover:shadow-glow'
      )}
    >
      {(product.imageUrl || product.image) && (
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-white/60">{product.sellerName}</p>
        <h3 className="text-lg font-bold text-white">{product.title}</h3>
        <p className="line-clamp-2 text-sm text-white/70">{product.description}</p>
        <p className="mt-auto text-lg font-black text-flame">
          ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(product.price || 0)}
        </p>
      </div>
    </button>
  )
}
