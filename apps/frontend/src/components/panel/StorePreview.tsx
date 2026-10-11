import { amenityLabel } from '../../lib/amenities'

interface StorePreviewProps {
  name: string
  address: string
  coverUrl: string
  amenities: string[]
  courtsCount: number
  fromPrice: number | null
}

/** Como o cliente enxerga a lojinha: muda na hora, conforme o gestor edita. */
export default function StorePreview({ name, address, coverUrl, amenities, courtsCount, fromPrice }: StorePreviewProps) {
  return (
    <aside className="store-preview-wrap" aria-label="Prévia da lojinha">
      <p className="store-preview__caption">Como o cliente vê</p>
      <div className="panel-card store-preview">
        <div className="store-preview__cover" style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined} aria-hidden="true" />
        <div className="store-preview__body">
          <strong>{name || 'Nome da arena'}</strong>
          <p>{address || 'Endereço da arena'}</p>
          <p>
            {courtsCount} {courtsCount === 1 ? 'quadra' : 'quadras'}
            {fromPrice !== null && <> · a partir de R$ {fromPrice.toFixed(0)}/h</>}
          </p>
          {amenities.length > 0 && (
            <div className="store-preview__tags">
              {amenities.slice(0, 4).map((amenity) => (
                <span key={amenity}>{amenityLabel(amenity)}</span>
              ))}
              {amenities.length > 4 && <span>+{amenities.length - 4}</span>}
            </div>
          )}
          <div className="store-preview__button">Reservar</div>
        </div>
      </div>
    </aside>
  )
}
