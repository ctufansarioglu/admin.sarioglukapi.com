import { categories } from '../lib/catalog.js'
import { memo } from 'react'

function Sidebar({ selected, counts, onSelect, disabled }) {
  return <>
    <aside className="sidebar">
      <div className="sidebar-heading">Kategoriler</div>
      <nav aria-label="Kategoriler">
        {categories.map((category) => <button
          key={category.id}
          type="button"
          className={`category-link ${category.id === selected ? 'active' : ''}`}
          aria-current={category.id === selected ? 'page' : undefined}
          onClick={() => onSelect(category.id)}
          disabled={disabled}
        >
          <span>{category.short}</span><span className="category-count">{counts[category.id] ?? '—'}</span>
        </button>)}
      </nav>
    </aside>
    <div className="mobile-select">
      <label htmlFor="category">Kategori</label>
      <select id="category" value={selected} onChange={(event) => onSelect(event.target.value)} disabled={disabled}>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name} ({counts[category.id] ?? '—'})</option>)}
      </select>
    </div>
  </>
}

export default memo(Sidebar)
