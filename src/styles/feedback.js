import { css } from '@emotion/react'

export const feedbackStyles = css`  .empty-state { padding: 65px 15px; border-bottom: 1px solid var(--color-border); text-align: center; }
  .empty-symbol { color: var(--color-muted); font-size: 1.8rem; }
  .empty-state h3 { margin: 10px 0; font-size: 1.35rem; font-weight: 620; letter-spacing: -.025em; }
  .empty-state p { color: var(--color-muted); font-size: .85rem; }
  .message { display: block; margin-bottom: 20px; padding: 13px 15px; font-size: .8rem; line-height: 1.5; }
  .message.error { background: #f7eae7; color: #763e32; }
  .message.success { background: #eaf0e9; color: var(--color-accent); }
  .message button { border: 0; background: none; color: inherit; font-weight: 700; text-decoration: underline; }
  .confirm-dialog { width: min(440px, calc(100% - 32px)); max-height: calc(100% - 32px); margin: auto; padding: 0; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); color: var(--color-text); box-shadow: 0 18px 55px rgba(23, 28, 25, .18); overscroll-behavior: contain; }
  .confirm-dialog::backdrop { background: rgba(23, 28, 25, .48); }
  .confirm-content { padding: 28px; }
  .confirm-kicker { display: block; color: var(--color-muted); font-size: .68rem; font-weight: 700; letter-spacing: .1em; }
  .confirm-content h2 { margin-top: 12px; font-size: 1.35rem; font-weight: 650; letter-spacing: -.035em; line-height: 1.2; }
  .confirm-content p { margin-top: 14px; color: var(--color-muted); font-size: .86rem; line-height: 1.6; }
  .confirm-content p strong { color: var(--color-text); }
  .confirm-content .confirm-note { padding-top: 14px; border-top: 1px solid var(--color-border); font-size: .78rem; }
  .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
  .publish-bar { position: fixed; z-index: 5; right: 0; bottom: 0; left: 0; border-top: 1px solid var(--color-border); background: var(--color-surface); }
  .publish-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; width: min(calc(100% - 40px), 1200px); margin: 0 auto; padding: 10px 0; }
  .draft-status { display: flex; align-items: center; gap: 12px; }
  .status-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: #879587; }
  .status-dot.changed { background: var(--color-accent); }
  .draft-status strong, .draft-status small { display: block; }
  .draft-status strong { font-size: .8rem; }
  .draft-status small { margin-top: 5px; color: var(--color-muted); font-size: .72rem; }
  .publish-actions { display: flex; gap: 8px; }
`
