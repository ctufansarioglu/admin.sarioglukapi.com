"""Check real API requests against a Vite server started with VITE_USE_MOCK=false."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:5174/'
PHOTO = Path(__file__).resolve().parents[1] / 'src/assets/mock/ahsap/01.png'


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        requests = []
        previews = []
        revision = 'a' * 40

        def respond(route):
            path = urlparse(route.request.url).path
            requests.append(path)
            if path == '/api/me':
                route.fulfill(json={'email': 'admin@example.com'})
            elif path == '/api/catalog/share' and route.request.method == 'POST':
                route.fulfill(status=202, json={'status': 'queued'})
            elif path in ('/api/category-images/ahsap', '/api/category-images/lake'):
                category = path.split('/')[3]
                count = 2 if category == 'ahsap' else 1
                images = [{
                    'name': f'{index:02}.png',
                    'path': f'src/assets/images/categories/{category}/{index:02}.png',
                    'sha': f'sha-{index}',
                    'previewUrl': f'https://raw.githubusercontent.com/ctufansarioglu/sarioglukapi.com/{revision}/src/assets/images/categories/{category}/{index:02}.png',
                } for index in range(1, count + 1)]
                route.fulfill(json={'category': category, 'revision': revision, 'images': images})
            else:
                route.fulfill(status=404, json={'error': 'unexpected request'})

        page.route('**/api/**', respond)
        def respond_preview(route):
            previews.append(route.request.url)
            route.fulfill(body=PHOTO.read_bytes(), content_type='image/png')

        page.route('https://raw.githubusercontent.com/**', respond_preview)
        page.goto(BASE)
        page.locator('.product').first.wait_for()
        page.wait_for_function("document.querySelector('.product img')?.naturalWidth > 0")
        sidebar = page.locator('.sidebar')
        ahsap = sidebar.get_by_role('button', name='Ahşap Doğrama', exact=False)
        lake = sidebar.get_by_role('button', name='Lake', exact=False)
        assert ahsap.locator('.category-count').inner_text() == '2'
        assert lake.locator('.category-count').inner_text() == '—'
        lake.click()
        page.get_by_role('heading', name='Lake Kapılar').wait_for()
        page.locator('.product').first.wait_for()
        assert lake.locator('.category-count').inner_text() == '1'
        assert ahsap.locator('.category-count').inner_text() == '2'
        page.get_by_role('button', name='Kataloğu Paylaş').click()
        page.get_by_role('button', name='Vazgeç').click()
        assert '/api/catalog/share' not in requests
        page.get_by_role('button', name='Kataloğu Paylaş').click()
        page.get_by_role('button', name='Evet, Paylaş').click()
        page.get_by_text('Katalog gönderimi başlatıldı.', exact=False).wait_for()
        assert requests.count('/api/catalog/share') == 1
        assert '/api/me' in requests
        assert '/api/category-images/ahsap' in requests
        assert '/api/category-images/lake' in requests
        assert '/api/categories' not in requests
        assert all(path in ('/api/me', '/api/category-images/ahsap', '/api/category-images/lake', '/api/catalog/share') for path in requests), requests
        assert any(f'/{revision}/src/assets/images/categories/ahsap/' in url for url in previews), previews
        browser.close()
        print('Identity, image loading, and confirmed catalog dispatch requests passed.')


if __name__ == '__main__':
    run()
