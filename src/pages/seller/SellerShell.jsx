import { Outlet } from 'react-router-dom'
import { SellerProvider } from '../../context/SellerContext'

export default function SellerShell() {
  return (
    <SellerProvider>
      <div className="mx-auto max-w-5xl space-y-8 px-4 pb-16">
        <Outlet />
      </div>
    </SellerProvider>
  )
}
