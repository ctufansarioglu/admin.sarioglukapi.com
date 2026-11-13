import { maxFile, useCatalog } from '../hooks/useCatalog.js'
import GalleryArea, { FileDropBlocker } from './GalleryArea.jsx'
import Sidebar from './Sidebar.jsx'
import ImageGrid from './ImageGrid.jsx'
import PublishBar from './PublishBar.jsx'
import CatalogHeader from './CatalogHeader.jsx'
import ConfirmationProvider from './ConfirmationProvider.jsx'

export default function CatalogWorkspace({ children }) {
  const catalog = useCatalog()
  const { category, items, active, changes, error, notice, loading, busy, lock } = catalog

  return <ConfirmationProvider category={category.name} changes={changes} onPublish={catalog.publish} onDiscard={catalog.discard}>
    {(loading || !catalog.revision) && <FileDropBlocker />}
    <main className="page" id="main-content" tabIndex={-1}>
      {children}
      {catalog.identityError && <div className="message error" role="alert">
        <p>Oturum bilgisi: {catalog.identityError}</p>
        <button type="button" onClick={catalog.retryIdentity}>Tekrar dene</button>
      </div>}
      <div className="workspace">
        <Sidebar selected={catalog.selected} counts={catalog.counts} onSelect={catalog.selectCategory} disabled={busy || Boolean(lock)} />
        <section className="catalog" aria-labelledby="category-title" aria-busy={loading}>
          <CatalogHeader name={category.name} count={active.length} loading={loading} canEdit={catalog.canEdit} onFiles={catalog.addFiles} />
          {error && <div className="message error" role="alert">
            {error}{' '}
            {!loading && !catalog.revision && <button type="button" onClick={catalog.retryImages}>Tekrar dene</button>}
            {lock && lock !== 'changed' && <button type="button" onClick={catalog.checkPublication} disabled={busy}>Güncel ürünleri kontrol et</button>}
            {lock === 'changed' && <button type="button" onClick={catalog.loadCurrent} disabled={busy}>Güncel ürünleri yükle</button>}
          </div>}
          {notice && <output className="message success">{notice}</output>}
          {loading ? <div className="empty-state"><span className="empty-symbol" aria-hidden="true">◌</span><h3>Ürünler yükleniyor</h3><p>Lütfen bir süre bekleyin.</p></div> : catalog.revision ? <>
            <div className="catalog-tools"><p>Fotoğrafları sürükleyerek veya taşıma düğmeleriyle sıralayın. Sıra değiştiğinde model kodları da değişir.</p><span>PNG · en fazla {maxFile / 1024 / 1024} MB</span></div>
            <GalleryArea enabled={catalog.canEdit} onFiles={catalog.addFiles} maxFile={maxFile}>
              {items.length ? <ImageGrid items={items} category={category} busy={!catalog.canEdit} onMove={catalog.moveItem} onToggleDelete={catalog.toggleDelete} uploadBytes={catalog.uploadBytes} maxTotal={catalog.maxTotal} /> : <div className="empty-state"><span className="empty-symbol" aria-hidden="true">＋</span><h3>Henüz fotoğraf yok</h3><p>Bu kategoriye fotoğraf ekleyerek başlayın.</p></div>}
            </GalleryArea>
          </> : null}
        </section>
      </div>
    </main>
    <PublishBar changes={changes} canDiscard={catalog.canDiscard} busy={busy} disabled={!catalog.canEdit} />
  </ConfirmationProvider>
}
