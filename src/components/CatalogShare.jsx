import { useRef, useState } from 'react'
import { api, useMock } from '../services/api.js'
import { isAmbiguousRequestError } from '../services/client.js'
import { useShareConfirmation } from './ShareConfirmationProvider.jsx'

const workflowUrl = 'https://github.com/ctufansarioglu/sarioglukapi.com/actions/workflows/deploy.yml'

export default function CatalogShare() {
  const confirmShare = useShareConfirmation()
  const [status, setStatus] = useState('idle')
  const pending = useRef(false)

  async function share() {
    if (pending.current) return
    pending.current = true
    setStatus('pending')
    try {
      await api.shareCatalog()
      setStatus(useMock ? 'mock' : 'started')
    } catch (error) {
      setStatus(isAmbiguousRequestError(error) ? 'uncertain' : 'failed')
    } finally { pending.current = false }
  }

  return <div className="catalog-share">
    <button type="button" className="button button-plain" disabled={status === 'pending'} onClick={() => confirmShare(share)}>
      {status === 'pending' ? 'Başlatılıyor…' : 'Kataloğu Paylaş'}
    </button>
    {status === 'mock' && <output className="catalog-share-feedback">Örnek paylaşım isteği alındı. E-posta gönderilmedi.</output>}
    {status === 'started' && <output className="catalog-share-feedback">Katalog gönderimi başlatıldı. <a href={workflowUrl} target="_blank" rel="noreferrer">GitHub Actions’ta takip et</a></output>}
    {status === 'uncertain' && <p className="catalog-share-feedback error" role="alert">İsteğin sonucu doğrulanamadı. Tekrar denemeden önce <a href={workflowUrl} target="_blank" rel="noreferrer">GitHub Actions’ı kontrol edin</a>.</p>}
    {status === 'failed' && <p className="catalog-share-feedback error" role="alert">Katalog paylaşımı başlatılamadı. Lütfen tekrar deneyin.</p>}
  </div>
}
