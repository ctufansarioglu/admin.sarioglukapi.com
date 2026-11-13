import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../workers/me.js'
import { createApiClient } from '../src/services/client.js'

const origin = 'https://admin.sarioglukapi.com'
const request = (path = '/api/me', options = {}) => new Request(`${origin}${path}`, options)
const context = (identity) => ({ access: { getIdentity: async () => identity } })

test('me endpointi Access kullanıcı e-postasını istemci sözleşmesiyle döndürür', async () => {
  const ctx = context({ email: ' admin@example.com ', name: 'Admin' })
  const response = await worker.fetch(request(), {}, ctx)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), { email: 'admin@example.com' })

  const api = createApiClient({ origin, fetcher: (url, options) => worker.fetch(request(url, options), {}, ctx) })
  assert.deepEqual(await api.me(), { email: 'admin@example.com' })
})

test('Access kullanıcı bilgisi yoksa 401, bilgi alınamıyorsa 503 döner', async () => {
  assert.equal((await worker.fetch(request(), {}, {})).status, 401)
  assert.equal((await worker.fetch(request(), {}, context({}))).status, 401)
  assert.equal((await worker.fetch(request(), {}, context({ email: ' ' }))).status, 401)
  const unavailable = { access: { getIdentity: async () => { throw new Error('unavailable') } } }
  assert.equal((await worker.fetch(request(), {}, unavailable)).status, 503)
})

test('me endpointi yalnızca GET ve kendi rotasını karşılar', async () => {
  const ctx = context({ email: 'admin@example.com' })
  const post = await worker.fetch(request('/api/me', { method: 'POST' }), {}, ctx)
  assert.equal(post.status, 405)
  assert.equal(post.headers.get('allow'), 'GET')
  assert.equal((await worker.fetch(request('/api/other'), {}, ctx)).status, 404)
})
