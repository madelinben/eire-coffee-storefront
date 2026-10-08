// Renders the share card (og-default.png) and touch icon from the brand palette and the self-hosted Fraunces font.
// Run `pnpm images:brand` after changing the palette or wordmark. Needs the Playwright Chromium browser.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const SAGE = '#8e926d';
const INK = '#2f3517';
const CREMA = '#c6a15f';
// Inlined: a page set with setContent cannot load file:// fonts.
const font = `data:font/woff2;base64,${readFileSync('src/assets/fonts/fraunces-latin-wght-normal.woff2').toString('base64')}`;

const leaf = (angle) => `<path transform="rotate(${angle})" d="M0 -2 C-3 -12 -24 -16 -24 -30 C-24 -42 -8 -44 0 -32 C8 -44 24 -42 24 -30 C24 -16 3 -12 0 -2Z"/>`;
const shamrock = (color, size) => `<svg viewBox="-50 -50 100 110" width="${size}" style="color:${color}"><g fill="currentColor">${[0, 120, 240].map(leaf).join('')}</g><path d="M0 6 Q4 26 -3 40" stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;
const lighthouse = `<svg viewBox="0 0 400 480" height="560" style="color:${INK}"><path d="M200 150 L440 60 L440 240 Z" fill="${CREMA}" opacity=".55"/><g fill="currentColor"><circle cx="200" cy="84" r="7"/><rect x="198" y="84" width="4" height="14"/><path d="M166 134 Q200 92 234 134Z"/><rect x="170" y="134" width="60" height="38"/><rect x="146" y="168" width="108" height="7"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((p) => `<rect x="${148 + p * 14}" y="175" width="4" height="16"/>`).join('')}<rect x="146" y="191" width="108" height="10"/><path d="M160 201 H240 L268 428 H132Z"/><path d="M40 470 L84 440 L128 427 L170 438 L212 424 L258 432 L304 446 L360 470Z"/></g><g fill="${SAGE}"><rect x="188" y="141" width="24" height="26" rx="2"/><rect x="186" y="250" width="28" height="44" rx="14"/><path d="M180 428 V392 Q200 366 220 392 V428Z"/></g></svg>`;

const page = (body) => `<style>@font-face{font-family:F;src:url(${font});font-weight:100 900}body{margin:0;font-family:F,serif}</style>${body}`;
const card = page(`<div style="width:1200px;height:630px;background:${SAGE};display:flex;align-items:center;justify-content:space-between;padding:0 90px 0 100px;box-sizing:border-box;overflow:hidden">
  <div style="color:${INK}"><div style="display:flex;align-items:center;gap:26px">${shamrock(INK, 84)}<span style="font-size:150px;font-weight:600;letter-spacing:-4px;line-height:1">éire</span></div>
  <div style="font:600 26px system-ui,sans-serif;letter-spacing:.42em;margin:18px 0 0 112px">COFFEE CO.</div>
  <div style="font-size:50px;white-space:nowrap;margin-top:70px;color:#1f2410">Good coffee. Great craic.</div>
  <div style="font:600 22px system-ui,sans-serif;letter-spacing:.16em;white-space:nowrap;margin-top:26px">MOBILE COFFEE TRAILER · CHESTER</div></div>${lighthouse}</div>`);
const icon = page(`<div style="width:180px;height:180px;background:${INK};display:flex;align-items:center;justify-content:center">${shamrock(CREMA, 112)}</div>`);

const browser = await chromium.launch();
for (const [html, width, height, out] of [[card, 1200, 630, 'public/og-default.png'], [icon, 180, 180, 'public/apple-touch-icon.png']]) {
  const tab = await browser.newPage({ viewport: { width, height } });
  await tab.setContent(html);
  await tab.evaluate('document.fonts.ready');
  await tab.screenshot({ path: out });
  await tab.close();
}
await browser.close();

writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${INK}"/><g transform="translate(50 46) scale(.78)" fill="${CREMA}">${[0, 120, 240].map(leaf).join('')}<path d="M0 6 Q4 26 -3 40" stroke="${CREMA}" stroke-width="5" stroke-linecap="round" fill="none"/></g></svg>\n`,
);
console.log('Wrote public/og-default.png, public/apple-touch-icon.png and public/favicon.svg');
