function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', ...headers } })
}

export default {
  async fetch(request, _env, ctx) {
    if (new URL(request.url).pathname !== '/api/me') return json({ error: { code: 'NOT_FOUND' } }, 404)
    if (request.method !== 'GET') return json({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405, { Allow: 'GET' })
    if (!ctx?.access) return json({ error: { code: 'UNAUTHORIZED' } }, 401)

    let identity
    try { identity = await ctx.access.getIdentity() } catch { return json({ error: { code: 'IDENTITY_UNAVAILABLE' } }, 503) }
    const email = typeof identity?.email === 'string' ? identity.email.trim() : ''
    if (!email) return json({ error: { code: 'UNAUTHORIZED' } }, 401)
    return json({ email })
  },
}
