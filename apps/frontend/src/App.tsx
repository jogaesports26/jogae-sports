import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PainelLayout from './components/panel/PainelLayout'
import OverviewPage from './pages/OverviewPage'
import QuadrasPage from './pages/QuadrasPage'
import AgendaPage from './pages/AgendaPage'
import SettingsPage from './pages/SettingsPage'
import PortalLayout from './components/portal/PortalLayout'
import CatalogPage from './pages/CatalogPage'
import CourtBookingPage from './pages/CourtBookingPage'
import PlayerReservationsPage from './pages/PlayerReservationsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/painel" element={<PainelLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="quadras" element={<QuadrasPage />} />
          <Route path="quadras/:courtId/agenda" element={<AgendaPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="/reservar" element={<PortalLayout />}>
          <Route index element={<CatalogPage />} />
          <Route path=":courtId" element={<CourtBookingPage />} />
        </Route>
        <Route path="/minhas-reservas" element={<PortalLayout />}>
          <Route index element={<PlayerReservationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
