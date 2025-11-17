import { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import CategorySlider from '../components/common/CategorySlider'
import ProductModal from '../components/common/ProductModal'
import { useCart } from '../context/CartContext'
import { db } from '../firebase/config'
import { normCat, toMillis } from '../lib/clientHelpers'

const LS = {
  dulces: 'antojoupb.v1.client.dulces',
  salados: 'antojoupb.v1.client.salados',
  nocom: 'antojoupb.v1.client.nocom',
}

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function rebuildCategory(lsKey, incomingArr) {
  const prev = readLS(lsKey, [])
  const map = new Map(prev.map((p) => [p.id, p]))
  const merged = incomingArr.map((p) => ({ ...map.get(p.id), ...p }))
  merged.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
  writeLS(lsKey, merged)
  return merged
}

export default function ClientHome() {
  const { addItem, setIsOpen } = useCart()
  const [dulces, setDulces] = useState(() => readLS(LS.dulces, []))
  const [salados, setSalados] = useState(() => readLS(LS.salados, []))
  const [noCom, setNoCom] = useState(() => readLS(LS.nocom, []))
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const qAll = query(collection(db, 'productos'), orderBy('createdAt', 'desc'), limit(200))

    const unsub = onSnapshot(qAll, (snapshot) => {
      const incoming = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() || {}
        return {
          id: docSnap.id,
          title: data.title || '',
          price: Number(data.price ?? 0),
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          sellerId: data.sellerId || 'anon',
          sellerName: data.sellerName || data.sellerId || 'Vendedor',
          sellerPhone: data.sellerPhone || '',
          createdAt: data.createdAt || null,
          _cat: normCat(data.category),
        }
      })

      const arrD = incoming.filter((p) => p._cat === 'dulces')
      const arrS = incoming.filter((p) => p._cat === 'salados')
      const arrN = incoming.filter((p) => p._cat === 'nocom')

      setDulces(rebuildCategory(LS.dulces, arrD))
      setSalados(rebuildCategory(LS.salados, arrS))
      setNoCom(rebuildCategory(LS.nocom, arrN))
    })

    return () => unsub()
  }, [])

  const highlightProduct = useMemo(() => dulces[0] || salados[0] || noCom[0], [dulces, salados, noCom])

  const openModal = (product) => {
    setSelectedProduct(product)
    setModalOpen(true)
  }

  const handleAdd = (product) => {
    addItem(product)
    setModalOpen(false)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-24">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111] via-[#0c0c0c] to-black p-8 shadow-panel md:flex md:items-center md:gap-12">
        <div className="flex-1 space-y-4">
          <p className="text-sm uppercase tracking-[0.6em] text-white/40">Marketplace UPB</p>
          <h1 className="text-4xl font-black leading-tight text-white">
            Antojos que conectan estudiantes, emprendimientos y el sabor del campus.
          </h1>
          <p className="text-white/70">
            Explora los mejores productos caseros, salados, dulces y hasta merchandising exclusivo. Todo creado por
            emprendedores UPB, listo para recogerse en el campus.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-flame px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:bg-ember"
              onClick={() => setIsOpen(true)}
            >
              Ver carrito y pedidos
            </button>
            {highlightProduct && (
              <button
                className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80"
                onClick={() => openModal(highlightProduct)}
              >
                Destacado: {highlightProduct.title}
              </button>
            )}
          </div>
        </div>
        {highlightProduct?.imageUrl && (
          <img
            src={highlightProduct.imageUrl}
            alt={highlightProduct.title}
            className="mt-8 w-full rounded-[28px] object-cover shadow-2xl md:mt-0 md:w-80"
          />
        )}
      </section>

      <CategorySlider title="Dulces artesanales" products={dulces} onSelect={openModal} />
      <CategorySlider title="Salados irresistibles" products={salados} onSelect={openModal} />
      <CategorySlider title="No comestible" products={noCom} onSelect={openModal} />

      <ProductModal open={modalOpen} product={selectedProduct} onClose={() => setModalOpen(false)} onConfirm={handleAdd} />
    </div>
  )
}
