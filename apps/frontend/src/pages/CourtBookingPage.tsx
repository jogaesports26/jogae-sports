import { useEffect, useRef, useState } from 'react'
import type { UIEvent } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { fetchCourtReviews, fetchPublicAgenda, fetchPublicCourt } from '../lib/player'
import type { AgendaResponse } from '../lib/reservations'
import type { CourtReview, PublicCourt } from '../lib/player'
import { SPORT_OPTIONS, SURFACE_OPTIONS } from '../lib/courts'
import {
  addDays,
  findOccupant,
  formatDuration,
  formatMinutes,
  getAvailableStartTimes,
  getDayStepGrid,
  sumPriceForRange,
  toDateInputValue,
  WEEKDAY_SHORT,
} from '../lib/weekGrid'
import { SoccerBall, Basketball, Volleyball, TennisBall, Trophy } from './SportIcons'
import BookingFlowModal from '../components/portal/BookingFlowModal'
import WaitlistJoinModal from '../components/portal/WaitlistJoinModal'
import HeartToggle from '../components/HeartToggle'
import { shareOrCopy } from '../lib/share'
import { showToast } from '../lib/toast'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import './CourtBookingPage.css'

const sportLabel = (value: string) => SPORT_OPTIONS.find((option) => option.value === value)?.label ?? value
const surfaceLabel = (value: string) =>
  SURFACE_OPTIONS.find((option) => option.value === value)?.label ?? value

const DURATION_CHOICES = [30, 45, 60, 90, 120, 150, 180, 240]

const SPORT_ICONS: Record<string, typeof SoccerBall> = {
  FUTEBOL: SoccerBall,
  FUTSAL: SoccerBall,
  SOCIETY: SoccerBall,
  VOLEI: Volleyball,
  BEACH_TENNIS: TennisBall,
  TENIS: TennisBall,
  BASQUETE: Basketball,
}

function sportIcon(value: string) {
  const Icon = SPORT_ICONS[value] ?? Trophy
  return <Icon />
}

type Period = 'manha' | 'tarde' | 'noite'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'manha', label: 'Manhã' },
  { key: 'tarde', label: 'Tarde' },
  { key: 'noite', label: 'Noite' },
]

function periodOf(minute: number): Period {
  if (minute < 12 * 60) return 'manha'
  if (minute < 18 * 60) return 'tarde'
  return 'noite'
}

