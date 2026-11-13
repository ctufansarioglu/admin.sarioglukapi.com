import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../workers/publish.js'
import { createApiClient } from '../src/services/client.js'
import { publishDraft } from '../src/services/publication.js'

const origin = 'https://admin.sarioglukapi.com'
const env = { GITHUB_API_KEY: 'test-token' }
const prefix = 'src/assets/images/categories/ahsap/'
const oldRevision = 'a'.repeat(40)
const oldTree = 'b'.repeat(40)
const newTree = 'c'.repeat(40)
const newRevision = 'd'.repeat(40)
const sha1 = '1'.repeat(40)
const sha2 = '2'.repeat(40)
const sha3 = '3'.repeat(40)
const uploadedSha = '4'.repeat(40)
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])
const existing = (index, sha) => ({ type: 'existing', path: `${prefix}${String(index).padStart(2, '0')}.png`, sha })
const defaultEntries = [existing(1, sha1), existing(2, sha2), existing(3, sha3)]
const treeEntries = (items) => items.map((item) => ({ path: item.path, type: 'blob', mode: '100644', sha: item.sha }))

function publishRequest(items, { revision = oldRevision, files = {}, path = '/api/categories/ahsap/publish', extra = [] } = {}) {
  const form = new FormData()
  form.append('manifest', JSON.stringify({ expectedRevision: revision, items }))
  for (const [key, bytes] of Object.entries(files)) form.append(key, new File([bytes], `${key}.png`, { type: 'image/png' }))
  for (const [key, value] of extra) form.append(key, value)
  return new Request(`${origin}${path}`, { method: 'POST', body: form })
}

async function withGitHub(run, { head = oldRevision, entries = defaultEntries, truncated = false, graphql = 'success' } = {}) {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname
    const body = options.body ? JSON.parse(options.body) : undefined
    calls.push({ path, method: options.method, body, headers: options.headers })
    if (path === '/repos/ctufansarioglu/sarioglukapi.com') return Response.json({ node_id: 'repository-id' })
    if (path.endsWith('/commits/main')) return Response.json({ sha: head, commit: { tree: { sha: oldTree } } })
    if (path.endsWith(`/git/trees/${oldTree}`)) return Response.json({ tree: treeEntries(entries), truncated })
    if (path.endsWith('/git/blobs')) return Response.json({ sha: uploadedSha }, { status: 201 })
    if (path.endsWith('/git/trees') && options.method === 'POST') return Response.json({ sha: newTree }, { status: 201 })
    if (path.endsWith('/git/commits')) return Response.json({ sha: newRevision }, { status: 201 })
    if (path === '/graphql') {
      if (graphql === 'network-error') throw new Error('connection lost')
      if (graphql === 'errors') return Response.json({ errors: [{ message: 'ref update rejected' }] })
      return Response.json({ data: { updateRefs: { clientMutationId: body.variables.input.clientMutationId } } })
    }
    throw new Error(`Unexpected GitHub request: ${path}`)
  }
  try { await run(calls) } finally { globalThis.fetch = originalFetch }
}

test('ekleme, silme ve sıralama tek ağaç ve koşullu ref güncellemesi üretir', async () => {
  await withGitHub(async (calls) => {
    const items = [existing(3, sha3), existing(1, sha1), { type: 'upload', uploadId: 'upload-1' }]
    const response = await worker.fetch(publishRequest(items, { files: { 'upload-1': png } }), env)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { success: true, commitSha: newRevision, revision: newRevision, deploymentStatus: 'pending' })
    const blob = calls.find((call) => call.path.endsWith('/git/blobs'))
    assert.equal(blob.body.encoding, 'base64')
    assert.deepEqual(new Uint8Array(Buffer.from(blob.body.content, 'base64')), png)
    const tree = calls.find((call) => call.path.endsWith('/git/trees') && call.method === 'POST').body
    assert.equal(tree.base_tree, oldTree)
    assert.deepEqual(tree.tree, [
      { path: `${prefix}01.png`, mode: '100644', type: 'blob', sha: sha3 },
      { path: `${prefix}02.png`, mode: '100644', type: 'blob', sha: sha1 },
      { path: `${prefix}03.png`, mode: '100644', type: 'blob', sha: uploadedSha },
    ])
    assert.equal(new Set(tree.tree.map((entry) => entry.path)).size, tree.tree.length)
    const commit = calls.find((call) => call.path.endsWith('/git/commits')).body
    assert.equal(commit.tree, newTree)
    assert.deepEqual(commit.parents, [oldRevision])
    const update = calls.find((call) => call.path === '/graphql').body
    assert.equal(update.variables.input.repositoryId, 'repository-id')
    assert.deepEqual(update.variables.input.refUpdates, [{ name: 'refs/heads/main', beforeOid: oldRevision, afterOid: newRevision, force: false }])
    assert.ok(calls.every((call) => call.headers.Authorization === 'Bearer test-token'))
  })
})

