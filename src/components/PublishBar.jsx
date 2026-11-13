import { createContext, memo, useContext } from 'react'
import { useConfirmationActions } from './ConfirmationProvider.jsx'

const ChangesContext = createContext(0)
const HasChangesContext = createContext(false)
const DiscardDisabledContext = createContext(true)
const PublishDisabledContext = createContext(true)
const PublishingContext = createContext(false)

function StatusDot() {
  const hasChanges = useContext(HasChangesContext)
  return <span className={hasChanges ? 'status-dot changed' : 'status-dot'} />
}

function DraftCount() {
  const changes = useContext(ChangesContext)
  return <strong>{changes ? `${changes} değişiklik yayınlanmayı bekliyor` : 'Tüm değişiklikler kaydedildi'}</strong>
}

function DraftDescription() {
  const hasChanges = useContext(HasChangesContext)
  return <small>{hasChanges ? 'Yayınlayana kadar değişiklikler yalnızca bu sayfada kalır.' : 'Düzenlemeleriniz burada görünecek.'}</small>
}

function DiscardButton() {
  const disabled = useContext(DiscardDisabledContext)
  const { confirmDiscard } = useConfirmationActions()
  return <button className="button button-plain" disabled={disabled} onClick={confirmDiscard}>Değişiklikleri İptal Et</button>
}

function PublishButton() {
  const disabled = useContext(PublishDisabledContext)
  const busy = useContext(PublishingContext)
  const { confirmPublish } = useConfirmationActions()
  return <button className="button button-dark" disabled={disabled} onClick={confirmPublish}>
    {busy ? 'Yayınlanıyor…' : 'Değişiklikleri Yayınla'} <span aria-hidden="true">↗</span>
  </button>
}

const PublishBar = memo(function PublishBar() {
  return <div className="publish-bar">
    <div className="publish-inner">
      <div className="draft-status">
        <StatusDot />
        <div><DraftCount /><DraftDescription /></div>
      </div>
      <div className="publish-actions"><DiscardButton /><PublishButton /></div>
    </div>
  </div>
})

function PublishBarState({ changes, canDiscard, busy, disabled }) {
  return <ChangesContext.Provider value={changes}>
    <HasChangesContext.Provider value={changes > 0}>
      <DiscardDisabledContext.Provider value={!canDiscard || disabled}>
        <PublishDisabledContext.Provider value={!changes || disabled}>
          <PublishingContext.Provider value={busy}>
            <PublishBar />
          </PublishingContext.Provider>
        </PublishDisabledContext.Provider>
      </DiscardDisabledContext.Provider>
    </HasChangesContext.Provider>
  </ChangesContext.Provider>
}

export default memo(PublishBarState)
