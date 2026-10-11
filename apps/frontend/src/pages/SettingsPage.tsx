import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePainelContext } from '../components/panel/PainelLayout'
import ChipToggle from '../components/panel/ChipToggle'
import CopyButton from '../components/panel/CopyButton'
import PageHeader from '../components/panel/PageHeader'
import SaveStatus from '../components/panel/SaveStatus'
import SettingRow from '../components/panel/SettingRow'
import SetupProgress from '../components/panel/SetupProgress'
import SimplePricing from '../components/panel/SimplePricing'
import StorePreview from '../components/panel/StorePreview'
import ThemeSettings from '../components/panel/ThemeSettings'
import ImageDropzone from '../components/ImageDropzone'
import { useSaveStatus } from '../hooks/useSaveStatus'
import { SessionExpiredError } from '../lib/api'
import { AMENITY_OPTIONS } from '../lib/amenities'
import { fetchCep } from '../lib/cep'
import { fetchCourts } from '../lib/courts'
import type { Court } from '../lib/courts'
import { fetchProfile, updateProfile } from '../lib/profile'
import type { Profile, ProfileInput } from '../lib/profile'

const SHARED_KEY = 'jogae_lojinha_compartilhada'

type Section = 'arena' | 'lojinha' | 'aparencia' | 'precos' | 'metas'

const SECTIONS: Record<Section, { title: string; description: string }> = {
  arena: { title: 'Arena', description: 'Os dados básicos do seu espaço. Aparecem para os clientes na hora de reservar.' },
  lojinha: { title: 'Lojinha pública', description: 'A página onde seus clientes reservam. Cada mudança é salva na hora.' },
  aparencia: { title: 'Aparência', description: 'Cores e estilo da sua lojinha.' },
  precos: { title: 'Preços', description: 'Defina o preço por hora em três campos e aplique em várias quadras de uma vez.' },
  metas: { title: 'Metas', description: 'Sua meta ajuda a acompanhar o mês na tela Hoje e no Financeiro.' },
}

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

function readShared() {
  try {
    return localStorage.getItem(SHARED_KEY) === '1'
  } catch {
    return false
  }
}

