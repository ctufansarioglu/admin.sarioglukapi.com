import AppLayout from './components/AppLayout.jsx'
import CatalogWorkspace from './components/CatalogWorkspace.jsx'

function InfoBanner() {
  return <div className="info-banner">
    <p>Ürün fotoğraflarını kategorilere göre görüntüleyebilir, ekleyebilir, sıralayabilir veya kaldırabilirsiniz. Düzenlemeleriniz yalnızca yayınladığınızda kaydedilir.</p>
  </div>
}

export default function App() {
  return <AppLayout>
    <CatalogWorkspace>
      <InfoBanner />
    </CatalogWorkspace>
  </AppLayout>
}
