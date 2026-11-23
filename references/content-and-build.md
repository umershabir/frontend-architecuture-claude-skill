# Content, templates and build (no backend)

## The document contract
The frontend needs exactly one thing from "the server": an HTML document that
1. contains markup for **every** page plus preloader and navigation,
2. sets `html.phone|tablet|desktop` before first paint (inline script),
3. is served for every route (SPA fallback or one copy per route),
4. loads the bundle as a module.
Anything that produces this — the starter's Vite plugin, a static generator, a CMS build hook — works.

## How the starter renders it
`vite.config.js` registers a plugin whose `transformIndexHtml` (order `pre`) returns
`scripts/render-site.js#renderSite(root)`: `views/index.pug` rendered with `content/site.json` as locals.
Vite then processes the returned HTML (bundles the module script, injects CSS). In dev, edits under
`views/` or `content/` trigger a full reload. On build, `closeBundle` copies `dist/index.html` to
`dist/<route>/index.html` for each entry in `content.routes`, so any static host works without rewrites.

## Content model (`content/site.json`)
```json
{
  "routes": ["/", "/about"],
  "meta": { "lang", "title", "description" },
  "preloader": { "title" },
  "navigation": [{ "label", "href" }],
  "pages": { "<id>": { "metaTitle", "background", "color", ...page fields } }
}
```
Conventions: page colors live in content (they drive the transition color and `<html>` colors); image fields
hold URLs used verbatim as texture keys; rich text is pre-rendered HTML strings used with `!=` in Pug.

## Plugging in a CMS
Replace `loadContent(root)` with an async fetch at build time (make `renderSite` async — Vite awaits
`transformIndexHtml` handlers), mapping the CMS response onto the content model above so templates
don't change. Keep tokens in `.env` (gitignored) and read them only in Node scripts — never ship them to the client.
Rebuild on CMS publish via a webhook → CI build.

## Images
- Local: put files in `public/images/` and reference `/images/x.jpg` — same-origin, no CORS.
- Remote: the host must send `Access-Control-Allow-Origin`, because textures load with `crossOrigin = 'anonymous'`.
- Keep URLs identical between content and markup; the texture map is keyed by the exact string.

## Hosting
- Built output is static. Either rely on the per-route copies or configure SPA fallback
  (Netlify `/* /index.html 200`, Vercel rewrites, nginx `try_files $uri /index.html`).
- `vite preview` and `vite dev` already fall back to `index.html`.

## Templates
- `views/index.pug`: document, inline device script, includes partials and every page, module script.
- One file per page in `views/pages/`; root element = BEM block with `data-title`, `data-background`, `data-color`.
- Swapping Pug for another engine (Nunjucks, Handlebars, plain JS template literals) only touches
  `scripts/render-site.js` and `views/`.

## Scaling beyond one document
When the single document gets heavy (>~10 pages or many images), render one HTML per route (same layout,
only that page's markup) and switch App navigation to fetch-and-swap (architecture.md §9). Preload textures
per route instead of globally.