export default function SettingsPage() {
  const { onSessionExpired } = usePainelContext()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('aba')
  const section: Section = (requested && requested in SECTIONS ? requested : 'arena') as Section

  const [profile, setProfile] = useState<Profile | null>(null)
  const [courts, setCourts] = useState<Court[] | null>(null)
  const [error, setError] = useState('')
  const [shared, setShared] = useState(readShared)
  const [embedThemed, setEmbedThemed] = useState(true)
  const [qrError, setQrError] = useState('')
  const coverStatus = useSaveStatus()
  const amenitiesStatus = useSaveStatus()

  const load = useCallback(async () => {
    try {
      const [loadedProfile, loadedCourts] = await Promise.all([fetchProfile(), fetchCourts()])
      setProfile(loadedProfile)
      setCourts(loadedCourts)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        onSessionExpired()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as configurações')
    }
  }, [onSessionExpired])

  useEffect(() => {
    load()
  }, [load])

  /** Grava só o que mudou e atualiza a tela com a resposta do servidor. Erros sobem para a linha que chamou. */
  async function save(input: ProfileInput) {
    try {
      const updated = await updateProfile(input)
      setProfile((current) => (current ? { ...current, ...updated } : updated))
    } catch (err) {
      if (err instanceof SessionExpiredError) onSessionExpired()
      throw err
    }
  }

  const activeCourts = useMemo(() => (courts ?? []).filter((court) => court.active), [courts])
  const fromPrice = useMemo(() => {
    const prices = activeCourts.flatMap((court) => court.priceRules.map((rule) => Number(rule.pricePerHour)))
    return prices.length > 0 ? Math.min(...prices) : null
  }, [activeCourts])

  if (error) return <p className="empty-state">{error}</p>
  if (!profile || !courts) return <div className="skeleton" style={{ height: 320, borderRadius: 16 }} aria-label="Carregando as configurações" />

  const slug = profile.establishmentSlug ?? ''
  const storeUrl = slug ? `${window.location.origin}/${slug}` : ''
  const markShared = () => {
    try {
      localStorage.setItem(SHARED_KEY, '1')
    } catch {
      // sem armazenamento: o passo só conta nesta visita
    }
    setShared(true)
  }

  const steps = [
    { label: 'Cadastrar uma quadra', done: courts.length > 0, to: '/painel/quadras' },
    { label: 'Definir os preços', done: courts.some((court) => court.priceRules.length > 0), to: '/painel/configuracoes?aba=precos' },
    { label: 'Escolher o link da lojinha', done: Boolean(slug), to: '/painel/configuracoes?aba=lojinha' },
    { label: 'Compartilhar a lojinha', done: shared, to: '/painel/configuracoes?aba=lojinha' },
  ]

  async function toggleAmenity(value: string) {
    const current = profile?.amenities ?? []
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    setProfile((p) => (p ? { ...p, amenities: next } : p))
    const ok = await amenitiesStatus.run(() => save({ amenities: next }))
    if (!ok) setProfile((p) => (p ? { ...p, amenities: current } : p))
  }

  async function changeCover(photos: string[]) {
    const previous = profile?.coverPhotoUrl ?? ''
    setProfile((p) => (p ? { ...p, coverPhotoUrl: photos[0] ?? '' } : p))
    const ok = await coverStatus.run(() => save({ coverPhotoUrl: photos[0] ?? '' }))
    if (!ok) setProfile((p) => (p ? { ...p, coverPhotoUrl: previous } : p))
  }

  async function downloadQr() {
    setQrError('')
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(storeUrl)}`
    try {
      const response = await fetch(qrUrl)
      if (!response.ok) throw new Error('QR indisponível')
      const blobUrl = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `qrcode-${slug}.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(blobUrl)
      markShared()
    } catch {
      window.open(qrUrl, '_blank')
      setQrError('Não deu para baixar direto. Abrimos a imagem numa aba nova: clique com o botão direito e escolha "Salvar imagem".')
    }
  }

  const embedCode = `<iframe src="${storeUrl}/embed${embedThemed ? '?theme=auto' : ''}" width="100%" height="640" style="border:0" title="Reservar quadra"></iframe>`

  return (
    <div className="settings-page">
      <PageHeader title={SECTIONS[section].title} subtitle={SECTIONS[section].description} />

      {section === 'arena' && (
        <>
          <SetupProgress steps={steps} />
          <div className="setting-list">
            <SettingRow
              label="Nome da arena"
              value={profile.establishmentName ?? ''}
              placeholder="Ex.: Arena Gol de Placa"
              hint="É o nome que seus clientes veem na lojinha e no comprovante."
              validate={(value) => (value.trim().length < 2 ? 'Escreva pelo menos 2 letras.' : null)}
              onSave={(value) => save({ establishmentName: value.trim() })}
            />
            <SettingRow
              label="Telefone de contato"
              value={profile.establishmentPhone ?? ''}
              placeholder="(85) 99999-9999"
              inputMode="tel"
              hint="Aparece para o cliente chamar no WhatsApp."
              onSave={(value) => save({ establishmentPhone: value.trim() })}
            />
            <SettingRow
              label="Endereço"
              value={profile.establishmentAddress ?? ''}
              placeholder="Rua, número, bairro, cidade"
              hint="Digite o CEP e toque em Buscar para preencher sozinho."
              onSave={(value) => save({ establishmentAddress: value.trim() })}
              editorExtra={({ setDraft }) => <CepLookup onFound={setDraft} />}
            />
          </div>
        </>
      )}

      {section === 'lojinha' && (
        <div className="store-layout">
          <div className="setting-list">
            <SettingRow
              label="Link da lojinha"
              prefix={`${window.location.origin}/`}
              value={slug}
              display={storeUrl}
              placeholder="arena-gol-de-placa"
              hint="Só letras minúsculas, números e hífen. É esse link que você manda para os clientes."
              normalize={slugify}
              validate={(value) => (value.trim().length < 3 ? 'Use pelo menos 3 caracteres.' : null)}
              onSave={(value) => save({ establishmentSlug: value })}
              extra={storeUrl ? <CopyButton text={storeUrl} label="Copiar link" onCopied={markShared} /> : undefined}
            />

            <SettingRow
              label="Sobre a arena"
              value={profile.aboutDescription ?? ''}
              multiline
              maxLength={1000}
              placeholder="Conte um pouco do espaço: diferenciais, horário de funcionamento…"
              hint="Aparece na lojinha, abaixo das quadras."
              onSave={(value) => save({ aboutDescription: value.trim() })}
            />

            <div className="setting-block">
              <span className="setting-block__label">Comodidades</span>
              <p className="setting-block__hint">Aparecem como etiquetas na lojinha.</p>
              <div className="chip-group" role="group" aria-label="Comodidades">
                {AMENITY_OPTIONS.map((option) => (
                  <ChipToggle
                    key={option.value}
                    label={option.label}
                    checked={profile.amenities.includes(option.value)}
                    onChange={() => toggleAmenity(option.value)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <SaveStatus state={amenitiesStatus.state} message={amenitiesStatus.message} />
              </div>
            </div>

            <div className="setting-block">
              <span className="setting-block__label">Foto de capa</span>
              <p className="setting-block__hint">Aparece no topo da lojinha. Salva assim que você escolhe a imagem.</p>
              <ImageDropzone value={profile.coverPhotoUrl ? [profile.coverPhotoUrl] : []} onChange={changeCover} />
              <div style={{ marginTop: 10 }}>
                <SaveStatus state={coverStatus.state} message={coverStatus.message} />
              </div>
            </div>

            {slug && (
              <div className="setting-block">
                <span className="setting-block__label">QR code da lojinha</span>
                <div className="store-qr">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(storeUrl)}`}
                    alt={`QR code da lojinha ${slug}`}
                    width={96}
                    height={96}
                  />
                  <div>
                    <p>Imprima e deixe na recepção para o cliente escanear e reservar pelo celular.</p>
                    <button type="button" className="btn btn--outline btn--sm" onClick={downloadQr}>
                      Baixar QR code
                    </button>
                    {qrError && <p className="setting-row__error" role="alert">{qrError}</p>}
                  </div>
                </div>
              </div>
            )}

            {slug && (
              <div className="setting-block">
                <span className="setting-block__label">Mostrar a lojinha no seu site</span>
                <p className="setting-block__hint">Cole este código numa página do seu site para os clientes reservarem sem sair de lá.</p>
                <ChipToggle label="Usar as cores da minha lojinha" checked={embedThemed} onChange={setEmbedThemed} />
                <code className="embed-code">{embedCode}</code>
                <CopyButton text={embedCode} label="Copiar código" onCopied={markShared} />
              </div>
            )}
          </div>

          <StorePreview
            name={profile.establishmentName ?? ''}
            address={profile.establishmentAddress ?? ''}
            coverUrl={profile.coverPhotoUrl ?? ''}
            amenities={profile.amenities}
            courtsCount={activeCourts.length}
            fromPrice={fromPrice}
          />
        </div>
      )}

      {section === 'aparencia' && (
        <ThemeSettings initial={profile.theme ?? null} storeName={profile.establishmentName ?? ''} onSessionExpired={onSessionExpired} />
      )}

      {section === 'precos' &&
        (activeCourts.length === 0 ? (
          <div className="panel-card empty-state">
            <p>Cadastre uma quadra primeiro para definir os preços.</p>
            <a href="/painel/quadras">Ir para as quadras</a>
          </div>
        ) : (
          <SimplePricing courts={activeCourts} onApplied={load} onSessionExpired={onSessionExpired} />
        ))}

      {section === 'metas' && (
        <div className="setting-list">
          <SettingRow
            label="Meta de faturamento do mês"
            prefix="R$"
            value={profile.monthlyRevenueGoal !== null ? String(profile.monthlyRevenueGoal) : ''}
            display={profile.monthlyRevenueGoal !== null ? `R$ ${profile.monthlyRevenueGoal.toLocaleString('pt-BR')}` : undefined}
            inputMode="decimal"
            placeholder="5000"
            hint="Usada para mostrar o progresso do mês."
            validate={(value) => {
              const parsed = Number(value.replace(',', '.').trim())
              return Number.isFinite(parsed) && parsed >= 0 && value.trim() !== '' ? null : 'Informe um valor em reais, como 5000.'
            }}
            onSave={(value) => save({ monthlyRevenueGoal: Number(value.replace(',', '.').trim()) })}
          />
        </div>
      )}
    </div>
  )
}

/** Busca o endereço pelo CEP e entrega o texto pronto para o campo do endereço. */
function CepLookup({ onFound }: { onFound: (address: string) => void }) {
  const [cep, setCep] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function lookup() {
    if (cep.replace(/\D/g, '').length !== 8) {
      setError('Digite um CEP com 8 números.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await fetchCep(cep)
      onFound(`${result.logradouro}, ${result.bairro}, ${result.cidade} - ${result.uf}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CEP não encontrado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="setting-row__editor">
        <input className="input" value={cep} onChange={(event) => setCep(event.target.value)} placeholder="CEP: 60000-000" inputMode="numeric" maxLength={9} aria-label="CEP" />
        <button type="button" className="btn btn--outline btn--sm" onClick={lookup} disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {error && <p className="setting-row__error" role="alert">{error}</p>}
    </div>
  )
}
