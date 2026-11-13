import test from 'node:test'
import assert from 'node:assert/strict'
import { activeItems, move, changeCount, validateFiles, createManifest } from '../src/lib/catalog.js'
const existing = (key) => ({ key, type: 'existing' })
const initial = ['a','b','c'].map(existing)
test('ilk ve son sıraya taşıma, boş ve tek görsel', () => {
  assert.deepEqual(move(initial, 2, 0).map((x) => x.key), ['c','a','b'])
  assert.deepEqual(move(initial, 0, 2).map((x) => x.key), ['b','c','a'])
  assert.deepEqual(move([], 0, 0), [])
  assert.deepEqual(move([existing('a')], 0, 1), [existing('a')])
})
test('silme, ekleme, sıralama ve iptal edilmiş taslak sayılır', () => {
  assert.equal(changeCount(initial, [initial[2]]), 2)
  assert.equal(changeCount(initial, []), 3)
  assert.equal(changeCount(initial, [initial[0], { key: 'new', type: 'upload' }, initial[1], initial[2]]), 1)
  assert.equal(changeCount(initial, move(initial, 2, 0)), 1)
  assert.equal(changeCount(initial, [...initial]), 0)
})
test('çok sayıda görsel sırası korunur', () => { const many = Array.from({length: 150}, (_, i) => existing(String(i))); assert.equal(move(many, 149, 0)[0].key, '149') })
test('PNG türü, tek dosya ve toplam limit denetlenir', () => {
  const result = validateFiles([{name:'a.jpg',type:'image/jpeg',size:1},{name:'b.png',type:'image/png',size:11},{name:'c.png',type:'image/png',size:6},{name:'d.png',type:'image/png',size:5}], 0, 10, 10)
  assert.deepEqual(result.accepted.map((x) => x.name), ['c.png']); assert.equal(result.errors.length, 3)
})

test('manifest silinenleri atlar, kaynak yol ve sırayı korur, yeni dosyayı bağlar', () => {
  const items = [{type:'existing',path:'category/03.png',sha:'sha3'}, {type:'upload',uploadId:'upload-1'}, {type:'existing',path:'category/01.png',sha:'sha1'}]
  assert.deepEqual(createManifest('rev', items), {expectedRevision:'rev',items:[{type:'existing',path:'category/03.png',sha:'sha3'},{type:'upload',uploadId:'upload-1'},{type:'existing',path:'category/01.png',sha:'sha1'}]})
  assert.deepEqual(createManifest('rev', []).items, [])
})

test('silinmek üzere işaretlenen görseller taslakta kalır ama yayına girmez', () => {
  const items = [
    { key: 'a', type: 'existing', path: 'category/01.png', sha: 'sha1', deleted: true },
    { key: 'new', type: 'upload', uploadId: 'upload-1', deleted: true },
    { key: 'b', type: 'existing', path: 'category/02.png', sha: 'sha2' },
  ]
  assert.deepEqual(activeItems(items).map((item) => item.key), ['b'])
  assert.deepEqual(createManifest('rev', items).items, [{ type: 'existing', path: 'category/02.png', sha: 'sha2' }])
  assert.deepEqual(createManifest('rev', [{ ...items[0], deleted: false }]).items, [{ type: 'existing', path: 'category/01.png', sha: 'sha1' }])
  assert.equal(items.length, 3)
})

test('silinmiş görsellerin arasından taşınan yeni fotoğraf yayına doğru sırada girer', () => {
  const items = [
    { key: 'a', type: 'existing', path: 'category/01.png', sha: 'sha1' },
    { key: 'b', type: 'existing', path: 'category/02.png', sha: 'sha2', deleted: true },
    { key: 'c', type: 'existing', path: 'category/03.png', sha: 'sha3' },
    { key: 'new', type: 'upload', uploadId: 'upload-1' },
  ]
  const sorted = move(items, 3, 1)
  assert.deepEqual(createManifest('rev', sorted).items, [
    { type: 'existing', path: 'category/01.png', sha: 'sha1' },
    { type: 'upload', uploadId: 'upload-1' },
    { type: 'existing', path: 'category/03.png', sha: 'sha3' },
  ])
  assert.equal(sorted[2].deleted, true)
})

test('aynı blob farklı yollarda bağımsız kayıt olarak yayınlanır', () => {
  const items = [
    { type: 'existing', path: 'category/01.png', sha: 'same' },
    { type: 'existing', path: 'category/02.png', sha: 'same' },
  ]
  assert.deepEqual(createManifest('rev', items).items, items)
})

test('silme, geri alma ve ekleme sınırları taslağın sırasını korur', () => {
  const deleted = { ...initial[1], deleted: true }
  assert.equal(changeCount(initial, activeItems([initial[0], deleted, initial[2]])), 1)
  assert.equal(changeCount(initial, activeItems([initial[0], { ...deleted, deleted: false }, initial[2]])), 0)
  assert.equal(validateFiles([{ name: 'x.PNG', type: '', size: 10 }], 0, 10, 10).accepted.length, 1)
})
