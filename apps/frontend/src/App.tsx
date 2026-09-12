import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PainelLayout from './components/panel/PainelLayout'
import OverviewPage from './pages/OverviewPage'
import QuadrasPage from './pages/QuadrasPage'
import AgendaPage from './pages/AgendaPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/painel" element={<PainelLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="quadras" element={<QuadrasPage />} />
          <Route path="quadras/:courtId/agenda" element={<AgendaPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
