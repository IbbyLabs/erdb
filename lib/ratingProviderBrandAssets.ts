const SVG_DATA_URI_PREFIX = 'data:image/svg+xml;charset=utf-8,';

const buildSvgDataUri = (svg: string) =>
  `${SVG_DATA_URI_PREFIX}${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

export const METACRITIC_LOGO_DATA_URI = buildSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="metacritic-ring" x1="12%" y1="10%" x2="86%" y2="88%">
        <stop offset="0%" stop-color="#ffd863"/>
        <stop offset="100%" stop-color="#f6b60e"/>
      </linearGradient>
    </defs>
    <circle cx="48" cy="48" r="43" fill="url(#metacritic-ring)"/>
    <circle cx="48" cy="48" r="31" fill="#2f2f31"/>
    <text
      x="49"
      y="64"
      text-anchor="middle"
      font-family="'Arial Black','Noto Sans',Arial,sans-serif"
      font-size="54"
      font-weight="900"
      fill="#ffffff"
    >m</text>
  </svg>
`);

export const TRAKT_LOGO_DATA_URI = buildSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="trakt-surface" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff0037"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="88" height="88" rx="21" fill="url(#trakt-surface)"/>
    <g
      fill="none"
      stroke="#ffffff"
      stroke-width="6.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M22 21h43"/>
      <path d="M22 21c-7.7 0-12 5.1-12 12.8V74"/>
      <path d="M81 31v39c0 7.2-4.8 12-12 12h-4"/>
      <path d="M31 43 44 56"/>
      <path d="M36 38 49 51"/>
      <path d="M45 62 55 52 82 25"/>
      <path d="M55 62 87 30"/>
    </g>
  </svg>
`);
