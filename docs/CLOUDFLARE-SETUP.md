# Cloudflare ve GitHub Pages kurulumu

Bu işlemler kullanıcı tarafından yapılır; bu proje Cloudflare'da otomatik kaynak oluşturmaz. Menü isimleri değişebilir. Cloudflare ve GitHub hesaplarında ilgili alan ve depo yönetim yetkileri gerekir.

## 1. Pages ve DNS

1. Alan adının Cloudflare DNS bölgesinde yönetildiğini ve nameserver'ların gerçekten Cloudflare'a yöneldiğini kontrol edin. Mevcut kök alan adı ve diğer kayıtları değiştirmeyin.
2. **Ayrı panel deposunda** Settings → Pages → Source: GitHub Actions seçin. Güvenlik için GitHub hesap/kuruluş ayarlarında domain doğrulamasını [GitHub'ın domain doğrulama adımları](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) ile tamamlayın.
3. Pages → Custom domain bölümüne önce `admin.sarioglukapi.com` girin ve kaydedin. DNS kaydından önce GitHub'da eşleştirmek domain takeover riskini azaltır. Repository owner kullanıcı ise hedef `<kullanici>.github.io`, kuruluş ise `<kurulus>.github.io` olur; repository adını hedefe eklemeyin. [GitHub özel domain talimatları](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
4. Cloudflare DNS → Records → Add record: tür **CNAME**, ad `admin`, hedef yukarıdaki `<owner>.github.io`. Çakışan `admin` kayıtlarını kontrol edin. GitHub doğrulaması veya sertifikalandırma sorununda geçici **DNS only** deneyin; koruma kurulana kadar kullanıcıya açmayın.
5. GitHub Pages DNS kontrolünü ve sertifika hazırlanmasını bekleyin, **Enforce HTTPS** etkinleştirin. DNS yayılması zaman alabilir. `Resolve-DnsName admin.sarioglukapi.com` ile kontrol edin. Cloudflare SSL/TLS → Overview altında **Full (strict)** kullanın; edge sertifikasının da aktif olduğundan emin olun.
6. DNS kaydını **Proxied** (turuncu bulut) yapın. Hem Access hem Worker route trafiği Cloudflare üzerinden geçmelidir. [Worker route gereksinimleri](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).

## 2. Zero Trust ve Access

1. Cloudflare dashboard → Zero Trust (veya Cloudflare One) alanında hesap/team oluşturun. Zero Trust → Settings → Authentication → Login methods altında **One-time PIN** etkinliğini kontrol edin. Hesabın güncel arayüzünde konum farklıysa Authentication / Login methods arayın.
2. Access controls → Applications (bazı arayüzlerde Access → Applications) → Add an application → **Self-hosted**. Adı örneğin `Sarıoğlu Yönetim`; public hostname `admin.sarioglukapi.com`, path boş ya da `/*` olacak şekilde tüm paneli ve `/api/*` adreslerini kapsayın.
3. Session duration'ı iş ihtiyacına göre seçin (örneğin 8 saat). Login method olarak One-time PIN seçin. Allow policy ekleyip Include → Emails ile yalnızca yetkili kişilerin tam e-posta adreslerini girin. Geniş domain veya everyone kuralı eklemeyin.
4. E-posta PIN ile izinli hesap girişini ve farklı bir e-posta ile reddi gizli pencerede deneyin. Access uygulaması `admin.../api/*` isteklerini de kapsamalıdır. [Self-hosted uygulamalar](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

## 3. Worker hazır olduğunda

1. Fotoğraf listeleme Worker'ını [kurulum rehberine](CATEGORY-IMAGES-WORKER.md) göre yapılandırın. Diğer endpoint'ler için [API sözleşmesini](WORKER-API.md) izleyin. Token'ı Worker secret olarak tanımlayın; Worker koduna veya frontend build'ine koymayın.
2. Fotoğraf Worker'ı için Workers & Pages → ilgili Worker → Settings → Domains & Routes → Add → Route: `admin.sarioglukapi.com/api/category-images/*` ve ilgili zone. Bu bir **route**'tur; panelin tamamına Worker custom domain atamayın. DNS kaydı proxied olmalıdır.
3. Fotoğraf Worker'ının erişimi Cloudflare Access tarafından yönetilir; Worker içinde ek JWT doğrulaması yapılmaz. [Worker Access seçenekleri](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
4. `/api/me`, yayınlama ve katalog paylaşımı endpoint'lerini sırasıyla [kimlik](ME-WORKER.md), [yayınlama](PUBLISH-WORKER.md) ve [katalog paylaşımı](CATALOG-SHARE-WORKER.md) rehberlerindeki ayrı Worker'larla yapılandırın.

GitHub Pages statik dosyaları varsayılan `github.io` adresinden erişilebilir olabilir; Access bu origin'i gizli hale getirmez. Frontend kodu ve içeriği herkese açık kabul edilir.
