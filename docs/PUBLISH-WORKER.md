# Fotoğraf yayınlama Worker'ı

Cloudflare dashboard'da ayrı bir Worker oluşturun. [workers/publish.js](../workers/publish.js) dosyasının tamamını Worker editörüne yapıştırın. Worker, `POST /api/categories/{category}/publish` isteklerini karşılar.

## Worker ayarları

1. Worker → Settings → Variables and Secrets bölümüne `GITHUB_API_KEY` adlı secret'ı ekleyin. Token'ın `ctufansarioglu/sarioglukapi.com` deposunda **Contents: read and write** yetkisi olmalıdır.
2. Worker → Settings → Domains & Routes bölümünde ilgili zone için şu route'u ekleyin:

   ```text
   admin.sarioglukapi.com/api/categories/*
   ```

   Cloudflare Worker route desenleri yolun ortasında joker karakter kabul etmez; Worker, bu rota altındaki yayınlama endpoint'lerini kendisi ayırt eder.
3. Worker `node:buffer` kullanır. Compatibility date `2026-08-04` veya sonraysa Node.js uyumluluğu varsayılan olarak açıktır. Daha eski bir tarih kullanıyorsanız Worker ayarlarında `nodejs_compat` flag'ini etkinleştirin.
4. Değişiklikleri kaydedip Worker'ı dağıtın. Cloudflare Access uygulamanızın bu route'u kapsaması gerekir.

## Çalışma biçimi

Worker panelin gönderdiği taslağı ve PNG dosyalarını alır. Dosya başına 5 MiB, toplam 20 MiB ve en fazla 20 yeni dosya kabul eder. Mevcut dosyaların Git blob'larını yeniden kullanır; yalnızca yeni dosyalar için blob oluşturur. Son durum için tek Git ağacı ve tek commit oluşturur. GitHub `updateRefs` işlemiyle `main` dalını yalnızca beklenen commit hâlâ güncelse günceller.

GitHub Pages'in dağıtımı ayrı bir süreçtir. Başarılı yanıt `deploymentStatus: "pending"` döndürür. Nihai dosya ağacı değişmemişse Worker yeni commit oluşturmadan `deploymentStatus: "unchanged"` döndürür. Son ref güncellemesinin sonucu doğrulanamazsa panel taslağı korur ve güncel ürünleri kontrol etmenizi ister.

Bu Worker GitHub'daki gerçek `main` dalını değiştirir. Önceki testler GitHub yanıtlarını taklit eder; Cloudflare hesabınızdaki secret, token yetkisi ve GitHub depo kuralları ayrıca doğrulanmalıdır.

Kaynaklar: [Cloudflare route desenleri](https://developers.cloudflare.com/workers/configuration/routing/routes/), [Cloudflare Node.js uyumluluğu](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) ve [GitHub `updateRefs`](https://docs.github.com/en/graphql/reference/git#updaterefs).
