import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../workers/catalog-share.js'

const origin = 'https://admin.sarioglukapi.com'
const env = { GITHUB_API_KEY: 'test-token' }
const request = (path = '/api/catalog/share', method = 'POST') => new Request(`${origin}${path}`, { method })

async function withGitHub(run, response) {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    if (response instanceof Error) throw response
    return response
  }
  try { await run(calls) } finally { globalThis.fetch = originalFetch }
}

test('katalog paylaşımı deploy workflowunu send_catalog seçeneğiyle başlatır', async () => {
  await withGitHub(async (calls) => {
    const response = await worker.fetch(request(), env)
    assert.equal(response.status, 202)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(await response.json(), { status: 'queued' })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://api.github.com/repos/ctufansarioglu/sarioglukapi.com/actions/workflows/deploy.yml/dispatches')
    assert.equal(calls[0].options.method, 'POST')
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token')
    assert.deepEqual(JSON.parse(calls[0].options.body), { ref: 'main', inputs: { send_catalog: 'true' } })
  }, new Response(null, { status: 204 }))
})

test('hatalı rota, yöntem ve eksik anahtar GitHub çağrısı yapmaz', async () => {
  await withGitHub(async (calls) => {
    assert.equal((await worker.fetch(request('/api/other'), env)).status, 404)
    assert.equal((await worker.fetch(request('/api/catalog/share', 'GET'), env)).status, 405)
    assert.equal((await worker.fetch(request(), {})).status, 503)
    assert.equal(calls.length, 0)
  }, new Response(null, { status: 204 }))
})

test('çalıştırma kimliği içeren 200 yanıtı kabul edilir, belirsiz yanıt edilmez', async () => {
  await withGitHub(async () => assert.equal((await worker.fetch(request(), env)).status, 202), Response.json({ workflow_run_id: 123 }))
  await withGitHub(async () => assert.equal((await worker.fetch(request(), env)).status, 502), Response.json({ message: 'unknown' }))
})

test('GitHub retleri ve belirsiz sonuçlar birbirinden ayrılır', async () => {
  for (const [upstream, expected] of [[403, 422], [404, 422], [429, 429], [500, 502]]) {
    await withGitHub(async () => assert.equal((await worker.fetch(request(), env)).status, expected), new Response(null, { status: upstream }))
  }
  await withGitHub(async () => assert.equal((await worker.fetch(request(), env)).status, 502), new Error('connection lost'))
})
