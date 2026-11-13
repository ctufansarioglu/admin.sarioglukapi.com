import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { api, useMock } from '../services/api.js'
import { publishDraft } from '../services/publication.js'
import { activeItems, categories, changeCount, validateFiles } from '../lib/catalog.js'
import { draftReducer, emptyDraft } from '../lib/draft.js'

const bytes = (value, fallback) => {
  const amount = Number(value)
  return (Number.isFinite(amount) && amount > 0 ? amount : fallback) * 1024 * 1024
}
export const maxFile = bytes(import.meta.env.VITE_MAX_FILE_MB, 5)
const maxTotal = bytes(import.meta.env.VITE_MAX_TOTAL_MB, 20)

export function useCatalog() {
  const [selected, setSelected] = useState('ahsap')
  const [counts, setCounts] = useState({})
  const [{ items, original, revision, lock }, dispatch] = useReducer(draftReducer, emptyDraft)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [identityError, setIdentityError] = useState('')
  const [reload, setReload] = useState(0)
  const [identityReload, setIdentityReload] = useState(0)
  const scrollTarget = useRef(null)
  const urls = useRef(new Set())
  const operationPending = useRef(false)
  const mounted = useRef(false)
  const category = categories.find((entry) => entry.id === selected)
  const active = useMemo(() => activeItems(items), [items])
  const changes = useMemo(() => changeCount(original, active), [original, active])
  const uploadBytes = useMemo(() => active.reduce((sum, item) => sum + (item.type === 'upload' ? item.size : 0), 0), [active])
  const hasChanges = changes > 0
  const hasChangesRef = useRef(hasChanges)
  const canDiscard = changes > 0 || items.some((item) => item.type === 'upload' && item.deleted)
  const canEdit = Boolean(revision) && !loading && !busy && !lock
  const selectionDisabled = busy || Boolean(lock)

  // Category navigation reads the latest committed draft without changing its callback on every edit.
  useLayoutEffect(() => {
    hasChangesRef.current = hasChanges
  }, [hasChanges])

  const cleanup = useCallback(() => {
    urls.current.forEach((url) => URL.revokeObjectURL(url))
    urls.current.clear()
  }, [])
  const applySnapshot = useCallback((snapshot) => {
    cleanup()
    dispatch({ type: 'snapshot', snapshot })
    setCounts((current) => current[selected] === snapshot.images.length
      ? current
      : { ...current, [selected]: snapshot.images.length })
  }, [cleanup, selected])

  useEffect(() => {
    mounted.current = true
    const storedUrls = urls.current
    return () => { mounted.current = false; storedUrls.forEach((url) => URL.revokeObjectURL(url)); storedUrls.clear() }
  }, [])
  useEffect(() => {
    let current = true
    const controller = new AbortController()
    api.me({ signal: controller.signal }).catch((e) => { if (current) setIdentityError(e.message) })
    return () => { current = false; controller.abort() }
  }, [identityReload])
  useEffect(() => {
    let current = true
    const controller = new AbortController()
    api.images(selected, { signal: controller.signal }).then((result) => {
      if (!current) return
      applySnapshot(result)
      setLoading(false)
    }).catch((e) => { if (current) { setError(e.message); setLoading(false) } })
    return () => { current = false; controller.abort() }
  }, [selected, reload, applySnapshot])
  useEffect(() => {
    const beforeUnload = (event) => { if (changes || busy) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [changes, busy])
  useEffect(() => {
    if (!scrollTarget.current) return
    const node = document.getElementById(scrollTarget.current)
    if (node) {
      node.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      scrollTarget.current = null
    }
  }, [items])

  const selectCategory = useCallback((id) => {
    if (id === selected || selectionDisabled) return
    if (hasChangesRef.current && !window.confirm('Yayınlanmamış değişiklikler iptal edilecek. Kategori değiştirmek istiyor musunuz?')) return
    cleanup()
    setSelected(id); dispatch({ type: 'reset' }); setError(''); setNotice(''); setLoading(true)
  }, [selected, selectionDisabled, cleanup])
  const retryImages = () => { setError(''); setLoading(true); setReload((value) => value + 1) }
  const addFiles = useCallback((files) => {
    if (!canEdit) return
    const { accepted, errors } = validateFiles(Array.from(files), uploadBytes, maxFile, maxTotal)
    const additions = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      urls.current.add(previewUrl)
      const uploadId = `upload-${crypto.randomUUID()}`
      return { key: uploadId, uploadId, type: 'upload', name: file.name, size: file.size, previewUrl, file }
    })
    dispatch({ type: 'add', items: additions })
    if (additions.length) scrollTarget.current = additions[0].key
    setError(errors.join(' ')); setNotice('')
  }, [canEdit, uploadBytes])
  const toggleDelete = useCallback((key, exceedsUploadLimit) => {
    if (!canEdit) return
    if (exceedsUploadLimit) {
      setError('Bu fotoğrafı geri almak toplam yükleme sınırını aşar.')
      return
    }
    dispatch({ type: 'toggle', key })
    setError(''); setNotice('')
  }, [canEdit])
  const moveItem = useCallback((key, to) => {
    if (!canEdit) return
    dispatch({ type: 'move', key, to })
    setNotice('')
  }, [canEdit])
  const discard = () => {
    cleanup(); dispatch({ type: 'discard' }); setError(''); setNotice('Değişiklikler iptal edildi.')
  }
  const publish = async () => {
    if (!changes || !canEdit || operationPending.current) return
    operationPending.current = true
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await publishDraft(api, selected, revision, active)
      if (!mounted.current) return
      if (result.kind === 'saved' || result.kind === 'saved-unrefreshed') {
        dispatch({ type: 'lock', lock: 'saved' })
        setNotice(useMock ? 'Örnek değişiklikler kaydedildi. Gerçek sitede değişiklik yapılmadı.' : "Değişiklikler GitHub'a kaydedildi. Web sitesi güncelleniyor.")
        if (result.kind === 'saved') {
          applySnapshot(result.fresh)
        } else {
          setError('Kayıt tamamlandı ancak güncel ürünler alınamadı. Güncel ürünleri yeniden yükleyin.')
        }
      } else if (result.kind === 'uncertain') {
        dispatch({ type: 'lock', lock: 'uncertain' })
        setError(`${result.error?.message || 'Kayıt sonucu doğrulanamadı.'} Kayıt sonucu belirsiz olabilir; tekrar yayınlamadan önce güncel ürünleri kontrol edin.`)
      } else {
        setError(result.error.message + (result.error.status === 409 ? ' Taslağınızı not edin; ardından değişiklikleri iptal edip sayfayı yenileyin.' : ''))
      }
    } finally { operationPending.current = false; if (mounted.current) setBusy(false) }
  }
  const checkPublication = async () => {
    if (busy || operationPending.current) return
    operationPending.current = true
    setBusy(true)
    try {
      const fresh = await api.images(selected)
      if (!mounted.current) return
      if (lock === 'saved') {
        applySnapshot(fresh)
        setError('')
      } else if (fresh.revision === revision) {
        dispatch({ type: 'lock', lock: '' })
        setError('Sunucudaki sürüm henüz değişmemiş. Önceki istek hâlâ tamamlanabilir; yeniden yayınlamadan önce sonucu kontrol edin.')
      } else {
        dispatch({ type: 'lock', lock: 'changed' })
        setError('Sunucudaki sürüm değişmiş. Taslağınızı not edin; güncel ürünleri yüklemek taslağı kaldıracaktır.')
      }
    } catch { if (mounted.current) setError('Güncel ürünler alınamadı. Bağlantınızı kontrol edip tekrar deneyin.') }
    finally { operationPending.current = false; if (mounted.current) setBusy(false) }
  }
  const loadCurrent = () => {
    if (!window.confirm('Yayınlanmamış taslak kaldırılacak ve güncel ürünler yüklenecek. Devam etmek istiyor musunuz?')) return
    cleanup(); dispatch({ type: 'reset' }); setNotice(''); retryImages()
  }

  return {
    selected, counts, items, revision, loading, busy, lock, error, notice, identityError,
    category, active, changes, canDiscard, canEdit, uploadBytes, maxTotal, selectCategory, retryImages, addFiles, toggleDelete,
    moveItem, discard, publish, checkPublication, loadCurrent,
    retryIdentity: () => { setIdentityError(''); setIdentityReload((value) => value + 1) },
  }
}
