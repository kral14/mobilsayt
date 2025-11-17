import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Hesablar from './pages/Hesablar'
import Anbar from './pages/Anbar'
import AlisQaimeleri from './pages/Qaimeler/Alis'
import SatisQaimeleri from './pages/Qaimeler/Satis'
import KassaMedaxil from './pages/Kassa/Medaxil'
import KassaMexaric from './pages/Kassa/Mexaric'
import Alicilar from './pages/Musteriler/Alici'
import Saticilar from './pages/Musteriler/Satici'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/hesablar" element={<Hesablar />} />
        <Route path="/anbar" element={<Anbar />} />
        <Route path="/qaimeler/alis" element={<AlisQaimeleri />} />
        <Route path="/qaimeler/satis" element={<SatisQaimeleri />} />
        <Route path="/kassa/medaxil" element={<KassaMedaxil />} />
        <Route path="/kassa/mexaric" element={<KassaMexaric />} />
        <Route path="/musteriler/alici" element={<Alicilar />} />
        <Route path="/musteriler/satici" element={<Saticilar />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

