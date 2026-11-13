const REPOSITORY = 'ctufansarioglu/sarioglukapi.com'
const CATEGORY_ROOT = 'src/assets/images/categories'
const CATEGORIES = new Set(['ahsap', 'amerikan-panel', 'lake', 'melamin', 'pvc'])
const SHA = /^[a-f0-9]{40}$/
const FILE_NAME = /^[0-9]+\.png$/

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

async function github(path, token) {
  let response
  try {
    response = await fetch(`https://api.github.com/repos/${REPOSITORY}${path}`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'sarioglu-admin-worker', 'X-GitHub-Api-Version': '2022-11-28' },
    })
  } catch { throw new HttpError(502, 'GITHUB_UNAVAILABLE') }
  if (!response.ok) {
    if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) throw new HttpError(429, 'RATE_LIMITED')
    if (response.status === 404) throw new HttpError(404, 'NOT_FOUND')
    throw new HttpError(502, 'GITHUB_UNAVAILABLE')
  }
  return response
}

async function githubJson(path, token) {
  const response = await github(path, token)
  try { return await response.json() } catch { throw new HttpError(502, 'INVALID_GITHUB_RESPONSE') }
}

async function listImages(category, token) {
  const commit = await githubJson('/commits/main', token)
  const revision = commit?.sha
  const treeSha = commit?.commit?.tree?.sha
  if (!SHA.test(revision || '') || !SHA.test(treeSha || '')) throw new HttpError(502, 'INVALID_GITHUB_RESPONSE')

  const tree = await githubJson(`/git/trees/${treeSha}?recursive=1`, token)
  if (!Array.isArray(tree?.tree) || tree.truncated !== false) throw new HttpError(502, 'INCOMPLETE_TREE')
  const prefix = `${CATEGORY_ROOT}/${category}/`
  const entries = tree.tree.filter((entry) => typeof entry?.path === 'string' && entry.path.startsWith(prefix))
  for (const entry of entries) {
    const name = entry.path.slice(prefix.length)
    if (!FILE_NAME.test(name) || entry.type !== 'blob' || entry.mode !== '100644' || !SHA.test(entry.sha || '') || !Number.isSafeInteger(entry.size) || entry.size < 0) {
      throw new HttpError(409, 'INVALID_CATEGORY_CONTENT')
    }
  }

  entries.sort((a, b) => {
    const left = BigInt(a.path.slice(prefix.length, -4))
    const right = BigInt(b.path.slice(prefix.length, -4))
    return left < right ? -1 : left > right ? 1 : a.path.localeCompare(b.path)
  })
  const images = entries.map((entry) => {
    const name = entry.path.slice(prefix.length)
    return { id: entry.sha, name, path: entry.path, sha: entry.sha, size: entry.size, previewUrl: `https://raw.githubusercontent.com/${REPOSITORY}/${revision}/${entry.path}` }
  })
  return json({ category, revision, images })
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      const match = /^\/api\/category-images\/([a-z-]+)$/.exec(url.pathname)
      if (!match || !CATEGORIES.has(match[1])) throw new HttpError(404, 'NOT_FOUND')
      if (request.method !== 'GET') return json({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405, { Allow: 'GET' })
      if (!env.GITHUB_API_KEY) throw new HttpError(503, 'CONFIGURATION_ERROR')
      return await listImages(match[1], env.GITHUB_API_KEY)
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500
      return json({ error: { code: error instanceof HttpError ? error.code : 'INTERNAL_ERROR' } }, status)
    }
  },
}
