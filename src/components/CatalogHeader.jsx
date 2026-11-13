import { memo, useRef } from 'react'

function CatalogHeader({ name, count, loading, canEdit, onFiles }) {
  const fileInput = useRef(null)

  return <div className="section-top">
    <div className="category-title"><h2 id="category-title">{name}</h2><p>{loading ? 'Yükleniyor…' : `${count} fotoğraf`}</p></div>
    <button className="button button-dark" type="button" onClick={() => fileInput.current?.click()} disabled={!canEdit}>
      <svg className="add-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> Fotoğraf Ekle
    </button>
    <input ref={fileInput} hidden type="file" name="photos" accept=".png,image/png" multiple onChange={(event) => { onFiles(event.target.files); event.target.value = '' }} />
  </div>
}

export default memo(CatalogHeader)
