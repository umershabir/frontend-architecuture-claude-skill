# Frontend starter

Framework-free immersive site: SPA page transitions, virtual smooth scroll, `data-animation` DOM effects,
an OGL WebGL layer positioned by DOM placeholders, Pug + SCSS, content from JSON — no backend.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ with one index.html per route (static hosting, no rewrites needed)
npm run preview
```

- Content: `content/site.json` (sample images come from picsum.photos; replace with files in `public/images/`).
- Markup: `views/` · Styles: `styles/` · App: `app/`.
- Add a page / animation / WebGL scene: see the `frontend-architecture` skill's `references/recipes.md`.
