import { useState } from 'react'
import { useSeller } from '../../context/SellerContext'

const categories = ['Salados', 'Dulces', 'No Comestible']

export default function SellerPublish() {
  const { publishProduct, publishing } = useSeller()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [file, setFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await publishProduct({ title, price, description, category, file })
    setTitle('')
    setPrice('')
    setDescription('')
    setCategory(categories[0])
    setFile(null)
    e.target.reset()
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.5em] text-white/50">Catálogo</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Publicar producto</h2>
      <p className="text-sm text-white/70">Completa los campos para poner tu producto en el marketplace.</p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Nombre del producto</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-flame"
            placeholder="Ej. Brownie de chocolate"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Precio</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-flame"
            placeholder="10000"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-flame"
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-flame"
            rows={4}
            placeholder="Ingredientes, tamaños, notas..."
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Imagen (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-2xl border border-dashed border-white/20 bg-black/20 p-3 text-white/70"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50"
            disabled={publishing}
          >
            {publishing ? 'Publicando...' : 'Publicar producto'}
          </button>
        </div>
      </form>
    </section>
  )
}
