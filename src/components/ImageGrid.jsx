import { Accessibility, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { memo, useCallback, useImperativeHandle, useRef, useState, useSyncExternalStore } from 'react'
import { number } from '../lib/catalog.js'

const sensors = (defaults) => [
  ...defaults.filter((sensor) => sensor !== PointerSensor),
  PointerSensor.configure({
    activationConstraints(event) {
      return event.pointerType === 'touch'
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 7 })]
        : [new PointerActivationConstraints.Distance({ value: 6 })]
    },
  }),
]

const plugins = (defaults) => [
  ...defaults.filter((plugin) => plugin !== Accessibility),
  Accessibility.configure({
    screenReaderInstructions: { draggable: 'Fotoğrafı seçmek için boşluk tuşuna basın. Ok tuşlarıyla taşıyın; bırakmak için tekrar boşluk, iptal için Escape tuşuna basın.' },
    announcements: {
      dragstart: ({ operation }) => `${operation.source?.data?.label || 'Fotoğraf'} seçildi.`,
      dragover: ({ operation }) => isSortable(operation.source) ? `Fotoğraf ${operation.source.index + 1}. sırada.` : undefined,
      dragend: ({ operation, canceled }) => canceled ? 'Sıralama iptal edildi.' : isSortable(operation.source) ? `Fotoğraf ${operation.source.index + 1}. sıraya taşındı.` : 'Fotoğraf bırakıldı.',
    },
  }),
]

const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotion = (callback) => {
  const media = window.matchMedia(motionQuery)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
const reducedMotion = () => window.matchMedia(motionQuery).matches

function MoveAnnouncement({ ref }) {
  const [message, setMessage] = useState('')
  useImperativeHandle(ref, () => ({ announce: setMessage }), [])
  return <span className="visually-hidden" aria-live="polite">{message}</span>
}

const Product = memo(function Product({ item, index, modelIndex, category, busy, onToggleDelete, onMove, previous, next, reduceMotion, exceedsUploadLimit }) {
  const currentCode = `${category.code}-${number(modelIndex)}`
  const { ref, handleRef, isDragSource, isDropping } = useSortable({
    id: item.key,
    index,
    data: { label: currentCode },
    disabled: { draggable: busy || !!item.deleted, droppable: busy },
    transition: { duration: reduceMotion ? 0 : 180, easing: 'ease', idle: true },
  })
  return <article
    ref={ref}
    id={item.key}
    className={`product${item.deleted ? ' product-deleted' : ''}${isDragSource ? ' product-drag-source' : ''}${isDropping ? ' product-dropping' : ''}`}
  >
    <div
      ref={handleRef}
      className="product-image"
      role={item.deleted ? undefined : 'button'}
      tabIndex={item.deleted || busy ? -1 : 0}
      aria-disabled={!item.deleted && busy ? true : undefined}
      aria-label={item.deleted ? undefined : `${currentCode} fotoğrafını sırala`}
      aria-roledescription={item.deleted ? undefined : 'sıralanabilir fotoğraf'}
    >
      <img src={item.previewUrl} alt={`${item.deleted ? item.name : currentCode} ${category.short} kapı önizlemesi`} width="400" height="500" loading="lazy" draggable={false} />
      {!item.deleted && <span className="image-index">{number(modelIndex)}</span>}
      {item.deleted ? <span className="image-badge deleted-badge">Silinecek</span> : item.type === 'upload' && <span className="image-badge new-badge">Yeni eklendi</span>}
      {item.deleted && <span className="deleted-overlay" aria-hidden="true" />}
      {!item.deleted && <span className="drag-cue" aria-hidden="true">⠿ <span>Taşı</span></span>}
    </div>
    <div className="product-info">
      <div><strong>{item.deleted ? 'Silinmek üzere işaretlendi' : currentCode}</strong><span title={item.name}>{item.name}</span></div>
      <button
        type="button"
        className={item.deleted ? 'restore' : 'remove'}
        disabled={busy}
        aria-label={`${item.deleted ? 'Geri al' : 'Sil'}: ${item.deleted ? item.name : currentCode}`}
        onClick={() => onToggleDelete(item.key, exceedsUploadLimit)}
      >{item.deleted ? 'Geri Al' : 'Sil'}</button>
    </div>
    {!item.deleted && <div className="move-actions" aria-label={`${currentCode} sıralama seçenekleri`}>
      <button type="button" disabled={busy || previous < 0} onClick={() => onMove(item.key, previous, modelIndex)} aria-label={`${currentCode} fotoğrafını önceki sıraya taşı`}>← Önce</button>
      <button type="button" disabled={busy || next < 0} onClick={() => onMove(item.key, next, modelIndex + 2)} aria-label={`${currentCode} fotoğrafını sonraki sıraya taşı`}>Sonra →</button>
    </div>}
  </article>
})

function ImageGrid({ items, category, busy, onMove, onToggleDelete, uploadBytes, maxTotal }) {
  const reduceMotion = useSyncExternalStore(subscribeMotion, reducedMotion, () => true)
  const announcement = useRef(null)
  let liveIndex = 0
  let previous = -1
  const neighbors = items.map(() => ({ previous: -1, next: -1 }))
  items.forEach((item, index) => {
    if (item.deleted) return
    neighbors[index].previous = previous
    if (previous >= 0) neighbors[previous].next = index
    previous = index
  })
  const moveWithAnnouncement = useCallback((key, target, position) => {
    onMove(key, target)
    announcement.current?.announce(`Fotoğraf ${position}. sıraya taşındı.`)
  }, [onMove])
  return <DragDropProvider sensors={sensors} plugins={plugins} onDragEnd={(event) => {
    if (event.canceled) return
    const { source } = event.operation
    if (isSortable(source) && source.initialIndex !== source.index) onMove(source.id, source.index)
  }}>
    <div className="image-grid">{items.map((item, index) => {
      const modelIndex = liveIndex
      if (!item.deleted) liveIndex++
      return <Product
        key={item.key}
        item={item}
        index={index}
        modelIndex={modelIndex}
        category={category}
        busy={busy}
        onToggleDelete={onToggleDelete}
        onMove={moveWithAnnouncement}
        previous={neighbors[index].previous}
        next={neighbors[index].next}
        reduceMotion={reduceMotion}
        exceedsUploadLimit={Boolean(item.deleted && item.type === 'upload' && uploadBytes + item.size > maxTotal)}
      />
    })}</div>
    <MoveAnnouncement ref={announcement} />
    <DragOverlay className="drag-overlay" dropAnimation={{ duration: reduceMotion ? 0 : 180, easing: 'ease' }}>
      {(source) => {
        const item = items.find((entry) => entry.key === source.id)
        if (!item) return null
        return <div className="drag-preview" aria-hidden="true"><div className="drag-preview-image"><img src={item.previewUrl} alt="" width="400" height="500" draggable={false} /></div><div className="drag-preview-info">{source.data?.label || category.short}<span>Taşınıyor</span></div></div>
      }}
    </DragOverlay>
  </DragDropProvider>
}

// The gallery is expensive to rebuild for dialog, metadata, or notice updates.
export default memo(ImageGrid)
