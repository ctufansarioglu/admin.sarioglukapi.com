# Kategori fotoğrafları Worker'ı

Cloudflare dashboard'daki Worker editöründe `workers/category-images.js` dosyasının tamamını mevcut Worker kodunun yerine koyun. Dosya ek paket gerektirmez. Worker fotoğraf listesini ve GitHub'daki önizleme adreslerini döndürür.

## Ayarlar

Worker → Settings → Variables and Secrets bölümünde GitHub token'ınızı tanımlayın:

| Ad | Tür | Değer |
| --- | --- | --- |
| `GITHUB_API_KEY` | Secret | Zaten eklediğiniz GitHub token'ı. Hedef depoda Contents: read yetkisi yeterlidir. |

Ek Access değişkenleri gerekli değildir; erişim Cloudflare Access tarafından yönetilir.

Workers & Pages → Worker → Settings → Domains & Routes bölümünde `admin.sarioglukapi.com/api/category-images/*` rotasının ilgili zone'a bağlı olduğunu doğrulayın. Kategori listeleri bu rota üzerinden istenir.

Kod ve ayarlar hazır olduğunda Worker editöründeki dağıtım işlemini kullanın. Ardından Access ile giriş yapmış bir oturumda `/api/category-images/ahsap` adresinin JSON döndürdüğünü ve listedeki bir `previewUrl` adresinin PNG gösterdiğini kontrol edin. Access oturumu olmayan isteğin veriye erişemediğini de doğrulayın.

Önizlemeler, listeyle aynı commit'e sabitlenmiş `raw.githubusercontent.com` adreslerinden doğrudan tarayıcıya yüklenir; fotoğraf başına Worker isteği yapılmaz. Bu yöntem deponun herkese açık olmasına bağlıdır. GitHub ağacı eksik veya kesilmişse ya da kategori klasöründe sayısal PNG dışı içerik varsa Worker eksik liste döndürmek yerine hata verir.

`/api/me` ve `/api/categories/:category/publish` bu Worker tarafından sağlanmaz. Bunlar için [kimlik](ME-WORKER.md) ve [yayınlama](PUBLISH-WORKER.md) Worker'ları bulunur.

Kaynaklar: [Worker secret'ları](https://developers.cloudflare.com/workers/configuration/secrets/), [GitHub Git ağaçları](https://docs.github.com/en/rest/git/trees) ve [GitHub dosya içerikleri](https://docs.github.com/en/rest/repos/contents).
