# Katalog paylaşımı Worker'ı

Cloudflare dashboard'da ayrı bir Worker oluşturun ve [workers/catalog-share.js](../workers/catalog-share.js) dosyasının tamamını editöre yapıştırın.

Worker → Settings → Variables and Secrets bölümüne `GITHUB_API_KEY` secret'ını ekleyin. Token, `ctufansarioglu/sarioglukapi.com` deposunda **Actions: read and write** yetkisine sahip olmalıdır. Mevcut publish token'ı kullanılacaksa bu yetkinin ona da eklenmesi gerekir; secret her Worker'da ayrıca tanımlanır.

Worker → Settings → Domains & Routes bölümünde aşağıdaki route'u ilgili zone'a bağlayın:

```text
admin.sarioglukapi.com/api/catalog/share
```

Worker, `main` dalındaki `.github/workflows/deploy.yml` workflow'unu `send_catalog: true` girdisiyle başlatır. Alıcılar ve e-posta servisi, mevcut workflow'un GitHub Secrets ayarlarındaki `SUBSCRIBERS` ve `RESEND_API_KEY` değerlerini kullanır; Worker alıcı listesi veya e-posta servisi anahtarı tutmaz.

Başarılı yanıt, GitHub'ın workflow'u başlatma isteğini kabul ettiğini gösterir; e-postaların teslim edildiği anlamına gelmez. Sonuç [GitHub Actions](https://github.com/ctufansarioglu/sarioglukapi.com/actions/workflows/deploy.yml) üzerinden takip edilir. Mevcut workflow site dağıtımını da başlatır ve aynı grupta devam eden çalışmayı iptal edebilir.

Geliştirme modundaki paylaşım yalnızca örnektir ve e-posta göndermez. Worker testleri GitHub isteğini taklit eder. Gerçek bir paylaşım yapmak için Worker'ı ve paneli dağıttıktan sonra paneldeki onayı kullanın.

Kaynak: [GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).
