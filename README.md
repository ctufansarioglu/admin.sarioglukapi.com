# Sarıoğlu Kapı — Ürün Yönetimi

Sarıoğlu Kapı ürün fotoğrafları için bağımsız, statik React yönetim paneli. Ürün listesi aynı origin üzerindeki Worker API'den, önizlemeler herkese açık GitHub deposundan gelir. Fotoğraf listeleme Worker'ı bu depodadır; ana siteye kod değişikliği yapılmaz.

## Gereksinimler ve kurulum

- Node.js 22.15.0 (Vite 8 için en az 22.12) ve pnpm 10.34.9.
- `pnpm install --frozen-lockfile`
- `pnpm dev` varsayılan olarak örnek fotoğraflarla açılır. Gerçek Worker ile yerel test için `.env.example` dosyasını `.env.local` olarak kopyalayıp `VITE_USE_MOCK=false` yapın.
- `pnpm dev`: yerel geliştirme. `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm preview`: kontrol, test, statik build ve build önizlemesi.

Mock modda referans siteden alınan örnek ürün fotoğrafları kullanılır; bazı fotoğraflar örnek listeyi doldurmak için tekrarlanır. Değişiklikler yalnızca bellektedir ve sayfa yenilenince sıfırlanır. Bu görseller üretim build’ine dahil edilmez. `?mockError=401`, `403`, `409`, `413`, `429`, `500` veya `503` ile hata akışları simüle edilebilir. Mock mod sadece Vite geliştirme sunucusunda etkinleşir; üretim build'i bu değeri yok sayar ve gerçek API'yi kullanır. Worker yokken üretim işlemi başarısız olur.

Kategoriler istemcide sabittir. Kenar çubuğundaki kayıtlı fotoğraf sayısı, ilgili kategori açıldığında yüklenen görsellerden hesaplanır; henüz açılmamış kategorilerde `—` gösterilir.

Ek hata senaryoları: `?mockError=read-images` görsel listesinin yüklenememesini, `?mockError=publish-response-lost` kaydı tamamlanan yayının yanıtının kaybolmasını, `?mockError=refresh-after-publish` ise başarılı yayın sonrası listenin okunamamasını simüle eder. İsteğe bağlı tarayıcı kontrolleri için geliştirme sunucusu çalışırken Python Playwright ile `python tests/browser_smoke.py` çalıştırılabilir.

Katalog paylaşımı geliştirme modunda e-posta göndermez. `?mockError=share-catalog` ile reddedilen istek, `?mockError=share-catalog-uncertain` ile sonucu belirsiz istek denenebilir.

## Ortam değişkenleri

| Değişken | Varsayılan | Amaç |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Aynı origin API kökü. Worker route ile uyumlu olmalı. |
| `VITE_USE_MOCK` | development: `true` | `false` ile development sırasında gerçek API; production her zaman gerçek API. |
| `VITE_MAX_FILE_MB` | `5` | Dosya başına istemci sınırı (MiB). |
| `VITE_MAX_TOTAL_MB` | `20` | Bir taslaktaki yeni dosyaların toplam sınırı (MiB). |

Bu değerler build zamanında gömülür ve herkese açıktır. Sırlar, GitHub token'ı veya Cloudflare Service Token koymayın. Worker aynı veya daha sıkı limitleri ayrıca uygulamalıdır.

## GitHub Pages

Bu dizini ayrı bir GitHub deposuna aktarın; kullanıcı açıkça istemedikçe push/deploy yapmayın. Settings → Pages → Build and deployment → Source: **GitHub Actions** seçin. Workflow `main` push'unda pnpm ile kurulum, lint, test, build ve `dist` artifact dağıtımını yapar. Settings → Pages içindeki custom domain'i `admin.sarioglukapi.com` olarak ayarlayın. `public/CNAME` build'e kopyalanır; GitHub Actions tabanlı Pages için GitHub ayarı esas olduğundan dosya tek başına domain tanımlamaz. Ayrıntılı adımlar [Cloudflare kurulumu](docs/CLOUDFLARE-SETUP.md) ve [kontrol listesinde](docs/DEPLOYMENT-CHECKLIST.md). Build root `/` kullanır; uygulama tek sayfa olduğundan route fallback gerekmez.

## Dosya yapısı

- `src/App.jsx`: sabit yerleşim ve çalışma alanının bileşimi.
- `src/hooks/`: taslak ve yayın durumu, dosya bırakma davranışı.
- `src/components/`: kategori seçimi ve ürün grid'i.
- `src/lib/catalog.js`: kategori tanımları, sıralama ve dosya doğrulama.
- `src/services/`: gerçek ve development API katmanları, sözleşme doğrulaması.
- `src/assets/mock/`: yalnızca development modundaki örnek ürün fotoğrafları.
- `src/styles/`: tasarım değerleri, yerleşim, galeri ve durumlar için Emotion stilleri.
- `workers/category-images.js`: Cloudflare fotoğraf listeleme Worker'ı; [kurulum](docs/CATEGORY-IMAGES-WORKER.md).
- `workers/me.js`: Cloudflare Access kullanıcı bilgisi Worker'ı; [kurulum](docs/ME-WORKER.md).
- `workers/publish.js`: GitHub'a fotoğraf yayınlama Worker'ı; [kurulum](docs/PUBLISH-WORKER.md).
- `workers/catalog-share.js`: katalog gönderim workflow'unu başlatan Worker; [kurulum](docs/CATALOG-SHARE-WORKER.md).
- `.github/workflows/deploy.yml`: panelin bağımsız Pages workflow'u.
- `docs/WORKER-API.md`: uygulanması gereken Worker sözleşmesi.
- `tests/`: hedefli taslak ve doğrulama testleri.

Geliştirme sunucusu çalışırken `python tests/render_boundaries.py`, Playwright ve React DevTools gözlemcisiyle üst yerleşim, bilgi bandı ve galeri kartlarının render sınırlarını kontrol eder.

Gerçek API istemcisinin isteklerini ağ taklidiyle kontrol etmek için geliştirme sunucusunu `VITE_USE_MOCK=false` ve `--port 5174` ile başlatın, ardından `python tests/browser_api.py` çalıştırın.

## Referans notu

Referans `DESIGN.md` editorial renk ve fontları tarif eder; mevcut uygulamanın `theme.js` dosyasında ise beyaz/Inter ağırlıklı farklı değerler bulunur. Bu panel referans uygulamanın gerçek tema ve bileşenlerindeki beyaz zemin, Inter/sistem yazı tipi ve koyu gri-yeşil değerleri kullanır. Referans `categoryImages.js` PNG dosyalarını sayısal dosya adına göre sıralar; `categories.js` model kodunu dosya numarasından üretir. Bu yüzden bir fotoğrafın sırasını değiştirmek onun model kodunu da değiştirebilir.
