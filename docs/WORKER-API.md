# Worker API sözleşmesi

Bu belge API sözleşmesidir. Fotoğraf listeleme Worker'ı [bu depoda](../workers/category-images.js) bulunur; `/api/me` ve yayınlama endpoint'leri ayrıca uygulanmalıdır. İstemci liste için `https://admin.sarioglukapi.com/api` adresini kullanır; önizlemeler herkese açık GitHub deposundan yüklenir. API cevapları UTF-8 JSON ve `Cache-Control: no-store` olmalıdır. API istekleri Access korumasındadır. Oturum bitiminde API mümkünse login HTML yönlendirmesi yerine 401 döndürür. İstemci HTML cevabını başarısız sayar.

## Sabitler ve veri kaynağı

Repo `ctufansarioglu/sarioglukapi.com`, ref `refs/heads/main`, kategori kökü `src/assets/images/categories/`; izin listesi sadece `ahsap`, `amerikan-panel`, `lake`, `melamin`, `pvc`. Listeyi sunucuda sabitleyin. Her okuma ve yazma `main` commit SHA'sını `revision` olarak kullanır. Tutarlı kategori yanıtı için önce head'i okuyun, sonra tree ve blobları bu SHA üzerinden okuyun; hareketli `main` üzerinden karışık içerik üretmeyin. Mevcut sitenin glob'u bütün `*.png` dosyalarını toplar ve sayısal ada göre sıralar. Worker alışılmadık adlar, alt klasörler veya PNG dışı dosyalar varsa onları sessizce yok etmemeli: işlemi 400/409 ile durdurup yöneticiye incelettirmelidir. Boş klasör Git'te bulunmayabilir; boş kategori geçerlidir.

## Endpoint'ler

### `GET /api/me`

Doğrulanmış Access kimliğinden `{"email":"admin@example.com"}` döndürür. Eksik veya geçersiz oturum 401; izin verilmeyen kimlik 403.

Kategori isimleri ve kodları istemcide sabittir; ayrı bir kategori listesi endpoint'i gerekli değildir. Kenar çubuğundaki fotoğraf sayıları, ilgili kategorinin görselleri yüklendiğinde hesaplanır.

### `GET /api/category-images/:category`

```json
{"category":"ahsap","revision":"CURRENT_MAIN_COMMIT_SHA","images":[{"id":"BLOB_SHA","name":"01.png","path":"src/assets/images/categories/ahsap/01.png","sha":"BLOB_SHA","previewUrl":"https://raw.githubusercontent.com/ctufansarioglu/sarioglukapi.com/CURRENT_MAIN_COMMIT_SHA/src/assets/images/categories/ahsap/01.png","size":250000}]}
```

Listeyi sayısal dosya adına göre sıralayın. Blob SHA tek başına eşsiz olmayabilir (aynı içerik birden fazla yolda bulunabilir); kimlik path ve SHA birlikte değerlendirilir. `revision` commit SHA, `sha` blob SHA'dır. `previewUrl` dosyayı GitHub'ın herkese açık ham içerik adresinden belirtilen commit ile yükler. Böylece taslak açıkken önizleme bir sonraki commit'e kaymaz ve fotoğraf başına Worker isteği yapılmaz. Publish image yanıtının revision'ına dayanır.

### `POST /api/categories/:category/publish`

`multipart/form-data`: tek `manifest` text alanı (JSON UTF-8); her upload için alan adı `uploadId` ile tam aynı olan tek dosya bölümü. Tarayıcı boundary'yi kendisi belirler; elle Content-Type koyulmaz.

```json
{"expectedRevision":"CURRENT_MAIN_COMMIT_SHA","items":[{"type":"existing","path":"src/assets/images/categories/ahsap/03.png","sha":"BLOB_SHA_3"},{"type":"existing","path":"src/assets/images/categories/ahsap/01.png","sha":"BLOB_SHA_1"},{"type":"upload","uploadId":"upload-uuid"}]}
```

İstemci sadece nihai listeyi yollar; çıkarılan mevcut dosyalar silinir. `items: []` bütün görselleri siler. Her existing path tam olarak hedef kategori altında tek bir dosyayı göstermeli, bu path ve SHA tam olarak expectedRevision ağacındaki blobla eşleşmelidir. Aynı kaynak path iki kez veya aynı uploadId iki kez kullanılamaz. Fazladan/eksik dosya part'ı, beklenmeyen manifest alanı, geçersiz/tekrarlı upload kimliği ve path traversal reddedilmeli. Dosya adını kullanıcıdan hedef path olarak kullanmayın. Her dosyanın PNG imzası ve mümkünse güvenli decode'u, formatı, boyutu sunucuda doğrulanmalıdır; istemcinin MIME, uzantı ve limit kontrollerine güvenmeyin.

Başarılı yanıt:

```json
{"success":true,"commitSha":"NEW_COMMIT_SHA","revision":"NEW_COMMIT_SHA","deploymentStatus":"pending"}
```

`deploymentStatus: pending` GitHub Pages'in henüz doğrulanmadığını belirtir. Commit başarılı fakat istemci cevabı alamamışsa tekrar deneme belirsizdir; istemci mevcut taslağı korur ve yeniden denemeden önce kontrol uyarısı verir. Bir yayın tekrarlandığında eski revision 409 vermelidir.

## Atomik GitHub güncellemesi ve eşzamanlılık

