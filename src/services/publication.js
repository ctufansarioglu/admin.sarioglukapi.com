import { isAmbiguousPublishError } from './client.js'

// A failed response cannot establish whether the Worker committed the request.
export async function publishDraft(api, category, revision, items) {
  try {
    const result = await api.publish(category, revision, items)
    if (result?.success !== true || typeof result.revision !== 'string' || !result.revision) {
      throw new Error('Kayıt sonucu doğrulanamadı.')
    }
    try {
      return { kind: 'saved', fresh: await api.images(category) }
    } catch {
      return { kind: 'saved-unrefreshed' }
    }
  } catch (error) {
    return { kind: isAmbiguousPublishError(error) ? 'uncertain' : 'rejected', error }
  }
}
