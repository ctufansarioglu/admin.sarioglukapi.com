# Yayın öncesi kontrol listesi

- [ ] Ayrı panel deposu GitHub Pages üzerinde GitHub Actions ile derlenip açılıyor.
- [ ] `admin.sarioglukapi.com` GitHub Pages'e atanmış, DNS ve Cloudflare proxy doğru.
- [ ] GitHub Pages HTTPS ve Cloudflare Full (strict) çalışıyor.
- [ ] Access giriş ekranı hem panel hem API için çıkıyor; izinli e-posta giriş yapıyor, yetkisiz kullanıcı engelleniyor.
- [ ] Oturumsuz, yanlış audience, yanlış Origin ve alternatif `workers.dev` isteği API'ye ulaşamıyor.
- [ ] Görseller gerçek `main` revision'ından ve yalnızca Worker üzerinden geliyor.
- [ ] Boş kategori, tek ve çok sayıda görsel, ilk/son sıraya taşıma, birden çok silme/geri alma, tümünü silme, yeni dosyayı araya taşıma, iptal ve sayfadan ayrılma denenmiş.
- [ ] Hatalı format/büyük dosya, toplam limit, ağ hatası, 401/403/409/413/429/5xx ve eşzamanlı düzenleme denenmiş; hatada taslak korunuyor.
- [ ] Ekleme/silme/sıralama doğru ve son klasör tek atomik commit ile oluşturuluyor; paralel yazımda üzerine yazılmıyor.
- [ ] Ana sitenin GitHub Actions workflow'u commit ile otomatik tetikleniyor ve deploy sonucu ayrıca doğrulanıyor.
- [ ] Başarılı commit mesajı, sitenin deploy edildiği anlamına gelmiyor; Actions sonucu ve canlı site ayrıca kontrol ediliyor.
- [ ] Masaüstü, tablet, mobil, dokunma, klavye ve odak görünümü kontrol edilmiş.
- [ ] Worker Secrets ve minimum GitHub yetkileri doğrulanmış; token frontend ve loglarda yok.