1. İstek girişini ve Access kimliğini doğrulayın; `main` head SHA'sını alın. `expectedRevision` ile eşit değilse **409**. O head'in commit/tree'sini ve yalnızca kategori bloblarını okuyun.
2. Bütün mevcut path/SHA çiftlerini bu sabit snapshot'a göre doğrulayın. Yeni upload içeriklerini boyut/PNG kontrollerinden sonra Git Blobs API'ye yükleyin; mevcut görseller için içerik kopyalamadan mevcut blob SHA'ları kullanılabilir.
3. Nihai manifest sırasını `01.png`, `02.png`, … biçiminde `String(n).padStart(2, '0')` ile (100+ dahil) hedef path → blob SHA eşlemesine dönüştürün. Her path için yalnızca **bir** ağaç girdisi üretin. Eski kategoride bulunup yeni eşlemede bulunmayan path'lere `sha: null` silme girdisi ekleyin; aynı path'e hem silme hem yazma girdisi eklemeyin. Kategori dışındaki ağaç girdilerini silmeyin. Sıralama, eksik numara, aynı içerikli bloblar, upload ve tümünü silme bu final-state yaklaşımında birlikte ele alınır.
4. Git Trees API'de `base_tree` mevcut commit tree SHA'sı ile tek tree, Git Commits API'de ebeveyn olarak `expectedRevision` ve yeni tree ile tek commit oluşturun. Henüz ref değiştirilmediği için ara durum yayınlanmaz.
5. Ref'i koşullu güncelleyin. Sırf öncesinde tekrar GET yapmak yarış koşulunu kapatmaz. Tercihen GitHub GraphQL `updateRefs` mutation `beforeOid=expectedRevision`, `afterOid=newCommit`, `force=false` ile gerçek compare-and-swap yapın ve mismatch'te 409 dönün. [GitHub updateRefs](https://docs.github.com/en/graphql/reference/git). REST `PATCH /git/refs/heads/main` `force:false` normal eşzamanlı ileri commit'lerde non-fast-forward yazmayı reddeder; ancak force push veya ref'in eski bir ataya geri alınması gibi durumlarda kesin expectedRevision eşitliği garantisi vermez. Mutlak CAS gereken bu sözleşmede GraphQL kullanın veya dışarıdan güvenilir bir serialization/CAS mekanizması ve force-push yasağıyla bu riski ele alın. Başarısız ref güncellemesinde yeni commit erişilemez kalabilir; kullanıcıya 409 dönün, otomatik yeniden uygulamayın. İşlem tek commit olarak görünür.
6. Sadece ref güncellemesi başarılıysa yeni commit SHA döndürün. GitHub Actions build/deploy'unu ayrıca kontrol edin; commit başarısı deploy başarısı değildir. [Git Trees](https://docs.github.com/en/rest/git/trees), [Git blobs](https://docs.github.com/en/rest/git/blobs), [Git commits](https://docs.github.com/en/rest/git/commits), [Refs](https://docs.github.com/en/rest/git/refs).

## Güvenlik ve limitler

- Fotoğraf listesi endpoint'inin erişimi Cloudflare Access tarafından yönetilir; Worker içinde ek kimlik doğrulaması yapılmaz. GitHub önizleme adresleri herkese açık depoya doğrudan erişir.
- POST için `Origin: https://admin.sarioglukapi.com` zorunlu; `Sec-Fetch-Site` gibi ek CSRF kontrolleri ve Access cookie koruması uygulayın. CORS'u genel erişime açmayın. GET yan etkisiz olsun. Request boyutunu parse öncesinde ve akış boyunca sınırlayın.
- Varsayılan istemci limiti 5 MiB/dosya ve toplam 20 MiB'dir. Worker bunları eşit veya daha düşük değerlerle ve multipart overhead için örneğin 21 MiB istek limitiyle uygular; upload adedi ve manifest boyutuna da üst sınır koyun (örneğin 20 dosya, 64 KiB manifest). GitHub'ın istek/secondary rate limitlerini ve Workers Free CPU, 128 MB bellek, subrequest sınırlarını hesaba katın. Base64 şişmesi ve parse kopyaları belleği artırır; gereksiz paralellikten kaçının. [Workers limitleri](https://developers.cloudflare.com/workers/platform/limits/). İstek body limitleri Cloudflare zone planına bağlıdır; bunlar uygulama limitlerinin yerine geçmez.
- Listeleme Worker'ında `GITHUB_API_KEY` Worker secret'tır. Erişim Cloudflare Access tarafından yönetilir. Listeleme için hedef repository üzerinde **Contents: read** yetkisi yeterlidir. Yayınlama için ayrıca yetkilendirilmiş bir uygulama gerekir.

## Hata yanıtları ve testler

Biçim örneği: `{"error":{"code":"CONFLICT","message":"..."}}`. UI status koduna göre güvenli Türkçe mesaj gösterir, ham sunucu mesajını göstermez.

| HTTP | Anlam |
| --- | --- |
| 400 | Yanlış manifest, geçersiz PNG/path, yinelenen referans |
| 401 | Access oturumu yok veya JWT geçersiz |
| 403 | Yetkisiz e-posta, host veya Origin |
| 404 | İzinli olmayan/bulunmayan kategori veya görsel |
| 409 | Head veya snapshot değişti; kullanıcı taslağı korunur |
| 413 | Dosya, toplam veya istek sınırı |
| 429 | Hız sınırı; mümkünse `Retry-After` |
| 500/502/503 | Worker, GitHub veya geçici servis sorunu |

Worker tamamlanınca test edin: boş/tek/çoklu kategori; ilk/son taşıma; tek/çoklu/tümünü silme; ekle ve araya taşı; tekrarlı blob ve path; eksik numara; dosya adı çakışması; bozuk PNG ve limit aşımı; yanlış kategori/path; Access/Origin reddi; iki eşzamanlı publish; ref geri alma/force push; GitHub kesintisi ve cevabı kaybolan başarılı commit. Her senaryoda Git tree'yi inceleyin, tek commit ve site model kodlarını kontrol edin. Hiçbir hata durumunda kısmi ref güncellemesi olmamalı.
