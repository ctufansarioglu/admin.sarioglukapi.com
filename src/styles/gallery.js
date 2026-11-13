import { css } from '@emotion/react'

export const galleryStyles = css`  .image-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 26px 16px; }
  .product { min-width: 0; }
  .product-image { position: relative; cursor: grab; user-select: none; display: flex; align-items: center; justify-content: center; overflow: hidden; aspect-ratio: 4 / 5; border: 1px solid var(--color-border); border-radius: 4px; background: #efefec; }
  .product-image img { width: 100%; height: 100%; object-fit: contain; }
  .product-image:active { cursor: grabbing; }
  .drag-overlay { pointer-events: none; }
  .drag-preview { width: 100%; height: 100%; padding: 6px; border: 1px solid #c5cec5; border-radius: 5px; background: var(--color-surface); box-shadow: 0 12px 28px rgba(23, 28, 25, .16); transform: rotate(1deg); }
  .drag-preview-image { overflow: hidden; width: 100%; aspect-ratio: 4 / 5; border-radius: 3px; background: #efefec; }
  .drag-preview-image img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .drag-preview-info { display: flex; justify-content: space-between; gap: 8px; padding: 10px 5px; font-size: .8rem; font-weight: 650; }
  .drag-preview-info span { color: var(--color-muted); font-size: .72rem; font-weight: 500; }
  .product-drag-source .product-image { opacity: .35; }
  .product-drag-source .product-info { opacity: .45; }
  .product-dropping .product-image { opacity: .55; }
  .image-index, .image-badge { position: absolute; top: 10px; padding: 6px 8px; background: var(--color-surface); color: var(--color-muted); font-size: .7rem; }
  .image-index { left: 10px; }
  .image-badge { right: 10px; z-index: 2; font-weight: 600; }
  .new-badge { background: var(--color-accent); color: var(--color-surface); }
  .deleted-badge { background: #763e32; color: var(--color-surface); }
  .product-deleted .product-image { cursor: default; }
  .product-deleted .product-image img { filter: grayscale(1); opacity: .55; }
  .deleted-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, .2); pointer-events: none; }
  .drag-cue { position: absolute; right: 10px; bottom: 10px; display: flex; align-items: center; gap: 5px; padding: 6px 8px; background: rgba(255,255,255,.94); color: var(--color-accent); font-size: 1rem; line-height: 1; opacity: 0; transition: opacity 150ms ease; }
  .drag-cue span { font-size: .7rem; font-weight: 600; }
  .product-image:hover .drag-cue, .product-image:focus-visible .drag-cue, .product-drag-source .drag-cue { opacity: 1; }
  .product-info { display: flex; justify-content: space-between; align-items: start; gap: 8px; padding-top: 13px; }
  .product-info > div { min-width: 0; }
  .product-info strong, .product-info span { display: block; }
  .product-info strong { font-size: .9rem; font-weight: 620; letter-spacing: -.01em; }
  .product-info span { max-width: 100%; margin-top: 5px; overflow: hidden; color: var(--color-muted); font-size: .72rem; text-overflow: ellipsis; white-space: nowrap; }
  .product-info > button { flex: none; padding: 4px; border: 0; background: none; color: var(--color-muted); font-size: .75rem; text-decoration: underline; text-underline-offset: 3px; }
  .product-info > button:hover { color: var(--color-text); }
  .product-info .restore { color: var(--color-accent); font-weight: 600; }
  .product-deleted .product-info strong { color: var(--color-muted); font-size: .8rem; }
  .move-actions { display: flex; gap: 10px; margin-top: 8px; }
  .move-actions button { padding: 4px 0; border: 0; background: none; color: var(--color-accent); font-size: .72rem; text-decoration: underline; text-underline-offset: 3px; }
  .move-actions button:hover:not(:disabled) { color: var(--color-text); }
`
