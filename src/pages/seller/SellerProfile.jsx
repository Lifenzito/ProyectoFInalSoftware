import { useSeller } from '../../context/SellerContext'

export default function SellerProfile() {
  const { profileName, setProfileName, profilePhone, setProfilePhone, saveProfile, savingProfile } = useSeller()
  const phoneError = profilePhone.length > 0 && profilePhone.length < 10

  const handlePhoneChange = (event) => {
    const sanitized = event.target.value.replace(/[^0-9]/g, '').slice(0, 10)
    setProfilePhone(sanitized)
  }

  const handleSave = () => {
    if (profilePhone.length !== 10) {
      alert('El número de teléfono debe tener 10 dígitos.')
      return
    }
    saveProfile()
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
      <p className="text-xs uppercase tracking-[0.5em] text-white/50">Perfil</p>
      <h2 className="mt-2 text-2xl font-bold text-white">Perfil de vendedor</h2>
      <p className="text-sm text-white/70">Estos datos se mostrarán a tus compradores para contactarte.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Nombre para mostrar</label>
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-flame"
            placeholder="Tu emprendimiento"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Teléfono de contacto</label>
          <input
            type="tel"
            maxLength={10}
            value={profilePhone}
            onChange={handlePhoneChange}
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white focus:border-flame"
            placeholder="300 123 4567"
          />
          {phoneError && <p className="text-xs text-red-400">El número de teléfono debe tener 10 dígitos.</p>}
        </div>
      </div>

      <button
        className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50"
        onClick={handleSave}
        disabled={savingProfile}
      >
        {savingProfile ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </section>
  )
}
