import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient, isAmbiguousPublishError } from '../src/services/client.js'

const origin = 'https://admin.example.com'
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'content-type': 'application/json' },
})

test('yayın isteği mevcut sözleşmedeki manifest ve dosya alanlarını kullanır', async () => {
  let request
  const api = createApiClient({ origin, fetcher: async (url, options) => {
    request = { url, options }
    return json({ success: true, revision: 'next', commitSha: 'next', deploymentStatus: 'pending' })
  } })
  const file = new File(['png'], 'photo.png', { type: 'image/png' })
  await api.publish('ahsap', 'rev', [
    { type: 'existing', path: 'category/01.png', sha: 'sha' },
    { type: 'upload', uploadId: 'upload-1', file },
    { type: 'upload', uploadId: 'deleted', file, deleted: true },
  ])
  assert.equal(request.url, '/api/categories/ahsap/publish')
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.credentials, 'same-origin')
  assert.deepEqual(JSON.parse(request.options.body.get('manifest')), {
    expectedRevision: 'rev', items: [
      { type: 'existing', path: 'category/01.png', sha: 'sha' },
      { type: 'upload', uploadId: 'upload-1' },
    ],
  })
  assert.equal(request.options.body.get('upload-1').name, 'photo.png')
  assert.equal(request.options.body.has('deleted'), false)
  assert.equal(request.options.headers['Content-Type'], undefined)
})

test('boş taslak boş manifest olarak gönderilir', async () => {
  let body
  const api = createApiClient({ origin, fetcher: async (_url, options) => {
    body = options.body
    return json({ success: true, revision: 'next' })
  } })
  await api.publish('ahsap', 'rev', [])
  assert.deepEqual(JSON.parse(body.get('manifest')), { expectedRevision: 'rev', items: [] })
})

test('hata kodları ve belirsiz yayın sonuçları güvenli şekilde ayrılır', async () => {
  for (const status of [401, 403, 409, 413, 429, 500, 502, 503]) {
    const api = createApiClient({ origin, fetcher: async () => json({ secret: 'do not display' }, status) })
    await assert.rejects(api.publish('ahsap', 'rev', []), (error) => {
      assert.equal(error.status, status)
      assert.equal(error.message.includes('do not display'), false)
      assert.equal(isAmbiguousPublishError(error), status >= 500)
      return true
    })
  }
  assert.equal(isAmbiguousPublishError({ status: 0 }), true)
})

test('görsel snapshot yanıtları sözleşmeye göre doğrulanır', async () => {
  const image = { path: 'category/01.png', sha: 'sha', previewUrl: '/api/categories/ahsap/images/01.png?revision=rev' }
  const api = createApiClient({ origin, fetcher: async () => json({ category: 'ahsap', revision: 'rev', images: [image] }) })
  assert.equal((await api.images('ahsap')).images.length, 1)
  for (const value of [null, { category: 'pvc', revision: 'rev', images: [] }, { category: 'ahsap', revision: 'rev', images: [null] }, { category: 'ahsap', revision: 'rev', images: [{ ...image, previewUrl: 'https://evil.example/x' }] }]) {
    const broken = createApiClient({ origin, fetcher: async () => json(value) })
    await assert.rejects(broken.images('ahsap'), /Ürün bilgileri okunamadı/)
  }
})

test('HTML veya okunamayan JSON yanıtı hata kabul edilir', async () => {
  const api = createApiClient({ origin, fetcher: async () => new Response('<html>', { headers: { 'content-type': 'text/html' } }) })
  await assert.rejects(api.me(), /Oturumunuzu kontrol edin/)
})

test('iptal edilen okumalar bağlantı hatasına çevrilmez', async () => {
  const aborted = new DOMException('Aborted', 'AbortError')
  const api = createApiClient({ origin, fetcher: async () => { throw aborted } })
  await assert.rejects(api.images('ahsap'), (error) => error === aborted)
})

test('başka origin API adresine istek gönderilmez', async () => {
  let called = false
  const external = createApiClient({ origin, base: 'https://other.example/api', fetcher: async () => { called = true } })
  await assert.rejects(external.me())
  assert.equal(called, false)
})

test('eksik kimlik güvenli hata üretir', async () => {
  const noIdentity = createApiClient({ origin, fetcher: async () => json({ email: '' }) })
  await assert.rejects(noIdentity.me(), /Ürün bilgileri okunamadı/)
})

 test('aynı yola sahip iki görsel kimlik çakışmasını önlemek için reddedilir', async () => {
  const image = { path: 'category/01.png', sha: 'sha', previewUrl: '/api/images/01.png' }
  const api = createApiClient({ origin, fetcher: async () => json({ category: 'ahsap', revision: 'rev', images: [image, { ...image, sha: 'other' }] }) })
  await assert.rejects(api.images('ahsap'), /Ürün bilgileri okunamadı/)
})
