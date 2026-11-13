import { Buffer } from 'node:buffer'

const REPOSITORY = 'ctufansarioglu/sarioglukapi.com'
const CATEGORY_ROOT = 'src/assets/images/categories'
const CATEGORIES = new Set(['ahsap', 'amerikan-panel', 'lake', 'melamin', 'pvc'])
const SHA = /^[a-f0-9]{40}$/
const FILE_NAME = /^[0-9]+\.png$/
const UPLOAD_ID = /^[a-zA-Z0-9_-]{1,128}$/
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const MAX_FILE = 5 * 1024 * 1024
const MAX_TOTAL = 20 * 1024 * 1024
const MAX_BODY = 21 * 1024 * 1024
const MAX_MANIFEST = 64 * 1024
const MAX_UPLOADS = 20

class HttpError extends Error {
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', ...headers } })
}

async function parseForm(request) {
  const contentType = request.headers.get('content-type') || ''
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body) throw new HttpError(400, 'INVALID_FORM')
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY) throw new HttpError(413, 'TOO_LARGE')

  const reader = request.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY) {
        await reader.cancel()
        throw new HttpError(413, 'TOO_LARGE')
      }
      chunks.push(value)
    }
    return await new Response(new Blob(chunks), { headers: { 'Content-Type': contentType } }).formData()
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'INVALID_FORM')
  } finally { reader.releaseLock() }
}

async function parseDraft(request) {
  const form = await parseForm(request)
  const manifests = form.getAll('manifest')
  if (manifests.length !== 1 || typeof manifests[0] !== 'string' || new TextEncoder().encode(manifests[0]).length > MAX_MANIFEST) {
    throw new HttpError(400, 'INVALID_MANIFEST')
  }
  let manifest
  try { manifest = JSON.parse(manifests[0]) } catch { throw new HttpError(400, 'INVALID_MANIFEST') }
  if (!manifest || !SHA.test(manifest.expectedRevision || '') || !Array.isArray(manifest.items) ||
      Object.keys(manifest).some((key) => key !== 'expectedRevision' && key !== 'items')) throw new HttpError(400, 'INVALID_MANIFEST')

  const existingPaths = new Set()
  const uploads = new Map()
  let totalBytes = 0
  for (const item of manifest.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new HttpError(400, 'INVALID_MANIFEST')
    if (item.type === 'existing') {
      if (Object.keys(item).some((key) => !['type', 'path', 'sha'].includes(key)) || typeof item.path !== 'string' ||
          !SHA.test(item.sha || '') || existingPaths.has(item.path)) throw new HttpError(400, 'INVALID_MANIFEST')
      existingPaths.add(item.path)
    } else if (item.type === 'upload') {
      if (Object.keys(item).some((key) => !['type', 'uploadId'].includes(key)) || typeof item.uploadId !== 'string' ||
          !UPLOAD_ID.test(item.uploadId) || item.uploadId === 'manifest' || uploads.has(item.uploadId)) throw new HttpError(400, 'INVALID_MANIFEST')
      const files = form.getAll(item.uploadId)
      if (files.length !== 1 || typeof files[0] === 'string' || typeof files[0]?.arrayBuffer !== 'function') throw new HttpError(400, 'INVALID_UPLOAD')
      const file = files[0]
      totalBytes += file.size
      if (file.size > MAX_FILE || totalBytes > MAX_TOTAL || uploads.size >= MAX_UPLOADS) throw new HttpError(413, 'TOO_LARGE')
      const signature = new Uint8Array(await file.slice(0, PNG_SIGNATURE.length).arrayBuffer())
      if (signature.length !== PNG_SIGNATURE.length || !PNG_SIGNATURE.every((byte, index) => signature[index] === byte)) throw new HttpError(400, 'INVALID_PNG')
      uploads.set(item.uploadId, file)
    } else throw new HttpError(400, 'INVALID_MANIFEST')
  }
  for (const [key] of form.entries()) {
    if (key !== 'manifest' && !uploads.has(key)) throw new HttpError(400, 'INVALID_UPLOAD')
  }
  return { manifest, uploads }
}

