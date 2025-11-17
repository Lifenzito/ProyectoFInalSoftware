import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-white">
      <p className="text-sm uppercase tracking-[0.4em] text-white/40">Ups</p>
      <h1 className="text-4xl font-black">Página no encontrada</h1>
      <p className="text-white/70">La ruta solicitada no existe. Regresa al inicio para seguir explorando antojos.</p>
      <Link to="/cliente" className="rounded-full bg-flame px-6 py-3 text-white shadow-lg">
        Volver al inicio
      </Link>
    </div>
  )
}
