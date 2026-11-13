import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../workers/category-images.js'
import { createApiClient } from '../src/services/client.js'

const origin = 'https://admin.sarioglukapi.com'
const env = { GITHUB_API_KEY: 'test-github-secret' }
const revision = 'a'.repeat(40)
const treeSha = 'b'.repeat(40)
const firstSha = 'c'.repeat(40)
const secondSha = 'd'.repeat(40)
const imageSize = 8

function request(path, options = {}) {
  return new Request(`${origin}${path}`, options)
}

function treeEntry(name, sha) {
  return { path: `src/assets/images/categories/ahsap/${name}`, type: 'blob', mode: '100644', size: imageSize, sha }
}

async function withUpstream(run, { entries = [treeEntry('10.png', secondSha), treeEntry('02.png', firstSha)], truncated = false, githubStatus = 200 } = {}) {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    if (!String(url).startsWith('https://api.github.com/repos/ctufansarioglu/sarioglukapi.com/')) throw new Error('Unexpected upstream')
    if (githubStatus !== 200) return new Response('', { status: githubStatus })
    if (String(url).endsWith('/commits/main')) return Response.json({ sha: revision, commit: { tree: { sha: treeSha } } })
    if (String(url).endsWith(`/git/trees/${treeSha}?recursive=1`)) return Response.json({ tree: entries, truncated })
    throw new Error('Unexpected GitHub request')
  }
  try { await run(calls) } finally { globalThis.fetch = originalFetch }
}

test('kategori listesi sıralanır ve commit sabitlenmiş GitHub adresleri döner', async () => {
  await withUpstream(async (calls) => {
    const response = await worker.fetch(request('/api/category-images/ahsap'), env)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    const result = await response.json()
    assert.equal(result.revision, revision)
    assert.deepEqual(result.images.map((image) => image.name), ['02.png', '10.png'])
    assert.equal(result.images[0].sha, firstSha)
    assert.equal(result.images[0].previewUrl, `https://raw.githubusercontent.com/ctufansarioglu/sarioglukapi.com/${revision}/src/assets/images/categories/ahsap/02.png`)
    assert.equal(calls.length, 2)
    assert.ok(calls.every((call) => call.options.headers.Authorization === 'Bearer test-github-secret'))
    assert.equal(JSON.stringify(result).includes(env.GITHUB_API_KEY), false)

    const client = createApiClient({ origin, fetcher: (url, options) => worker.fetch(request(url, options), env) })
    assert.equal((await client.images('ahsap')).images.length, 2)
  })
})

test('geçersiz rota, yöntem ve eksik GitHub anahtarı için hata döner', async () => {
  assert.equal((await worker.fetch(request('/api/category-images/other'), env)).status, 404)
  assert.equal((await worker.fetch(request('/api/category-images/ahsap', { method: 'POST' }), env)).status, 405)
  assert.equal((await worker.fetch(request('/api/category-images/ahsap/02.png'), env)).status, 404)
  assert.equal((await worker.fetch(request('/api/category-images/ahsap'), {})).status, 503)
})

test('eksik GitHub ağacı, hatalı kategori içeriği ve boş kategori ele alınır', async () => {
  await withUpstream(async () => {
    assert.equal((await worker.fetch(request('/api/category-images/ahsap'), env)).status, 409)
  }, { entries: [treeEntry('notes.txt', firstSha)] })
  await withUpstream(async () => {
    assert.equal((await worker.fetch(request('/api/category-images/ahsap'), env)).status, 502)
  }, { truncated: true })
  await withUpstream(async () => {
    const response = await worker.fetch(request('/api/category-images/lake'), env)
    assert.deepEqual((await response.json()).images, [])
  })
  await withUpstream(async () => {
    assert.equal((await worker.fetch(request('/api/category-images/ahsap'), env)).status, 502)
  }, { githubStatus: 500 })
})
