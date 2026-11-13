const DISPATCH_URL = 'https://api.github.com/repos/ctufansarioglu/sarioglukapi.com/actions/workflows/deploy.yml/dispatches'

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', ...headers } })
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/catalog/share') return json({ error: { code: 'NOT_FOUND' } }, 404)
    if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405, { Allow: 'POST' })
    if (!env.GITHUB_API_KEY) return json({ error: { code: 'CONFIGURATION_ERROR' } }, 503)

    let response
    try {
      response = await fetch(DISPATCH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'sarioglu-admin-worker',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ ref: 'main', inputs: { send_catalog: 'true' } }),
      })
    } catch { return json({ error: { code: 'DISPATCH_UNCERTAIN' } }, 502) }

    if (response.status === 204) return json({ status: 'queued' }, 202)
    if (response.status === 200) {
      let result
      try { result = await response.json() } catch { return json({ error: { code: 'DISPATCH_UNCERTAIN' } }, 502) }
      if (Number.isSafeInteger(result?.workflow_run_id) && result.workflow_run_id > 0) return json({ status: 'queued' }, 202)
      return json({ error: { code: 'DISPATCH_UNCERTAIN' } }, 502)
    }
    if (response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')) {
      return json({ error: { code: 'RATE_LIMITED' } }, 429)
    }
    if (response.status >= 400 && response.status < 500) return json({ error: { code: 'DISPATCH_REJECTED' } }, 422)
    return json({ error: { code: 'DISPATCH_UNCERTAIN' } }, 502)
  },
}
