import { activeItems, createManifest } from '../lib/catalog.js'
import { ApiError } from './errors.js'

const messages = {
  400: 'İstek geçerli değil. Lütfen seçiminizi kontrol edin.',
  401: 'Oturumunuz bulunamadı. Lütfen yeniden giriş yapın.',
  403: 'Bu işlem için yetkiniz bulunmuyor.',
  404: 'İstenen kategori bulunamadı.',
  409: 'Ürünler siz düzenleme yaparken güncellenmiş. Değişikliklerinizi kontrol ederek yeniden deneyin.',
  413: 'Fotoğraflar yükleme boyutu sınırını aşıyor.',
  429: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.',
  500: 'Bir sunucu hatası oluştu. Lütfen tekrar deneyin.',
  502: 'Ürünlere şu anda ulaşılamıyor. Lütfen tekrar deneyin.',
  503: 'Hizmet şu anda kullanılamıyor. Lütfen tekrar deneyin.',
}

const invalid = () => new ApiError(0, 'Ürün bilgileri okunamadı. Lütfen tekrar deneyin.')
export const isAmbiguousPublishError = (error) => !error || error.status === 0 || error.status >= 500 || error.status == null

export function validateIdentity(result) {
  if (typeof result?.email !== 'string' || !result.email.trim()) throw invalid()
  return result
}

export function validateImages(result, category, { origin, base = '/api', mock = false }) {
  let apiUrl
  try { apiUrl = new URL(base, origin) } catch { throw invalid() }
  if (apiUrl.origin !== origin || result?.category !== category || typeof result.revision !== 'string' || !result.revision || !Array.isArray(result.images)) throw invalid()
  const prefix = `${apiUrl.pathname.replace(/\/$/, '')}/`
  const paths = new Set()
  for (const image of result.images) {
    if (!image || typeof image.path !== 'string' || !image.path || typeof image.sha !== 'string' || !image.sha || typeof image.previewUrl !== 'string') throw invalid()
    if (paths.has(image.path)) throw invalid()
    paths.add(image.path)
    if (mock && (image.previewUrl.startsWith('data:image/') || image.previewUrl.startsWith('/src/assets/mock/'))) continue
    const categoryPrefix = `src/assets/images/categories/${category}/`
    if (/^[a-f0-9]{40}$/.test(result.revision) && image.path.startsWith(categoryPrefix) &&
        /^[0-9]+\.png$/.test(image.path.slice(categoryPrefix.length)) &&
        image.previewUrl === `https://raw.githubusercontent.com/ctufansarioglu/sarioglukapi.com/${result.revision}/${image.path}`) continue
    try {
      const url = new URL(image.previewUrl, origin)
      if (url.origin !== origin || !url.pathname.startsWith(prefix)) throw invalid()
    } catch { throw invalid() }
  }
  return result
}

export function createApiClient({ origin, base = '/api', fetcher = globalThis.fetch }) {
  const apiBase = base.replace(/\/$/, '')
  async function request(path, options = {}) {
    let response
    try {
      if (new URL(apiBase, origin).origin !== origin) throw new Error('cross-origin API')
      response = await fetcher(`${apiBase}${path}`, {
        credentials: 'same-origin', cache: 'no-store', ...options,
        headers: { Accept: 'application/json', ...options.headers },
      })
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      throw new ApiError(0, 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.')
    }
    if (!response.ok) throw new ApiError(response.status, messages[response.status] || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError(0, 'Beklenmeyen sunucu yanıtı alındı. Oturumunuzu kontrol edin.')
    try { return await response.json() } catch { throw new ApiError(0, 'Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.') }
  }
  return {
    me: async (options) => validateIdentity(await request('/me', options)),
    images: async (category, options) => validateImages(await request(`/category-images/${encodeURIComponent(category)}`, options), category, { origin, base }),
    publish: (category, revision, items) => {
      const form = new FormData()
      form.append('manifest', JSON.stringify(createManifest(revision, items)))
      activeItems(items).filter((item) => item.type === 'upload').forEach((item) => form.append(item.uploadId, item.file, item.file.name))
      return request(`/categories/${encodeURIComponent(category)}/publish`, { method: 'POST', body: form })
    },
  }
}
