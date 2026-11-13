import { css } from '@emotion/react'

export const responsiveStyles = css`  @media (hover: none) { .drag-cue { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .drag-cue { transition: none; } .drag-preview { transform: none; } }
  @media (max-width: 900px) {
    .workspace { grid-template-columns: 1fr; gap: 0; }
    .sidebar { display: none; }
    .mobile-select { display: flex; align-items: center; gap: 12px; padding-top: 18px; }
    .mobile-select label { display: block; flex: none; color: var(--color-muted); font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    .mobile-select select { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 3px; background: var(--color-surface); color: var(--color-text); }
    .catalog { padding-top: 18px; }
  }
  @media (max-width: 640px) {
    .header-inner, .page, .publish-inner { width: calc(100% - 28px); }
    .header-inner { gap: 18px; padding: 10px 0; }
    .header-actions { flex-direction: column; align-items: flex-end; gap: 6px; }
    .catalog-share { max-width: min(230px, calc(100vw - 150px)); }
    .catalog-share .button { min-height: 34px; padding: 0 10px; font-size: .72rem; }
    .brand span { font-size: 1.15rem; }
    .brand small { font-size: .59rem; }
    .header-title { gap: 7px; padding: 8px 10px; }
    .header-title h1 { font-size: .72rem; }
    .page { padding-bottom: 150px; }
    .section-top { align-items: center; }
    .section-top .button { flex: none; padding: 0 10px; font-size: .76rem; }
    .category-title { display: block; }
    .section-top h2 { font-size: 1rem; }
    .section-top p { margin-top: 3px; }
    .catalog-tools { align-items: flex-start; gap: 8px; }
    .catalog-tools > span { display: none; }
    .image-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 25px 12px; }
    .confirm-content { padding: 22px; }
    .confirm-actions .button { flex: 1; }
    .publish-inner { display: block; padding: 10px 0; }
    .publish-actions { margin-top: 10px; }
    .publish-actions .button { flex: 1; padding: 0 8px; font-size: .72rem; }
    .draft-status small { display: none; }
  }
`
