import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ mode, category, changes, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const content = {
    publish: { kicker: 'YAYINLAMA ONAYI', title: 'Değişiklikler yayınlansın mı?', confirm: 'Evet, Yayınla' },
    discard: { kicker: 'DEĞİŞİKLİKLERİ İPTAL ET', title: 'Değişiklikler iptal edilsin mi?', confirm: 'Evet, İptal Et' },
    share: { kicker: 'KATALOG PAYLAŞIMI', title: 'Katalog paylaşılsın mı?', confirm: 'Evet, Paylaş' },
  }[mode]

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  return <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <div className="confirm-content">
      <span className="confirm-kicker">{content.kicker}</span>
      <h2 id="confirm-dialog-title">{content.title}</h2>
      <p id="confirm-dialog-description">{mode === 'share' ? 'Katalog kayıtlı e-posta adreslerine gönderilecek. Devam etmek istiyor musunuz?' : <><strong>{category}</strong> kategorisindeki {changes ? `${changes} değişiklik` : 'geri alınabilir fotoğraf eklemeleri'} {mode === 'publish' ? 'yayınlanacak.' : 'iptal edilecek.'}</>}</p>
      <p className="confirm-note">{mode === 'share' ? 'Katalog GitHub’daki güncel ürünlerden hazırlanır; yayınlanmamış düzenlemeler dahil edilmez. Site dağıtımı da başlar ve devam eden dağıtım iptal edilebilir.' : mode === 'publish' ? 'Fotoğrafların sırası ve model kodları değişebilir. Web sitesinin güncellenmesi biraz zaman alabilir.' : 'Yayınlanmamış düzenlemeler kaldırılır ve fotoğraflar son kaydedilen haline döner.'}</p>
      <div className="confirm-actions"><button type="button" className="button button-plain" onClick={onCancel} autoFocus>Vazgeç</button><button type="button" className="button button-dark" onClick={onConfirm}>{content.confirm}</button></div>
    </div>
  </dialog>
}
