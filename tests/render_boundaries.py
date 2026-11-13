"""Check React render boundaries against the Vite dev server with Python Playwright."""
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:5173/'
PHOTO = str(Path(__file__).resolve().parents[1] / 'src/assets/mock/ahsap/01.png')

# The DevTools hook observes committed React work; DOM mutation checks alone cannot
# distinguish a component render from a render that produces identical markup.
RENDER_OBSERVER = r'''
  window.renderCommits = [];
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject(renderer) { this.renderers.set(1, renderer); return 1 },
    onCommitFiberUnmount() {},
    onCommitFiberRoot(_, root) {
      const tracked = new Set(['App', 'AppLayout', 'InfoBanner', 'CatalogWorkspace', 'CatalogHeader', 'Sidebar', 'PublishBarState', 'PublishBar', 'StatusDot', 'DraftCount', 'DraftDescription', 'DiscardButton', 'PublishButton', 'GalleryArea', 'ImageGrid', 'Product']);
      const current = new Map();
      const rendered = [];
      const previous = this.previous || new Map();
      function visit(fiber) {
        if (!fiber) return;
        const type = fiber.elementType;
        const name = type?.type?.name || type?.name;
        if (tracked.has(name)) {
          const key = `${name}:${fiber.key || ''}`;
          current.set(key, fiber);
          if (previous.get(key) !== fiber && (fiber.flags & 1)) rendered.push(key);
        }
        visit(fiber.child);
        visit(fiber.sibling);
      }
      visit(root.current);
      this.previous = current;
      window.renderCommits.push(rendered);
    },
  };
'''


def reset(page):
    page.evaluate('window.renderCommits = []')


def rendered(page):
    return page.evaluate('window.renderCommits.flat()')


