# Kullanıcı bilgisi Worker'ı

Cloudflare dashboard'da `me` adında ayrı bir Worker oluşturun. [workers/me.js](../workers/me.js) dosyasının tamamını Worker editörüne yapıştırıp dağıtın. Worker için secret veya ortam değişkeni gerekmez.

Workers & Pages → `me` → Settings → Domains & Routes bölümünden aşağıdaki route'u ilgili zone'a bağlayın:

```text
admin.sarioglukapi.com/api/me
```

İstek Cloudflare Access tarafından doğrulandıktan sonra Worker, `ctx.access.getIdentity()` üzerinden oturum sahibinin e-posta adresini okur ve panelin beklediği biçimde döndürür:

```json
{"email":"admin@example.com"}
```

Access uygulamanız `/api/me` adresini kapsamalı ve isteği doğrudan Worker'a yönlendirmelidir. `ctx.access` Service Binding üzerinden taşınmaz; Workers Static Assets'in dahili yönlendiricisi arkasında da kullanılamaz. Ayrıntılar için [Cloudflare Access ve Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) belgesine bakın.

Test için Access'e giriş yaptığınız tarayıcıda `https://admin.sarioglukapi.com/api/me` adresini açın. Cloudflare dashboard'undan gönderilen oturumsuz bir test isteği Access giriş sayfasına yönlenebilir.
