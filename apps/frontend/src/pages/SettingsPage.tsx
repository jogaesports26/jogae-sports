import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchProfile, updateProfile } from '../lib/profile'
import './SettingsPage.css'

export default function SettingsPage() {
  const { onSessionExpired } = usePainelContext()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        setName(profile.establishmentName ?? '')
        setPhone(profile.establishmentPhone ?? '')
        setAddress(profile.establishmentAddress ?? '')
      })
      .catch((err) => {
        if (err instanceof SessionExpiredError) {
          onSessionExpired()
          return
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      await updateProfile({
        establishmentName: name,
        establishmentPhone: phone,
        establishmentAddress: address,
      })
      setSaved(true)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <h1>Configurações do estabelecimento</h1>
      <p className="settings-page__subtitle">
        Essas informações aparecem pros seus clientes quando eles forem reservar.
      </p>

      {loading ? (
        <p className="settings-page__loading">Carregando...</p>
      ) : (
        <form className="settings-page__form" onSubmit={handleSubmit}>
          <label className="settings-page__field">
            <span>Nome do estabelecimento</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Arena Gol de Placa"
            />
          </label>

          <label className="settings-page__field">
            <span>Telefone de contato</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(85) 99999-9999"
            />
          </label>

          <label className="settings-page__field">
            <span>Endereço</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </label>

          {error && <p className="settings-page__error">{error}</p>}
          {saved && <p className="settings-page__success">Dados salvos.</p>}

          <button type="submit" className="settings-page__submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      )}
    </div>
  )
}