async function githubJson(path, token, options = {}) {
  let response
  try {
    response = await fetch(`https://api.github.com${path}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
        'User-Agent': 'sarioglu-admin-worker', 'X-GitHub-Api-Version': '2022-11-28',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    })
  } catch { throw new HttpError(502, 'GITHUB_UNAVAILABLE') }
  if (!response.ok) {
    if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) throw new HttpError(429, 'RATE_LIMITED')
    throw new HttpError(502, 'GITHUB_UNAVAILABLE')
  }
  try { return await response.json() } catch { throw new HttpError(502, 'INVALID_GITHUB_RESPONSE') }
}

function categoryFiles(tree, category) {
  if (!Array.isArray(tree?.tree) || tree.truncated !== false) throw new HttpError(502, 'INCOMPLETE_TREE')
  const prefix = `${CATEGORY_ROOT}/${category}/`
  const files = new Map()
  for (const entry of tree.tree) {
    if (typeof entry?.path !== 'string' || !entry.path.startsWith(prefix)) continue
    if (!FILE_NAME.test(entry.path.slice(prefix.length)) || entry.type !== 'blob' || entry.mode !== '100644' || !SHA.test(entry.sha || '') || files.has(entry.path)) {
      throw new HttpError(409, 'INVALID_CATEGORY_CONTENT')
    }
    files.set(entry.path, entry.sha)
  }
  return files
}

async function publish(category, request, token) {
  const { manifest, uploads } = await parseDraft(request)
  const api = `/repos/${REPOSITORY}`
  const [repository, head] = await Promise.all([
    githubJson(api, token),
    githubJson(`${api}/commits/main`, token),
  ])
  if (!repository?.node_id || !SHA.test(head?.sha || '') || !SHA.test(head?.commit?.tree?.sha || '')) throw new HttpError(502, 'INVALID_GITHUB_RESPONSE')
  if (head.sha !== manifest.expectedRevision) throw new HttpError(409, 'CONFLICT')
  const current = categoryFiles(await githubJson(`${api}/git/trees/${head.commit.tree.sha}?recursive=1`, token), category)
  for (const item of manifest.items) {
    if (item.type === 'existing' && current.get(item.path) !== item.sha) throw new HttpError(409, 'CONFLICT')
  }

  const uploadShas = new Map()
  for (const [id, file] of uploads) {
    const content = Buffer.from(await file.arrayBuffer()).toString('base64')
    const blob = await githubJson(`${api}/git/blobs`, token, { method: 'POST', body: { content, encoding: 'base64' } })
    if (!SHA.test(blob?.sha || '')) throw new HttpError(502, 'INVALID_GITHUB_RESPONSE')
    uploadShas.set(id, blob.sha)
  }

  const desired = new Map(manifest.items.map((item, index) => [
    `${CATEGORY_ROOT}/${category}/${String(index + 1).padStart(2, '0')}.png`,
    item.type === 'existing' ? item.sha : uploadShas.get(item.uploadId),
  ]))
  const changes = []
  for (const [path, sha] of desired) {
    if (current.get(path) !== sha) changes.push({ path, mode: '100644', type: 'blob', sha })
  }
  for (const path of current.keys()) {
    if (!desired.has(path)) changes.push({ path, mode: '100644', type: 'blob', sha: null })
  }
  if (!changes.length) return json({ success: true, commitSha: head.sha, revision: head.sha, deploymentStatus: 'unchanged' })

  const tree = await githubJson(`${api}/git/trees`, token, { method: 'POST', body: { base_tree: head.commit.tree.sha, tree: changes } })
  if (!SHA.test(tree?.sha || '')) throw new HttpError(502, 'INVALID_GITHUB_RESPONSE')
  const commit = await githubJson(`${api}/git/commits`, token, {
    method: 'POST', body: { message: `Ürün fotoğrafları güncellendi: ${category}`, tree: tree.sha, parents: [manifest.expectedRevision] },
  })
  if (!SHA.test(commit?.sha || '')) throw new HttpError(502, 'INVALID_GITHUB_RESPONSE')

  const clientMutationId = crypto.randomUUID()
  const result = await githubJson('/graphql', token, {
    method: 'POST',
    body: {
      query: 'mutation UpdateRefs($input: UpdateRefsInput!) { updateRefs(input: $input) { clientMutationId } }',
      variables: { input: { repositoryId: repository.node_id, clientMutationId, refUpdates: [
        { name: 'refs/heads/main', beforeOid: manifest.expectedRevision, afterOid: commit.sha, force: false },
      ] } },
    },
  })
  if (result?.errors?.length || result?.data?.updateRefs?.clientMutationId !== clientMutationId) throw new HttpError(502, 'UPDATE_UNCERTAIN')
  return json({ success: true, commitSha: commit.sha, revision: commit.sha, deploymentStatus: 'pending' })
}

export default {
  async fetch(request, env) {
    try {
      const match = /^\/api\/categories\/([a-z-]+)\/publish$/.exec(new URL(request.url).pathname)
      if (!match || !CATEGORIES.has(match[1])) throw new HttpError(404, 'NOT_FOUND')
      if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405, { Allow: 'POST' })
      if (!env.GITHUB_API_KEY) throw new HttpError(503, 'CONFIGURATION_ERROR')
      return await publish(match[1], request, env.GITHUB_API_KEY)
    } catch (error) {
      return json({ error: { code: error instanceof HttpError ? error.code : 'INTERNAL_ERROR' } }, error instanceof HttpError ? error.status : 500)
    }
  },
}
