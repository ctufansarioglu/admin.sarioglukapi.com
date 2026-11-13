import test from 'node:test'
import assert from 'node:assert/strict'
import { publishDraft } from '../src/services/publication.js'

test('başarılı yayından sonra aynı kategori yeniden okunur', async () => {
  const calls = []
  const api = {
    publish: async (...args) => { calls.push(['publish', ...args]); return { success: true, revision: 'next' } },
    images: async (category) => { calls.push(['images', category]); return { category, revision: 'next', images: [] } },
  }
  const draft = [{ type: 'existing', path: 'x', sha: 'y' }]
  const result = await publishDraft(api, 'ahsap', 'rev', draft)
  assert.equal(result.kind, 'saved')
  assert.deepEqual(calls, [['publish', 'ahsap', 'rev', draft], ['images', 'ahsap']])
})

test('kayıt başarılıyken tekrar okuma hatası yeni bir yayın hatası sayılmaz', async () => {
  const result = await publishDraft({
    publish: async () => ({ success: true, revision: 'next' }),
    images: async () => { throw new Error('offline') },
  }, 'ahsap', 'rev', [])
  assert.equal(result.kind, 'saved-unrefreshed')
})

test('çatışma ve belirsiz sonuçlar farklı ele alınır ve otomatik yeniden denenmez', async () => {
  for (const [status, kind] of [[409, 'rejected'], [401, 'rejected'], [0, 'uncertain'], [500, 'uncertain'], [503, 'uncertain']]) {
    let attempts = 0
    const api = { publish: async () => { attempts++; throw Object.assign(new Error('hata'), { status }) } }
    const result = await publishDraft(api, 'ahsap', 'rev', [])
    assert.equal(result.kind, kind)
    assert.equal(attempts, 1)
  }
  assert.equal((await publishDraft({ publish: async () => ({ success: true }) }, 'ahsap', 'rev', [])).kind, 'uncertain')
})