test('tüm fotoğraflar silinebilir ve diğer kategoriye dokunulmaz', async () => {
  const entries = [...defaultEntries, { path: 'src/assets/images/categories/lake/01.png', sha: '5'.repeat(40) }]
  await withGitHub(async (calls) => {
    assert.equal((await worker.fetch(publishRequest([]), env)).status, 200)
    const tree = calls.find((call) => call.path.endsWith('/git/trees') && call.method === 'POST').body.tree
    assert.deepEqual(tree.map((item) => item.path), defaultEntries.map((item) => item.path))
    assert.ok(tree.every((item) => item.sha === null))
  }, { entries })
})

test('aynı blobların yeniden sıralanması değişiklik yoksa mevcut sürümü döndürür', async () => {
  const entries = [existing(1, sha1), existing(2, sha1)]
  await withGitHub(async (calls) => {
    const response = await worker.fetch(publishRequest([existing(2, sha1), existing(1, sha1)]), env)
    assert.deepEqual(await response.json(), { success: true, commitSha: oldRevision, revision: oldRevision, deploymentStatus: 'unchanged' })
    assert.equal(calls.some((call) => call.method === 'POST'), false)
  }, { entries })
})

test('eski sürüm ve geçersiz kaynak fotoğraf yayın öncesi çatışma döndürür', async () => {
  await withGitHub(async (calls) => {
    assert.equal((await worker.fetch(publishRequest(defaultEntries), env)).status, 409)
    assert.equal(calls.some((call) => call.method === 'POST'), false)
  }, { head: 'f'.repeat(40) })
  await withGitHub(async (calls) => {
    assert.equal((await worker.fetch(publishRequest([existing(1, sha2)]), env)).status, 409)
    assert.equal(calls.some((call) => call.method === 'POST'), false)
  })
})

test('geçersiz veya fazla yüklemeler GitHub yazma işlemi başlatmaz', async () => {
  await withGitHub(async (calls) => {
    const upload = [{ type: 'upload', uploadId: 'upload-1' }]
    assert.equal((await worker.fetch(publishRequest(upload), env)).status, 400)
    assert.equal((await worker.fetch(publishRequest(upload, { files: { 'upload-1': Uint8Array.of(1, 2, 3) } }), env)).status, 400)
    const oversized = new Uint8Array(5 * 1024 * 1024 + 1)
    oversized.set(png)
    assert.equal((await worker.fetch(publishRequest(upload, { files: { 'upload-1': oversized } }), env)).status, 413)
    const manyUploads = Array.from({ length: 21 }, (_, index) => ({ type: 'upload', uploadId: `upload-${index}` }))
    const manyFiles = Object.fromEntries(manyUploads.map(({ uploadId }) => [uploadId, png]))
    assert.equal((await worker.fetch(publishRequest(manyUploads, { files: manyFiles }), env)).status, 413)
    assert.equal((await worker.fetch(publishRequest([existing(1, sha1), existing(1, sha1)]), env)).status, 400)
    assert.equal((await worker.fetch(publishRequest([], { files: { extra: png } }), env)).status, 400)
    assert.equal(calls.length, 0)
  })
})

test('ref güncelleme hatası ve bağlantı kaybı belirsiz sonuç olarak korunur', async () => {
  for (const graphql of ['errors', 'network-error']) {
    await withGitHub(async () => {
      const api = createApiClient({ origin, fetcher: (url, options) => worker.fetch(new Request(`${origin}${url}`, options), env) })
      const result = await publishDraft(api, 'ahsap', oldRevision, [
        { ...existing(2, sha2), key: 'existing:2' },
        { ...existing(1, sha1), key: 'existing:1' },
      ])
      assert.equal(result.kind, 'uncertain')
    }, { graphql })
  }
})

test('tamamlanmamış ağaç ve olağandışı kategori içeriği yayınlanmaz', async () => {
  await withGitHub(async (calls) => {
    assert.equal((await worker.fetch(publishRequest(defaultEntries), env)).status, 502)
    assert.equal(calls.some((call) => call.method === 'POST'), false)
  }, { truncated: true })
  await withGitHub(async (calls) => {
    assert.equal((await worker.fetch(publishRequest([]), env)).status, 409)
    assert.equal(calls.some((call) => call.method === 'POST'), false)
  }, { entries: [{ path: `${prefix}notes.txt`, sha: sha1 }] })
})
