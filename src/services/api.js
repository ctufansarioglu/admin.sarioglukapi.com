import { createApiClient, validateIdentity, validateImages } from './client.js'

const base = import.meta.env.VITE_API_BASE_URL || '/api'
export const useMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false'
const realApi = createApiClient({ origin: window.location.origin, base })
const mockApiPromise = useMock ? import('./mockApi.js').then((module) => module.mockApi) : null

export const api = useMock ? {
  me: (...args) => mockApiPromise.then((mock) => mock.me(...args)).then(validateIdentity),
  shareCatalog: (...args) => mockApiPromise.then((mock) => mock.shareCatalog(...args)),
  images: (category, ...args) => mockApiPromise.then((mock) => mock.images(category, ...args))
    .then((result) => validateImages(result, category, { origin: window.location.origin, base, mock: true })),
  publish: (...args) => mockApiPromise.then((mock) => mock.publish(...args)),
} : realApi
