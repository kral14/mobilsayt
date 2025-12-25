import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products2 from './pages/Products2'
import Login from './pages/Login'

import Profile from './pages/Profile'
import Hesablar from './pages/Hesablar'
import AlisQaimeleri from './pages/Qaimeler/Alis'
import SatisQaimeleri from './pages/Qaimeler/Satis'
import KassaMedaxil from './pages/Kassa/Medaxil'
import KassaMexaric from './pages/Kassa/Mexaric'
import Alicilar from './pages/Musteriler/Alici'
import Saticilar from './pages/Musteriler/Satici'
import WindowTest from './pages/WindowTest'
import Admin from './pages/Admin'
import DiscountDocuments from './pages/Discounts/DiscountDocuments'
import ProtectedRoute from './components/ProtectedRoute'

import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            zIndex: 99999
          }
        }}
        containerStyle={{
          zIndex: 99999
        }}
      />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hesablar"
            element={
              <ProtectedRoute>
                <Hesablar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mehsullar"
            element={
              <ProtectedRoute>
                <Products2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qaimeler/alis"
            element={
              <ProtectedRoute>
                <AlisQaimeleri />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qaimeler/satis"
            element={
              <ProtectedRoute>
                <SatisQaimeleri />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kassa/medaxil"
            element={
              <ProtectedRoute>
                <KassaMedaxil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kassa/mexaric"
            element={
              <ProtectedRoute>
                <KassaMexaric />
              </ProtectedRoute>
            }
          />
          <Route
            path="/musteriler/alici"
            element={
              <ProtectedRoute>
                <Alicilar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/musteriler/satici"
            element={
              <ProtectedRoute>
                <Saticilar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/supplier-discounts"
            element={
              <ProtectedRoute>
                <DiscountDocuments type="SUPPLIER" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/product-discounts"
            element={
              <ProtectedRoute>
                <DiscountDocuments type="PRODUCT" />
              </ProtectedRoute>
            }
          />
          <Route path="/window-test" element={<WindowTest />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

