import { css } from '@emotion/react'

export const baseStyles = css`
  :root {
    --color-text: #181a18;
    --color-muted: #666963;
    --color-accent: #29342e;
    --color-border: #dedfdb;
    --color-surface: #fff;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--color-text);
    background: var(--color-surface);
    font-synthesis: none;
    -webkit-font-smoothing: antialiased;
  }
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
  button, select, input { font: inherit; }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: .42; }
  button:focus-visible, select:focus-visible, a:focus-visible, .product-image:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
  a { color: inherit; }
  h1, h2, h3, p { margin: 0; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .skip-link { position: fixed; top: 8px; left: 8px; z-index: 10; padding: 10px; background: var(--color-surface); transform: translateY(-150%); }
  .skip-link:focus { transform: translateY(0); }

`
