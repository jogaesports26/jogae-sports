import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { usePainelContext } from '../components/panel/PainelLayout'
import { SessionExpiredError } from '../lib/api'
import { fetchProfile, updateProfile } from '../lib/profile'
import { fetchCep } from '../lib/cep'
import { AMENITY_OPTIONS } from '../lib/amenities'
import './SettingsPage.css'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function SettingsPage() {
  const { onSessionExpired } = usePainelContext()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState('')
  const [aboutDescription, setAboutDescription] = useState('')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  async function handleCepLookup() {
    if (cep.replace(/\D/g, '').length !== 8) {
      setCepError('Digite um CEP com 8 dígitos')
      return
    }

    setCepLoading(true)
    setCepError('')
    try {
      const result = await fetchCep(cep)
      setAddress(`${result.logradouro}, ${result.bairro}, ${result.cidade} - ${result.uf}`)
    } catch (err) {
      setCepError(err instanceof Error ? err.message : 'CEP não encontrado')
    } finally {
      setCepLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        setName(profile.establishmentName ?? '')
        setPhone(profile.establishmentPhone ?? '')
        setAddress(profile.establishmentAddress ?? '')
        setSlug(profile.establishmentSlug ?? '')
        setSlugTouched(Boolean(profile.establishmentSlug))
        setMonthlyRevenueGoal(
          profile.monthlyRevenueGoal !== null ? String(profile.monthlyRevenueGoal) : '',
        )
        setAboutDescription(profile.aboutDescription ?? '')
        setCoverPhotoUrl(profile.coverPhotoUrl ?? '')
        setAmenities(profile.amenities)
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
      const parsedGoal = monthlyRevenueGoal.replace(',', '.').trim()

      await updateProfile({
        establishmentName: name,
        establishmentPhone: phone,
        establishmentAddress: address,
        establishmentSlug: slug,
        aboutDescription,
        coverPhotoUrl,
        amenities,
        ...(parsedGoal ? { monthlyRevenueGoal: Number(parsedGoal) } : {}),
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

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(slugify(value))
  }

  function toggleAmenity(value: string) {
    setAmenities((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]))
  }

  async function handleCopyLink() {
    const link = `${window.location.origin}/${slug}`
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // clipboard indisponível (ex: contexto não seguro) — sem tratamento especial
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
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Ex: Arena Gol de Placa"
            />
          </label>

          <label className="settings-page__field">
            <span>Link da sua lojinha</span>
            <div className="settings-page__slug-row">
              <span className="settings-page__slug-prefix">jogae.com/</span>
              <input
                value={slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="arena-gol-de-placa"
              />
            </div>
            <span className="settings-page__hint">
              É esse link que você compartilha com seus clientes pra eles reservarem — no
              WhatsApp, Instagram ou num QR code na recepção.
            </span>
            {slug && (
              <div className="settings-page__slug-preview">
                <span>{`${window.location.origin}/${slug}`}</span>
                <button type="button" onClick={handleCopyLink}>
                  {linkCopied ? 'Copiado!' : 'Copiar link'}
                </button>
              </div>
            )}
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
            <span>CEP</span>
            <div className="settings-page__cep-row">
              <input
                value={cep}
                onChange={(event) => setCep(event.target.value)}
                placeholder="60000-000"
                maxLength={9}
              />
              <button type="button" onClick={handleCepLookup} disabled={cepLoading}>
                {cepLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {cepError && <span className="settings-page__cep-error">{cepError}</span>}
          </label>

          <label className="settings-page__field">
            <span>Endereço</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Rua, número, bairro, cidade"
            />
          </label>

          <label className="settings-page__field">
            <span>Foto de capa da lojinha (URL)</span>
            <input
              value={coverPhotoUrl}
              onChange={(event) => setCoverPhotoUrl(event.target.value)}
              placeholder="https://..."
            />
            <span className="settings-page__hint">
              Aparece no topo da sua lojinha pública. Cole o link de uma imagem já hospedada em algum
              lugar (Instagram, Google Drive público, etc.).
            </span>
            {coverPhotoUrl && (
              <img src={coverPhotoUrl} alt="Prévia da foto de capa" className="settings-page__cover-preview" />
            )}
          </label>

          <label className="settings-page__field">
            <span>Sobre o estabelecimento</span>
            <textarea
              value={aboutDescription}
              onChange={(event) => setAboutDescription(event.target.value)}
              placeholder="Conte um pouco sobre o espaço: história, diferenciais, horário de funcionamento..."
              rows={4}
              maxLength={1000}
            />
            <span className="settings-page__hint">Aparece na sua lojinha pública, abaixo das quadras.</span>
          </label>

          <div className="settings-page__field">
            <span>Comodidades</span>
            <div className="settings-page__amenities">
              {AMENITY_OPTIONS.map((option) => (
                <label key={option.value} className="settings-page__amenity">
                  <input
                    type="checkbox"
                    checked={amenities.includes(option.value)}
                    onChange={() => toggleAmenity(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <span className="settings-page__hint">Aparecem como tags na sua lojinha pública.</span>
          </div>

          <label className="settings-page__field">
            <span>Meta de faturamento mensal</span>
            <div className="settings-page__slug-row">
              <span className="settings-page__slug-prefix">R$</span>
              <input
                value={monthlyRevenueGoal}
                onChange={(event) => setMonthlyRevenueGoal(event.target.value)}
                placeholder="5000"
                inputMode="decimal"
              />
            </div>
            <span className="settings-page__hint">
              Usada pra mostrar o progresso do mês na tela de relatórios.
            </span>
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
