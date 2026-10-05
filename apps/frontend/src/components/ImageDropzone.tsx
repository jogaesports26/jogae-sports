import { useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import { resizeImageFile } from '../lib/imageUpload'
import './ImageDropzone.css'

const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024

interface ImageDropzoneProps {
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  max?: number
  hint?: string
  onProcessingChange?: (processing: boolean) => void
}

export default function ImageDropzone({ value, onChange, multiple = false, max = 6, hint, onProcessingChange }: ImageDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const limit = multiple ? max : 1
  const isFull = value.length >= limit

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    const images = files.filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) {
      setError('Envie arquivos de imagem (JPG, PNG ou WebP).')
      return
    }
    if (images.some((file) => file.size > MAX_ORIGINAL_BYTES)) {
      setError('Cada imagem pode ter até 15 MB.')
      return
    }

    const room = limit - (multiple ? value.length : 0)
    const accepted = images.slice(0, Math.max(room, 0))

    setError(images.length > accepted.length ? `Você pode ter até ${limit} ${limit === 1 ? 'foto' : 'fotos'}.` : '')
    if (accepted.length === 0) return

    setIsProcessing(true)
    onProcessingChange?.(true)
    try {
      const dataUrls = await Promise.all(accepted.map((file) => resizeImageFile(file)))
      onChange(multiple ? [...value, ...dataUrls] : [dataUrls[0]])
    } catch {
      setError('Não foi possível processar a imagem. Tente outro arquivo.')
    } finally {
      setIsProcessing(false)
      onProcessingChange?.(false)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (files) void processFiles(files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isProcessing) return
    void processFiles(event.dataTransfer.files)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  function remove(index: number) {
    setError('')
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="image-dropzone">
      {value.length > 0 && (
        <div className={`image-dropzone__grid${multiple ? '' : ' image-dropzone__grid--single'}`}>
          {value.map((src, index) => (
            <div key={`${index}-${src.slice(-24)}`} className="image-dropzone__thumb">
              <img src={src} alt={`Foto ${index + 1}`} />
              <button
                type="button"
                className="image-dropzone__remove"
                onClick={() => remove(index)}
                aria-label={`Remover foto ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {(!isFull || !multiple || isProcessing) && (
        <div
          className={`image-dropzone__area${isDragging ? ' image-dropzone__area--active' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={multiple ? 'Adicionar fotos' : 'Adicionar foto'}
          aria-busy={isProcessing}
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <span className="image-dropzone__title">
            {isProcessing ? 'Processando...' : isDragging
              ? 'Solte pra adicionar'
              : isFull
                ? 'Arraste uma nova foto pra trocar, ou clique pra escolher'
                : 'Arraste a foto aqui ou clique pra escolher'}
          </span>
          <span className="image-dropzone__hint">
            {hint ?? 'JPG, PNG ou WebP. A gente ajusta o tamanho sozinho.'}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        className="image-dropzone__input"
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {error && (
        <p className="image-dropzone__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
