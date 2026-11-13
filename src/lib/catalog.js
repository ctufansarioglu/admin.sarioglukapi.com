export const categories = [
  { id: 'ahsap', name: 'Ahşap Doğrama Kapılar', short: 'Ahşap Doğrama', code: 'AD' },
  { id: 'amerikan-panel', name: 'Amerikan Panel Kapılar', short: 'Amerikan Panel', code: 'AP' },
  { id: 'lake', name: 'Lake Kapılar', short: 'Lake', code: 'LK' },
  { id: 'melamin', name: 'Melamin Kapılar', short: 'Melamin', code: 'ML' },
  { id: 'pvc', name: 'PVC Kapılar', short: 'PVC', code: 'PVC' },
]
export const number = (index) => String(index + 1).padStart(2, '0')
export const activeItems = (items) => items.filter((item) => !item.deleted)
export function move(items, from, to) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items
  const next = [...items]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}
export function changeCount(original, items) {
  const originalIds = original.map((item) => item.key)
  const currentExisting = items.filter((item) => item.type === 'existing').map((item) => item.key)
  const currentIds = new Set(currentExisting)
  const removed = originalIds.filter((id) => !currentIds.has(id)).length
  const added = items.length - currentExisting.length
  const retainedOrder = originalIds.filter((id) => currentIds.has(id))
  const reordered = retainedOrder.some((id, index) => currentExisting[index] !== id)
  return removed + added + (reordered ? 1 : 0)
}
export function validateFiles(files, currentBytes, maxFile, maxTotal) {
  let total = currentBytes
  const accepted = [], errors = []
  for (const file of files) {
    if (!/\.png$/i.test(file.name) || (file.type && file.type !== 'image/png')) { errors.push(`${file.name}: yalnızca PNG dosyaları eklenebilir.`); continue }
    if (file.size > maxFile) { errors.push(`${file.name}: dosya boyutu sınırı aşıldı.`); continue }
    if (total + file.size > maxTotal) { errors.push(`${file.name}: toplam yükleme sınırı aşıldı.`); continue }
    total += file.size; accepted.push(file)
  }
  return { accepted, errors }
}

export function createManifest(expectedRevision, items) {
  return { expectedRevision, items: activeItems(items).map((item) => item.type === 'existing' ? { type: 'existing', path: item.path, sha: item.sha } : { type: 'upload', uploadId: item.uploadId }) }
}
