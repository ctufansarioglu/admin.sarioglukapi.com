import { move } from './catalog.js'

export const emptyDraft = { items: [], original: [], revision: '', lock: '' }

export function draftReducer(state, action) {
  switch (action.type) {
    case 'snapshot': {
      const items = action.snapshot.images.map((image) => ({ ...image, type: 'existing', key: `existing:${image.path}` }))
      return { items, original: items, revision: action.snapshot.revision, lock: '' }
    }
    case 'reset': return emptyDraft
    case 'add': return action.items.length ? { ...state, items: [...state.items, ...action.items] } : state
    case 'toggle': return { ...state, items: state.items.map((item) => item.key === action.key ? { ...item, deleted: !item.deleted } : item) }
    case 'move': {
      const items = move(state.items, state.items.findIndex((item) => item.key === action.key), action.to)
      return items === state.items ? state : { ...state, items }
    }
    case 'discard': return { ...state, items: state.original }
    case 'lock': return { ...state, lock: action.lock }
    default: return state
  }
}