def assert_static_layout(commits):
    assert not any(name.startswith(('App:', 'AppLayout:', 'InfoBanner:')) for name in commits), commits


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.add_init_script(RENDER_OBSERVER)
        page.goto(BASE)
        page.locator('.product').first.wait_for()
        page.wait_for_timeout(300)
        assert page.evaluate("['App:', 'AppLayout:', 'InfoBanner:', 'CatalogWorkspace:', 'CatalogHeader:', 'Sidebar:', 'PublishBar:', 'StatusDot:', 'DraftCount:', 'DraftDescription:', 'DiscardButton:', 'PublishButton:', 'GalleryArea:', 'ImageGrid:'].every(key => window.__REACT_DEVTOOLS_GLOBAL_HOOK__.previous.has(key))")

        reset(page)
        products = page.locator('.product')
        first_id = products.nth(0).get_attribute('id')
        source = products.nth(0).locator('.product-image').bounding_box()
        target = products.nth(2).locator('.product-image').bounding_box()
        page.mouse.move(source['x'] + source['width'] / 2, source['y'] + source['height'] / 2)
        page.mouse.down()
        page.mouse.move(target['x'] + target['width'] / 2, target['y'] + target['height'] / 2, steps=12)
        page.mouse.up()
        page.wait_for_function('(id) => document.querySelectorAll(".product")[2].id === id', arg=first_id)
        page.wait_for_timeout(300)
        commits = rendered(page)
        assert_static_layout(commits)
        assert 'Sidebar:' not in commits, commits

        confirmations = []
        def dismiss_category_change(dialog):
            confirmations.append(dialog.message)
            dialog.dismiss()

        page.once('dialog', dismiss_category_change)
        page.get_by_role('button', name='Lake', exact=False).click()
        assert confirmations and 'Yayınlanmamış değişiklikler' in confirmations[0]
        assert page.get_by_role('heading', name='Ahşap Doğrama Kapılar').is_visible()

        reset(page)
        page.get_by_role('button', name='AD-03 fotoğrafını önceki sıraya taşı').click()
        commits = rendered(page)
        assert_static_layout(commits)
        assert 'Sidebar:' not in commits, commits

        reset(page)
        page.get_by_role('button', name='AD-02 fotoğrafını önceki sıraya taşı').click()
        page.get_by_text('Tüm değişiklikler kaydedildi').wait_for()
        commits = rendered(page)
        assert_static_layout(commits)
        assert 'Sidebar:' not in commits, commits

        unexpected_after_undo = []
        def dismiss_after_undo(dialog):
            unexpected_after_undo.append(dialog.message)
            dialog.dismiss()

        page.once('dialog', dismiss_after_undo)
        page.get_by_role('button', name='Lake', exact=False).click()
        page.get_by_role('heading', name='Lake Kapılar').wait_for()
        assert not unexpected_after_undo
        page.remove_listener('dialog', dismiss_after_undo)
        page.get_by_role('button', name='Ahşap Doğrama', exact=False).click()
        page.locator('.product').first.wait_for()

        reset(page)
        page.get_by_role('button', name='Sil: AD-06').click()
        page.get_by_text('Silinecek').wait_for()
        page.wait_for_timeout(100)
        commits = rendered(page)
        assert_static_layout(commits)
        products = {name for name in commits if name.startswith('Product:')}
        assert len(products) == 2, commits
        assert 'PublishBar:' not in commits, commits
        assert page.get_by_role('button', name='Değişiklikleri İptal Et').is_enabled()
        assert page.get_by_role('button', name='Değişiklikleri Yayınla').is_enabled()

        reset(page)
        page.get_by_role('button', name='Sil: AD-05').click()
        page.get_by_text('2 değişiklik yayınlanmayı bekliyor').wait_for()
        commits = rendered(page)
        assert 'DraftCount:' in commits, commits
        assert not any(name.startswith(('PublishBar:', 'StatusDot:', 'DraftDescription:', 'DiscardButton:', 'PublishButton:')) for name in commits), commits

        reset(page)
        page.get_by_role('button', name='Geri al: 05.png').click()
        page.get_by_text('1 değişiklik yayınlanmayı bekliyor').wait_for()
        commits = rendered(page)
        assert 'DraftCount:' in commits, commits
        assert not any(name.startswith(('PublishBar:', 'StatusDot:', 'DraftDescription:', 'DiscardButton:', 'PublishButton:')) for name in commits), commits

        reset(page)
        page.get_by_role('button', name='Değişiklikleri İptal Et').click()
        page.get_by_role('dialog').wait_for()
        commits = rendered(page)
        assert_static_layout(commits)
        assert not any(name.startswith(('CatalogWorkspace:', 'CatalogHeader:', 'PublishBar:', 'ImageGrid:', 'Product:')) for name in commits), commits
        assert 'GalleryArea:' in commits, commits
        page.evaluate('''() => {
          const transfer = new DataTransfer();
          transfer.items.add(new File(['test'], 'blocked.png', { type: 'image/png' }));
          window.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
        }''')
        assert page.locator('.product').count() == 6
        page.get_by_role('button', name='Vazgeç').click()

        reset(page)
        page.locator('input[name="photos"]').set_input_files(PHOTO)
        page.get_by_text('Yeni eklendi').wait_for()
        assert_static_layout(rendered(page))

        page.get_by_role('button', name='Değişiklikleri İptal Et').click()
        page.get_by_role('button', name='Evet, İptal Et').click()

        page.locator('input[name="photos"]').set_input_files(PHOTO)
        page.get_by_role('button', name='Sil: AD-07').click()
        page.get_by_text('Tüm değişiklikler kaydedildi').wait_for()
        assert page.get_by_role('button', name='Değişiklikleri İptal Et').is_enabled()
        assert page.get_by_role('button', name='Değişiklikleri Yayınla').is_disabled()
        page.get_by_role('button', name='Değişiklikleri İptal Et').click()
        page.get_by_role('dialog').get_by_text('geri alınabilir fotoğraf eklemeleri', exact=False).wait_for()
        page.get_by_role('button', name='Evet, İptal Et').click()

        reset(page)
        unexpected_confirmations = []
        def dismiss_unexpected_confirmation(dialog):
            unexpected_confirmations.append(dialog.message)
            dialog.dismiss()

        page.once('dialog', dismiss_unexpected_confirmation)
        page.get_by_role('button', name='Lake', exact=False).click()
        page.get_by_role('heading', name='Lake Kapılar').wait_for()
        assert not unexpected_confirmations
        assert_static_layout(rendered(page))

        page.remove_listener('dialog', dismiss_unexpected_confirmation)
        page.locator('.product').first.wait_for()
        page.get_by_role('button', name='LK-02 fotoğrafını önceki sıraya taşı').click()
        confirmations = []
        def accept_category_change(dialog):
            confirmations.append(dialog.message)
            dialog.accept()

        page.once('dialog', accept_category_change)
        page.get_by_role('button', name='PVC', exact=False).click()
        page.get_by_role('heading', name='PVC Kapılar').wait_for()
        assert confirmations and 'Yayınlanmamış değişiklikler' in confirmations[0]
        browser.close()
        print('Render boundaries passed for sorting, deletion, dialog, upload, and category change.')


if __name__ == '__main__':
    run()
