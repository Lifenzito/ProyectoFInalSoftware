import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'

export default function CategorySlider({ title, products = [], onSelect }) {
  const containerRef = useRef(null)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      setCanScroll({
        left: scrollLeft > 0,
        right: scrollLeft + clientWidth < scrollWidth - 1,
      })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [products])

  const scrollBy = (offset) => {
    const el = containerRef.current
    if (!el) return
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Colección</p>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            className="rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white hover:text-white disabled:opacity-30"
            onClick={() => scrollBy(-320)}
            disabled={!canScroll.left}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="rounded-full border border-white/20 p-2 text-white/70 transition hover:border-white hover:text-white disabled:opacity-30"
            onClick={() => scrollBy(320)}
            disabled={!canScroll.right}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex flex-nowrap gap-4 overflow-x-auto pb-8 pr-4 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}
