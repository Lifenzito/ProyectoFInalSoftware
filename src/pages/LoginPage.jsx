import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { loginAs } = useAuth()
  const navigate = useNavigate()
  const [loadingRole, setLoadingRole] = useState(null)

  const handleLogin = async (role) => {
    try {
      setLoadingRole(role)
      await loginAs(role)
      navigate(role === 'vendedor' ? '/seller/perfil' : '/cliente')
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-neutral-900/70 p-10 text-white shadow-panel">
        <p className="text-sm uppercase tracking-[0.6em] text-sky-300">AntojosUPB</p>
        <h1 className="mt-4 text-4xl font-black text-sky-200">Bienvenido a Antojos UPB</h1>
        <p className="mt-2 text-lg text-gray-100">Por favor selecciona tu tipo de cuenta</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            className="rounded-3xl bg-green-600 px-6 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-green-500 disabled:opacity-50"
            onClick={() => handleLogin('vendedor')}
            disabled={!!loadingRole}
          >
            {loadingRole === 'vendedor' ? 'Ingresando...' : 'Ingresar como Vendedor'}
          </button>
          <button
            className="rounded-3xl bg-green-600 px-6 py-5 text-lg font-semibold text-white shadow-lg transition hover:bg-green-500 disabled:opacity-50"
            onClick={() => handleLogin('cliente')}
            disabled={!!loadingRole}
          >
            {loadingRole === 'cliente' ? 'Ingresando...' : 'Ingresar como Cliente'}
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-gray-300">
          <p className="mb-2 font-semibold text-white/80">¿Cómo funciona?</p>
          <ul className="space-y-2 text-white/70">
            <li>
              • Si eres vendedor, ingresa como vendedor para gestionar tus productos, pedidos y también comprar a otros
              emprendimientos.
            </li>
            <li>
              • Si eres cliente, ingresa como cliente para explorar el catálogo y realizar tus pedidos dentro del campus.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
