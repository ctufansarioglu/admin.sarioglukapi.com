"""Optional browser smoke test: run against the Vite dev server with Python Playwright."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:5173/'
PHOTO = str(Path(__file__).resolve().parents[1] / 'src/assets/mock/ahsap/01.png')


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE)
        page.get_by_role('heading', name='Ahşap Doğrama Kapılar').wait_for()
        page.get_by_role('button', name='Fotoğraf Ekle').wait_for(state='visible')
        page.locator('.product').first.wait_for()
        before = page.locator('.product').count()
        sidebar = page.locator('.sidebar')
        assert sidebar.get_by_role('button', name='Ahşap Doğrama', exact=False).locator('.category-count').inner_text() == str(before)
        assert sidebar.get_by_role('button', name='Lake', exact=False).locator('.category-count').inner_text() == '—'
        page.locator('input[name="photos"]').set_input_files(PHOTO)
        page.get_by_text('Yeni eklendi').wait_for()
        assert page.locator('.product').count() == before + 1
        page.get_by_role('button', name='Sil: AD-01').click()
        page.get_by_role('button', name='Geri al: 01.png').click()
        page.evaluate("window.savedProduct = document.querySelectorAll('.product')[1]")
        page.get_by_role('button', name='AD-02 fotoğrafını önceki sıraya taşı').click()
        assert page.evaluate("document.querySelector('.product') === window.savedProduct")
        page.get_by_role('button', name='Değişiklikleri İptal Et').click()
        page.get_by_role('button', name='Evet, İptal Et').click()
        assert page.locator('.product').count() == before
        page.get_by_role('button', name='Sil: AD-01').click()
        page.get_by_role('button', name='Değişiklikleri Yayınla').click()
        page.get_by_role('button', name='Evet, Yayınla').click()
        page.get_by_text('Örnek değişiklikler kaydedildi.', exact=False).wait_for()
        assert page.locator('.product').count() == before - 1
        assert sidebar.get_by_role('button', name='Ahşap Doğrama', exact=False).locator('.category-count').inner_text() == str(before - 1)
        page.get_by_role('button', name='Lake', exact=False).click()
        page.get_by_role('heading', name='Lake Kapılar').wait_for()
        page.locator('.product').first.wait_for()
        assert sidebar.get_by_role('button', name='Lake', exact=False).locator('.category-count').inner_text() == '5'
        assert not errors, errors

        mobile = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
        mobile.goto(BASE)
        mobile.locator('.product').first.wait_for()
        mobile.get_by_label('Kategori', exact=True).select_option('pvc')
        mobile.get_by_role('heading', name='PVC Kapılar').wait_for()
        mobile.get_by_role('button', name='PVC-02 fotoğrafını önceki sıraya taşı').click()
        assert mobile.get_by_text('1 değişiklik yayınlanmayı bekliyor').is_visible()
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')

        drag = browser.new_page(viewport={'width': 1280, 'height': 900})
        drag.goto(BASE)
        drag.locator('.product').first.wait_for()
        products = drag.locator('.product')
        first_id = products.nth(0).get_attribute('id')
        source = products.nth(0).locator('.product-image').bounding_box()
        target = products.nth(2).locator('.product-image').bounding_box()
        drag.mouse.move(source['x'] + source['width'] / 2, source['y'] + source['height'] / 2)
        drag.mouse.down()
        drag.mouse.move(target['x'] + target['width'] / 2, target['y'] + target['height'] / 2, steps=12)
        drag.mouse.up()
        drag.wait_for_function('(id) => document.querySelectorAll(".product")[2].id === id', arg=first_id)
        drag.close()

        limits = browser.new_page()
        limits.goto(BASE)
        limits.locator('.product').first.wait_for()
        png = Path(PHOTO).read_bytes()
        padded_png = png + bytes(5 * 1024 * 1024 - len(png))
        files = [{'name': f'limit-{index}.png', 'mimeType': 'image/png', 'buffer': padded_png} for index in range(5)]
        limits.locator('input[name="photos"]').set_input_files(files[:4])
        limits.get_by_role('button', name='Sil: AD-07').click()
        limits.locator('input[name="photos"]').set_input_files(files[4:])
        limits.get_by_role('button', name='Geri al: limit-0.png').click()
        limits.get_by_text('Bu fotoğrafı geri almak toplam yükleme sınırını aşar.').wait_for()
        assert limits.get_by_role('button', name='Geri al: limit-0.png').is_visible()
        limits.close()

        failure = browser.new_page()
        failure.goto(BASE + '?mockError=500')
        failure.locator('.product').first.wait_for()
        failure.get_by_role('button', name='Sil: AD-01').click()
        failure.get_by_role('button', name='Değişiklikleri Yayınla').click()
        failure.get_by_role('button', name='Evet, Yayınla').click()
        failure.get_by_text('Kayıt sonucu belirsiz olabilir', exact=False).wait_for()
        assert failure.get_by_role('button', name='Değişiklikleri Yayınla').is_disabled()
        failure.get_by_role('button', name='Güncel ürünleri kontrol et').click()
        failure.get_by_text('Sunucudaki sürüm henüz değişmemiş', exact=False).wait_for()
        assert failure.get_by_role('button', name='Değişiklikleri Yayınla').is_enabled()

        unreadable = browser.new_page()
        unreadable.goto(BASE + '?mockError=read-images')
        unreadable.get_by_text('Örnek ürün okuma hatası.', exact=False).wait_for()
        assert unreadable.get_by_role('button', name='Fotoğraf Ekle').is_disabled()

        lost = browser.new_page()
        lost.goto(BASE + '?mockError=publish-response-lost')
        lost.locator('.product').first.wait_for()
        lost.get_by_role('button', name='Sil: AD-01').click()
        lost.get_by_role('button', name='Değişiklikleri Yayınla').click()
        lost.get_by_role('button', name='Evet, Yayınla').click()
        lost.get_by_text('Kayıt sonucu belirsiz olabilir', exact=False).wait_for()
        lost.get_by_role('button', name='Güncel ürünleri kontrol et').click()
        lost.get_by_text('Sunucudaki sürüm değişmiş', exact=False).wait_for()
        assert lost.locator('.product-deleted').count() == 1

        refresh = browser.new_page()
        refresh.goto(BASE + '?mockError=refresh-after-publish')
        refresh.locator('.product').first.wait_for()
        refresh.get_by_role('button', name='Sil: AD-01').click()
        refresh.get_by_role('button', name='Değişiklikleri Yayınla').click()
        refresh.get_by_role('button', name='Evet, Yayınla').click()
        refresh.get_by_text('Kayıt tamamlandı ancak güncel ürünler alınamadı', exact=False).wait_for()
        assert refresh.get_by_role('button', name='Değişiklikleri Yayınla').is_disabled()
        browser.close()
        print('Desktop, mobile, draft, publish, and uncertain-result smoke tests passed.')


if __name__ == '__main__':
    run()