function formatDayLabel(day: Date) {
  const dd = String(day.getDate()).padStart(2, '0')
  const mm = String(day.getMonth() + 1).padStart(2, '0')
  return `${WEEKDAY_SHORT[day.getDay()]}, ${dd}/${mm}/${day.getFullYear()}`
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15V4m0 0L8 8m4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface PendingSlot {
  dayDate: Date
  dayLabel: string
  startMinute: number
  endMinute: number
  price: number
}

type SlotView =
  | { kind: 'taken'; startMinute: number; endMinute: number }
  | { kind: 'available'; startMinute: number; endMinute: number; price: number }

function formatSlotPrice(price: number) {
  return Number.isInteger(price) ? `R$ ${price}` : `R$ ${price.toFixed(2).replace('.', ',')}`
}

interface WaitlistSlot {
  dayDate: Date
  dayLabel: string
  startMinute: number
  endMinute: number
}

export default function CourtBookingPage() {
  const { courtId, slug } = useParams<{ courtId: string; slug: string }>()
  const { basePath } = useOutletContext<{ basePath: string }>()
  const [court, setCourt] = useState<PublicCourt | null>(null)
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null)
  const [reviews, setReviews] = useState<CourtReview[]>([])
  const [error, setError] = useState('')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [pendingSlot, setPendingSlot] = useState<PendingSlot | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<PendingSlot | null>(null)
  const [waitlistSlot, setWaitlistSlot] = useState<WaitlistSlot | null>(null)
  const [period, setPeriod] = useState<Period | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [amenitiesOpen, setAmenitiesOpen] = useState(false)
  const pickedDayRef = useRef(false)

  useDocumentTitle(
    court ? `${court.name}${court.owner.establishmentName ? ` · ${court.owner.establishmentName}` : ''}` : null,
  )

  async function load() {
    if (!courtId) return
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [courtData, agendaData, reviewsData] = await Promise.all([
        fetchPublicCourt(courtId),
        fetchPublicAgenda(courtId, toDateInputValue(today)),
        fetchCourtReviews(courtId).catch(() => []),
      ])
      setCourt(courtData)
      setAgenda(agendaData)
      setReviews(reviewsData)

      if (!pickedDayRef.current) {
        pickedDayRef.current = true
        for (let i = 0; i < 7; i++) {
          const day = addDays(today, i)
          const starts = getAvailableStartTimes(
            day.getDay(),
            courtData.minBookingMinutes,
            courtData.bookingStepMinutes,
            agendaData.priceRules,
            day,
            agendaData.reservations,
            agendaData.maintenanceBlocks,
            agendaData.recurringMaintenanceBlocks,
          )
          if (starts.length > 0) {
            if (i !== 0) setSelectedDayIndex(i)
            break
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a quadra')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  if (error) {
    return (
      <div className="booking-page__error-card">
        <p>{error}</p>
        <Link to={basePath || '/'} className="btn btn--outline btn--sm">
          {basePath ? 'Voltar pra lojinha' : 'Voltar pro início'}
        </Link>
      </div>
    )
  }
  if (!court || !agenda) {
    return (
      <div className="booking-page" aria-busy="true" aria-label="Carregando a quadra">
        <div className="skeleton booking-skeleton booking-skeleton--hero" />
        <div className="skeleton booking-skeleton booking-skeleton--sheet" />
        <div className="skeleton booking-skeleton booking-skeleton--pills" />
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const selectedDay = days[selectedDayIndex]
  const selectedDayOfWeek = selectedDay.getDay()
  const selectedDayLabel = formatDayLabel(selectedDay)

  const dayGrid = getDayStepGrid(selectedDayOfWeek, court.bookingStepMinutes, agenda.priceRules)

  const durationOptions = [...new Set([court.minBookingMinutes, ...DURATION_CHOICES])]
    .filter((d) => d >= court.minBookingMinutes && (court.maxBookingMinutes == null || d <= court.maxBookingMinutes))
    .sort((a, b) => a - b)
  const duration =
    selectedDuration !== null && durationOptions.includes(selectedDuration) ? selectedDuration : court.minBookingMinutes

  const availableStarts = new Set(
    getAvailableStartTimes(
      selectedDayOfWeek,
      duration,
      court.bookingStepMinutes,
      agenda.priceRules,
      selectedDay,
      agenda.reservations,
      agenda.maintenanceBlocks,
      agenda.recurringMaintenanceBlocks,
    ),
  )

  const slots: SlotView[] = dayGrid.flatMap((cellStart): SlotView[] => {
    const cellEnd = cellStart + court.bookingStepMinutes
    const occupant = findOccupant(
      selectedDay,
      cellStart,
      cellEnd,
      agenda.reservations,
      agenda.maintenanceBlocks,
      agenda.recurringMaintenanceBlocks,
    )
    if (occupant?.type === 'reservation') return [{ kind: 'taken', startMinute: cellStart, endMinute: cellEnd }]
    // Só mostra esse início se a duração escolhida couber inteira, sem buraco nem choque, a partir daqui.
    if (occupant || !availableStarts.has(cellStart)) return []
    const endMinute = cellStart + duration
    const price = sumPriceForRange(selectedDayOfWeek, cellStart, endMinute, agenda.priceRules) ?? 0
    return [{ kind: 'available', startMinute: cellStart, endMinute, price }]
  })
  const availablePrices = slots.flatMap((slot) => (slot.kind === 'available' ? [slot.price] : []))
  const lowestPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null
  const hasPriceVariation = lowestPrice !== null && Math.max(...availablePrices) > lowestPrice

  const dayStartsCount = (index: number) => {
    const day = days[index]
    return getAvailableStartTimes(
      day.getDay(),
      duration,
      court.bookingStepMinutes,
      agenda.priceRules,
      day,
      agenda.reservations,
      agenda.maintenanceBlocks,
      agenda.recurringMaintenanceBlocks,
    ).length
  }
  const suggestedDayIndex = [
    ...days.map((_, index) => index).filter((index) => index > selectedDayIndex),
    ...days.map((_, index) => index).filter((index) => index < selectedDayIndex),
  ].find((index) => dayStartsCount(index) > 0)
  const suggestionButton =
    suggestedDayIndex !== undefined ? (
      <button type="button" className="btn btn--outline btn--sm booking-section__suggestion" onClick={() => selectDay(suggestedDayIndex)}>
        Ver {formatDayLabel(days[suggestedDayIndex])} · {dayStartsCount(suggestedDayIndex)}{' '}
        {dayStartsCount(suggestedDayIndex) === 1 ? 'horário livre' : 'horários livres'}
      </button>
    ) : (
      <p className="booking-section__empty">Sem horários livres nos próximos 7 dias. Fale com o local pra combinar.</p>
    )

  const periodsWithSlots = PERIODS.filter((item) => slots.some((slot) => periodOf(slot.startMinute) === item.key))
  const activePeriod =
    period && periodsWithSlots.some((item) => item.key === period) ? period : (periodsWithSlots[0]?.key ?? null)
  const visibleSlots = periodsWithSlots.length > 1 ? slots.filter((slot) => periodOf(slot.startMinute) === activePeriod) : slots
  const availableCountByPeriod = (key: Period) =>
    slots.filter((slot) => slot.kind === 'available' && periodOf(slot.startMinute) === key).length

  const amenities = [
    surfaceLabel(court.surfaceType),
    ...(court.hasLighting ? ['Iluminação'] : []),
    `Reserva mínima de ${formatDuration(court.minBookingMinutes)}`,
    ...(court.maxBookingMinutes != null ? [`Até ${formatDuration(court.maxBookingMinutes)} por reserva`] : []),
    'Cancelamento até 2h antes',
  ]
  const visibleAmenities = amenitiesOpen ? amenities : amenities.slice(0, 4)
  const fromPrice =
    agenda.priceRules.length > 0 ? Math.min(...agenda.priceRules.map((rule) => Number(rule.pricePerHour))) : null

  const photos = court.photoUrls
  const establishmentName = court.owner.establishmentName

  function selectDay(index: number) {
    setSelectedDayIndex(index)
    setPendingSlot(null)
  }

  function selectDuration(minutes: number) {
    setSelectedDuration(minutes)
    setPendingSlot(null)
  }

  function handleCarouselScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget
    setPhotoIndex(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)))
  }

  async function handleShare() {
    const result = await shareOrCopy({
      title: court!.name,
      text: `Olha essa quadra: ${court!.name}`,
      url: `${window.location.origin}${basePath}/${court!.id}`,
    })
    if (result === 'copied') showToast('Link copiado!', 'success')
    if (result === 'failed') showToast('Não deu pra compartilhar. Copie o link da barra de endereço.', 'error')
  }

  function confirmPendingSlot() {
    if (pendingSlot) setSelectedSlot(pendingSlot)
  }

  return (
    <div className="booking-page">
      <div className="booking-hero">
        <div className="booking-hero__media">
          {photos.length > 0 ? (
            <div className="booking-hero__carousel" onScroll={handleCarouselScroll}>
              {photos.map((photo, index) => (
                <img
                  key={`${index}-${photo.slice(-16)}`}
                  src={photo}
                  alt={`${court.name} — foto ${index + 1}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="booking-hero__photo"
                />
              ))}
            </div>
          ) : (
            <div className="booking-hero__fallback">{sportIcon(court.sport)}</div>
          )}
          <div className="booking-hero__scrim" />
          <Link to={basePath} className="booking-hero__back" aria-label="Voltar pra lojinha">
            ←
          </Link>
          <HeartToggle courtId={court.id} className="booking-hero__favorite" />
          <button type="button" className="booking-hero__share" onClick={handleShare} aria-label="Compartilhar quadra">
            <ShareIcon />
          </button>
          {photos.length > 1 && (
            <div className="booking-hero__dots" aria-hidden="true">
              {photos.map((_, index) => (
                <span key={index} className={`booking-hero__dot${index === photoIndex ? ' booking-hero__dot--active' : ''}`} />
              ))}
            </div>
          )}
        </div>

        <div className="booking-sheet">
          <h1>{court.name}</h1>
          <div className="booking-sheet__meta">
            {(court.owner.establishmentAddress || establishmentName) && (
              <span className="booking-sheet__place">
                <PinIcon />
                {court.owner.establishmentAddress ?? establishmentName}
              </span>
            )}
            {court.reviewCount > 0 && (
              <span className="booking-sheet__rating">
                ★ {court.averageRating?.toFixed(1)}
                {' · '}
                <a href="#avaliacoes">
                  {court.reviewCount} {court.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                </a>
              </span>
            )}
          </div>
          {establishmentName && <p className="booking-hero__establishment">{establishmentName}</p>}

          <div className="booking-hero__tags">
            <span className="pill pill--info">{sportLabel(court.sport)}</span>
            <span className="pill pill--neutral">{surfaceLabel(court.surfaceType)}</span>
            {court.hasLighting && <span className="pill pill--neutral">Com iluminação</span>}
          </div>

          {fromPrice !== null && (
            <p className="booking-sheet__price">
              <span className="booking-sheet__price-label">a partir de</span>
              <strong>{formatSlotPrice(fromPrice)}</strong>
              <span className="booking-sheet__price-label">por hora</span>
            </p>
          )}

          <ul className="booking-amenities">
            {visibleAmenities.map((item) => (
              <li key={item}>
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
          {amenities.length > 4 && (
            <button type="button" className="booking-sheet__more" onClick={() => setAmenitiesOpen((open) => !open)}>
              {amenitiesOpen ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>
      </div>

      <section className="booking-section">
        <h2 className="booking-section__title">Escolha o dia</h2>
        <div className="day-pills">
          {days.map((day, index) => {
            const dayOfWeek = day.getDay()
            const active = index === selectedDayIndex
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`day-pill${active ? ' day-pill--active' : ''}`}
                onClick={() => selectDay(index)}
                aria-pressed={active}
              >
                <span className="day-pill__weekday">{WEEKDAY_SHORT[dayOfWeek]}</span>
                <span className="day-pill__number">{day.getDate()}</span>
              </button>
            )
          })}
        </div>
      </section>

      {durationOptions.length > 1 && (
        <section className="booking-section">
          <h2 className="booking-section__title">Quanto tempo você quer jogar?</h2>
          <div className="duration-pills">
            {durationOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`duration-pill${duration === minutes ? ' duration-pill--active' : ''}`}
                onClick={() => selectDuration(minutes)}
                aria-pressed={duration === minutes}
              >
                {formatDuration(minutes)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="booking-section">
        <h2 className="booking-section__title">Horários · {selectedDayLabel}</h2>
        {dayGrid.length === 0 ? (
          <div className="booking-section__empty-block">
            <p className="booking-section__empty">Sem horários disponíveis nesse dia.</p>
            {suggestionButton}
          </div>
        ) : slots.length === 0 ? (
          <div className="booking-section__empty-block">
            <p className="booking-section__empty">
              Nenhum horário livre de {formatDuration(duration)} nesse dia. Tente uma duração menor ou outro dia.
            </p>
            {suggestionButton}
          </div>
        ) : (
          <>
            {hasPriceVariation && (
              <p className="booking-section__hint">
                Preço total pra {formatDuration(duration)}. Em verde, os horários mais baratos do dia.
              </p>
            )}
            {periodsWithSlots.length > 1 && (
              <div className="period-tabs" role="tablist" aria-label="Período do dia">
                {periodsWithSlots.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={activePeriod === item.key}
                    className={`period-tab${activePeriod === item.key ? ' period-tab--active' : ''}`}
                    onClick={() => setPeriod(item.key)}
                  >
                    {item.label}
                    <span className="period-tab__count">{availableCountByPeriod(item.key)}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="time-pills">
              {visibleSlots.map((slot) => {
                if (slot.kind === 'taken') {
                  return (
                    <div key={slot.startMinute} className="time-pill time-pill--taken">
                      <span>{formatMinutes(slot.startMinute)}</span>
                      <button
                        type="button"
                        className="time-pill__notify"
                        onClick={() =>
                          setWaitlistSlot({
                            dayDate: selectedDay,
                            dayLabel: selectedDayLabel,
                            startMinute: slot.startMinute,
                            endMinute: slot.endMinute,
                          })
                        }
                      >
                        Avise-me
                      </button>
                    </div>
                  )
                }

                // pendingSlot é sempre limpo ao trocar de dia/duração, então só precisa comparar o horário.
                const isPending = pendingSlot?.startMinute === slot.startMinute
                const isLowestPrice = hasPriceVariation && slot.price === lowestPrice

                return (
                  <button
                    key={slot.startMinute}
                    type="button"
                    className={`time-pill${isPending ? ' time-pill--active' : ''}`}
                    onClick={() =>
                      setPendingSlot({
                        dayDate: selectedDay,
                        dayLabel: selectedDayLabel,
                        startMinute: slot.startMinute,
                        endMinute: slot.endMinute,
                        price: slot.price,
                      })
                    }
                  >
                    <span className="time-pill__time">
                      {formatMinutes(slot.startMinute)}–{formatMinutes(slot.endMinute)}
                    </span>
                    <span className={`time-pill__price${isLowestPrice ? ' time-pill__price--lowest' : ''}`}>
                      {formatSlotPrice(slot.price)}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </section>

      {reviews.length > 0 && (
        <section id="avaliacoes" className="booking-section booking-page__reviews">
          <h2 className="booking-section__title">O que os clientes acharam</h2>
          <div className="booking-page__reviews-list">
            {reviews.map((review) => (
              <div className="booking-review" key={review.id}>
                <div className="booking-review__header">
                  <span className="booking-review__stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="booking-review__author">{review.player.name ?? 'Jogador'}</span>
                </div>
                {review.comment && <p className="booking-review__comment">{review.comment}</p>}
                {review.ownerReply && (
                  <div className="booking-review__reply">
                    <span className="booking-review__reply-label">Resposta do estabelecimento</span>
                    <p>{review.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingSlot && (
        <div className="booking-summary-bar">
          <div className="booking-summary-bar__info">
            <strong>
              {pendingSlot.dayLabel} · {formatMinutes(pendingSlot.startMinute)}–{formatMinutes(pendingSlot.endMinute)}
            </strong>
            <span>R$ {pendingSlot.price.toFixed(2).replace('.', ',')}</span>
          </div>
          <button type="button" className="btn btn--primary" onClick={confirmPendingSlot}>
            Reservar agora
          </button>
        </div>
      )}

      {selectedSlot && courtId && slug && (
        <BookingFlowModal
          courtId={courtId}
          courtName={court.name}
          establishmentName={establishmentName}
          photoUrl={court.photoUrls[0] ?? null}
          sportLabel={sportLabel(court.sport)}
          slug={slug}
          dayLabel={selectedSlot.dayLabel}
          dayDate={selectedSlot.dayDate}
          startMinute={selectedSlot.startMinute}
          endMinute={selectedSlot.endMinute}
          price={selectedSlot.price}
          onClose={() => setSelectedSlot(null)}
          onBooked={() => {
            setPendingSlot(null)
            load()
          }}
        />
      )}

      {waitlistSlot && courtId && (
        <WaitlistJoinModal
          courtId={courtId}
          courtName={court.name}
          dayLabel={waitlistSlot.dayLabel}
          dayDate={waitlistSlot.dayDate}
          startMinute={waitlistSlot.startMinute}
          endMinute={waitlistSlot.endMinute}
          onClose={() => setWaitlistSlot(null)}
        />
      )}
    </div>
  )
}
