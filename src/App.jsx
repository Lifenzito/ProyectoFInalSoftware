import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router.jsx'
import AppLayout from './components/layout/AppLayout'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppLayout>
            <AppRouter />
          </AppLayout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
