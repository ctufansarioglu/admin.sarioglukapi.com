import { useFileDrop } from '../hooks/useFileDrop.js'
import { useConfirmationOpen } from './ConfirmationProvider.jsx'

export function FileDropBlocker() {
  useFileDrop(false, () => {})
  return null
}

export default function GalleryArea({ enabled, onFiles, maxFile, children }) {
  const confirmationOpen = useConfirmationOpen()
  const dragging = useFileDrop(enabled && !confirmationOpen, onFiles)
  return <div className="gallery-area">
    {children}
    {dragging && <div className="file-drop-overlay"><div className="file-drop-content"><span className="file-drop-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span><strong>Fotoğrafları buraya bırakın</strong><span>PNG dosyaları · en fazla {maxFile / 1024 / 1024} MB</span></div></div>}
  </div>
}
