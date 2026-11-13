import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ mode, category, changes, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const isPublish = mode === 'publish'

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  return <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <div className="confirm-content">
      <span className="confirm-kicker">{isPublish ? 'YAYINLAMA ONAYI' : 'DEĞİŞİKLİKLERİ İPTAL ET'}</span>
      <h2 id="confirm-dialog-title">{isPublish ? 'Değişiklikler yayınlansın mı?' : 'Değişiklikler iptal edilsin mi?'}</h2>
      <p id="confirm-dialog-description"><strong>{category}</strong> kategorisindeki {changes ? `${changes} değişiklik` : 'geri alınabilir fotoğraf eklemeleri'} {isPublish ? 'yayınlanacak.' : 'iptal edilecek.'}</p>
      <p className="confirm-note">{isPublish ? 'Fotoğrafların sırası ve model kodları değişebilir. Web sitesinin güncellenmesi biraz zaman alabilir.' : 'Yayınlanmamış düzenlemeler kaldırılır ve fotoğraflar son kaydedilen haline döner.'}</p>
      <div className="confirm-actions"><button type="button" className="button button-plain" onClick={onCancel} autoFocus>Vazgeç</button><button type="button" className="button button-dark" onClick={onConfirm}>{isPublish ? 'Evet, Yayınla' : 'Evet, İptal Et'}</button></div>
    </div>
  </dialog>
}
