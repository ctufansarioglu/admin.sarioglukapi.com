import { css } from '@emotion/react'

export const layoutStyles = css`  .site-header { border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
  .header-inner { width: min(calc(100% - 40px), 1200px); min-height: 70px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 24px; }
  .header-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; min-width: 0; }
  .brand { display: inline-flex; flex-direction: column; gap: 4px; flex-shrink: 0; color: #171c19; text-decoration: none; line-height: 1.05; }
  .brand span { font-size: clamp(1.25rem, 2.1vw, 1.6rem); font-weight: 800; letter-spacing: -.035em; }
  .brand small { color: var(--color-accent); font-size: .72rem; font-weight: 700; letter-spacing: .09em; line-height: 1.3; }
  .header-title { display: inline-flex; align-items: center; gap: 9px; padding: 9px 12px; border: 1px solid var(--color-border); border-radius: 3px; background: #f8f8f7; }
  .header-title::before { content: ""; width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--color-accent); }
  .header-title h1 { font-size: .78rem; line-height: 1.25; letter-spacing: -.01em; font-weight: 650; white-space: nowrap; }

  .page { width: min(calc(100% - 40px), 1200px); margin: 0 auto; padding-bottom: 115px; }
  .info-banner { margin: 12px 0 0; padding: 12px 14px; background: #f3f3f1; color: var(--color-accent); font-size: .8rem; line-height: 1.55; }
  .info-banner p { max-width: 900px; }
  .info-banner span { display: block; margin-top: 5px; color: var(--color-muted); font-size: .73rem; }
  .catalog-share { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 0; }
  .catalog-share-feedback { max-width: 300px; font-size: .75rem; text-align: right; overflow-wrap: anywhere; }
  .catalog-share-feedback.error { color: #763e32; }
  .catalog-share-feedback a { color: inherit; text-decoration: underline; }
  .workspace { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 36px; }
  .sidebar { padding-top: 23px; }
  .sidebar-heading { margin-bottom: 9px; color: var(--color-muted); font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .category-link { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 12px 4px; border: 0; border-bottom: 1px solid var(--color-border); background: transparent; color: var(--color-muted); text-align: left; font-size: .86rem; }
  .category-link:hover, .category-link.active { color: var(--color-text); }
  .category-link.active { border-bottom-color: var(--color-accent); font-weight: 650; }
  .category-count { color: #858b84; font-size: .75rem; font-weight: 400; }
  .mobile-select { display: none; }

  .catalog { min-width: 0; padding-top: 20px; }
  .section-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 42px; }
  .category-title { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px 12px; min-width: 0; }
  .section-top h2 { font-size: 1.17rem; line-height: 1.3; letter-spacing: -.025em; font-weight: 650; }
  .section-top p { color: var(--color-muted); font-size: .78rem; white-space: nowrap; }
  .button { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 15px; border: 1px solid transparent; border-radius: 3px; font-size: .8rem; font-weight: 600; letter-spacing: -.01em; white-space: nowrap; transition: background 160ms ease, border-color 160ms ease, color 160ms ease; }
  .button-dark { border-color: #171c19; background: #171c19; color: var(--color-surface); }
  .button-dark:hover:not(:disabled) { border-color: var(--color-accent); background: var(--color-accent); }
  .add-icon { display: block; flex: none; margin-right: 7px; }
  .publish-actions .button-dark span { margin: 0 0 0 14px; font-size: .9rem; }
  .button-plain { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text); }
  .button-plain:hover:not(:disabled) { border-color: var(--color-text); background: #f3f3f1; }
  .catalog-tools { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; padding-top: 14px; border-top: 1px solid var(--color-border); }
  .catalog-tools p { max-width: 470px; color: var(--color-muted); font-size: .75rem; line-height: 1.45; }
  .catalog-tools > span { flex: none; color: #858b84; font-size: .72rem; }
  .gallery-area { position: relative; min-height: 180px; }
  .file-drop-overlay { position: absolute; z-index: 4; inset: 0; min-height: 180px; padding: 14px; border: 1px dashed #66796b; border-radius: 4px; background: rgba(243, 246, 242, .94); pointer-events: none; }
  .file-drop-content { position: sticky; top: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 190px; color: var(--color-accent); text-align: center; }
  .file-drop-content strong { font-size: 1rem; letter-spacing: -.02em; }
  .file-drop-content > span:last-child { color: var(--color-muted); font-size: .75rem; }
  .file-drop-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 4px; border: 1px solid #c8d1c8; border-radius: 50%; background: var(--color-surface); }
  .file-drop-icon svg { display: block; width: 20px; height: 20px; }
`
