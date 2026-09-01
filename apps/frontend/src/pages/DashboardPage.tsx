import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '../lib/api'
import './DashboardPage.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('jogae_user')
    const token = localStorage.getItem('jogae_token')

    if (!raw || !token) {
      navigate('/')
      return
    }

    setUser(JSON.parse(raw))
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('jogae_token')
    localStorage.removeItem('jogae_user')
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <span className="dashboard__brand">Jogaê Sports - Gestão</span>
        <button className="dashboard__logout" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <main className="dashboard__content">
        <h1>Olá, {user.name.split(' ')[0]}!</h1>
        <p>Sua conta foi criada com sucesso. O painel de gestão da sua quadra está em construção.</p>
      </main>
    </div>
  )
}
