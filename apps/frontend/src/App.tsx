import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PainelLayout from './components/panel/PainelLayout'
import OverviewPage from './pages/OverviewPage'
import QuadrasPage from './pages/QuadrasPage'
import CourtDetailLayout from './components/panel/CourtDetailLayout'
import AgendaPage from './pages/AgendaPage'
import CourtPricingPage from './pages/CourtPricingPage'
import CourtWaitlistPage from './pages/CourtWaitlistPage'
import CourtMaintenancePage from './pages/CourtMaintenancePage'
import ReportsPage from './pages/ReportsPage'
import CustomersPage from './pages/CustomersPage'
import InstructorsPage from './pages/InstructorsPage'
import CouponsPage from './pages/CouponsPage'
import SettingsPage from './pages/SettingsPage'
import PortalLayout from './components/portal/PortalLayout'
import EstablishmentPage from './pages/EstablishmentPage'
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
          <Route path="quadras/:courtId" element={<CourtDetailLayout />}>
            <Route index element={<Navigate to="agenda" replace />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="precos" element={<CourtPricingPage />} />
            <Route path="fila-de-espera" element={<CourtWaitlistPage />} />
            <Route path="manutencao" element={<CourtMaintenancePage />} />
          </Route>
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="clientes" element={<CustomersPage />} />
          <Route path="equipe" element={<InstructorsPage />} />
          <Route path="cupons" element={<CouponsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="/minhas-reservas" element={<PortalLayout />}>
          <Route index element={<PlayerReservationsPage />} />
        </Route>
        <Route path="/:slug" element={<PortalLayout />}>
          <Route index element={<EstablishmentPage />} />
          <Route path=":courtId" element={<CourtBookingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
