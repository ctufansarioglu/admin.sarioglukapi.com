import CatalogShare from './CatalogShare.jsx'

export default function AppLayout({ children }) {
  return <>
    <a href="#main-content" className="skip-link">Ana içeriğe geç</a>
    <header className="site-header">
      <div className="header-inner">
        <div className="brand" aria-label="Sarıoğlu Kapı ürün yönetimi"><span>SARIOĞLU</span><small>ORMAN ÜRÜNLERİ</small></div>
        <div className="header-actions">
          <div className="header-title"><h1>Ürün Yönetimi</h1></div>
          <CatalogShare />
        </div>
      </div>
    </header>
    {children}
  </>
}

