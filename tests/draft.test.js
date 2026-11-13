import test from 'node:test'
import assert from 'node:assert/strict'
import { draftReducer, emptyDraft } from '../src/lib/draft.js'
import { activeItems, changeCount, createManifest } from '../src/lib/catalog.js'

test('taslak geçişleri görsel kimliğini, yayın sırasını ve snapshotı korur', () => {
  const images = [
    { path: 'category/01.png', sha: 'same', name: '01.png' },
    { path: 'category/02.png', sha: 'same', name: '02.png' },
  ]
  let draft = draftReducer(emptyDraft, { type: 'snapshot', snapshot: { images, revision: 'r1' } })
  const [first, second] = draft.items
  assert.notEqual(first.key, second.key)
  assert.equal(draftReducer(emptyDraft, { type: 'snapshot', snapshot: { images: [...images].reverse(), revision: 'r2' } }).items[1].key, first.key)
  const upload = { key: 'upload-1', type: 'upload', uploadId: 'upload-1' }
  draft = draftReducer(draft, { type: 'add', items: [upload] })
  draft = draftReducer(draft, { type: 'toggle', key: first.key })
  draft = draftReducer(draft, { type: 'move', key: upload.key, to: 1 })
  assert.deepEqual(createManifest(draft.revision, draft.items).items, [
    { type: 'upload', uploadId: 'upload-1' },
    { type: 'existing', path: second.path, sha: second.sha },
  ])
  assert.equal(changeCount(draft.original, activeItems(draft.items)), 2)
  draft = draftReducer(draft, { type: 'discard' })
  assert.deepEqual(draft.items, [first, second])
  assert.equal(draft.revision, 'r1')
  draft = draftReducer(draft, { type: 'lock', lock: 'uncertain' })
  draft = draftReducer(draft, { type: 'snapshot', snapshot: { images: [images[1]], revision: 'r2' } })
  assert.equal(draft.lock, '')
  assert.equal(draft.items[0].key, second.key)
  assert.equal(draft.revision, 'r2')
})
