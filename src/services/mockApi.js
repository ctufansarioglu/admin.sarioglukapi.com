import { categories, number } from '../lib/catalog.js'
import { ApiError } from './errors.js'

// Tamamen bellek içi örnek veriler: sunucu veya GitHub üzerinde işlem yapmaz.
let revision = 1
const sampleImages = import.meta.glob('../assets/mock/*/*.png', { eager: true, query: '?url', import: 'default' })
const data = Object.fromEntries(categories.map((category, c) => [category.id, Array.from({ length: [6, 4, 5, 3, 2][c] }, (_, i) => ({ id: `mock-${category.id}-${i}`, sha: `mock-${category.id}-${i}`, name: `${number(i)}.png`, path: `src/assets/images/categories/${category.id}/${number(i)}.png`, previewUrl: sampleImages[`../assets/mock/${category.id}/${number(i % 2)}.png`], size: 250000 }))]))
async function simulate(operation) {
  await new Promise((resolve) => setTimeout(resolve, 180))
  const error = new URLSearchParams(window.location.search).get('mockError')
  if ((error === 'read-images' || (error === 'refresh-after-publish' && revision > 1)) && operation === 'images') {
    throw new ApiError(503, 'Örnek ürün okuma hatası.')
  }
  if (/^\d+$/.test(error || '') && (['401', '403'].includes(error) || operation === 'publish')) {
    throw new ApiError(Number(error), ({ 401: 'Oturumunuz bulunamadı. Lütfen yeniden giriş yapın.', 403: 'Bu işlem için yetkiniz bulunmuyor.', 409: 'Ürünler siz düzenleme yaparken güncellenmiş. Değişikliklerinizi kontrol ederek yeniden deneyin.' })[error] || 'Örnek hata durumu.')
  }
}
export const mockApi = {
  me: async () => { await simulate('read'); return { email: 'ornek@sarioglukapi.com' } },
  shareCatalog: async () => {
    await simulate('share')
    const error = new URLSearchParams(window.location.search).get('mockError')
    if (error === 'share-catalog') throw new ApiError(403, 'Örnek paylaşım hatası.')
    if (error === 'share-catalog-uncertain') throw new ApiError(0, 'Örnek bağlantı kesintisi.')
    return { status: 'queued' }
  },
  images: async (id) => { await simulate('images'); return { category: id, revision: `mock-revision-${revision}`, images: data[id].map((item) => ({ ...item })) } },
  publish: async (id, expected, items) => {
    await simulate('publish')
    if (expected !== `mock-revision-${revision}`) throw new ApiError(409, 'Ürünler siz düzenleme yaparken güncellenmiş. Değişikliklerinizi kontrol ederek yeniden deneyin.')
    data[id] = await Promise.all(items.map(async (item, index) => ({ id: `mock-${revision}-${index}`, sha: `mock-${revision}-${index}`, name: `${number(index)}.png`, path: `src/assets/images/categories/${id}/${number(index)}.png`, previewUrl: item.type === 'upload' ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reader.onabort = () => reject(new ApiError(0, 'Fotoğraf okunamadı. Lütfen tekrar deneyin.')); reader.readAsDataURL(item.file) }) : item.previewUrl, size: item.size })))
    revision++
    if (new URLSearchParams(window.location.search).get('mockError') === 'publish-response-lost') {
      throw new ApiError(0, 'Örnek bağlantı kesintisi.')
    }
    return { success: true, commitSha: 'mock', revision: `mock-revision-${revision}`, deploymentStatus: 'pending' }
  },
}

