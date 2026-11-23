---
name: frontend-architecture
description: Set up, restructure or extend the frontend architecture of an immersive, animation-heavy website (portfolio, studio, showcase, campaign, product/lookbook) — a framework-free class-based app shell with SPA page transitions, virtual smooth scroll, data-attribute–driven DOM animations, a WebGL layer (OGL) whose meshes are positioned by DOM placeholders, preloaded textures, GSAP, Pug + SCSS/BEM, and content rendered from static data with no backend. Ships a tested Vite starter to scaffold from. Use this skill whenever the user wants to start a new frontend project, scaffold or "set up the architecture", decide folder structure/base classes/routing/render loop/event handling, migrate an existing site onto this structure, or add pages, transitions, scroll effects, text reveals, WebGL galleries or shaders — and when debugging smooth scroll, page transitions, preloaders, or WebGL images that are black, misplaced or missing. Trigger on "creative dev"/Awwwards-style sites, smooth scroll, page transitions or WebGL image effects even if the word "architecture" is never used.
---

# Frontend Architecture

An architecture for sites where motion is the product: every page transition is choreographed, scroll is
smoothed, text reveals line by line, and images live in WebGL so shaders can bend them. No UI framework —
a small class hierarchy, one render loop, and the DOM as the layout engine for everything (including WebGL).

`assets/starter/` is a complete, tested Vite project implementing it (2 pages, WebGL infinite gallery,
transition, preloader, smooth scroll, text + parallax animations). Prefer copying it over writing from scratch.

## When to use it — and when not

Good fit: up to ~10 routes, content known at build time, visual/motion quality matters more than
time-to-interactive, desktop-first with mobile support.

Push back (or adapt per [references/content-and-build.md](references/content-and-build.md)) when:
- many routes or large content → per-route documents with fetch-and-swap navigation instead of one document;
- app-like UI with lots of state/forms → a component framework fits better; the WebGL layer can still be borrowed;
- per-route SEO is critical → static per-route HTML (the starter already emits one file per route) plus real `<title>`s.

## Core ideas (the "why" behind every file)

1. **One document, every page.** All page markup is rendered into a single HTML file. Navigation never
   fetches HTML; it plays a transition, swaps the active page class, swaps the active WebGL scene.
   This is what makes seamless DOM↔WebGL transitions possible: everything exists at once.
2. **The DOM lays out WebGL.** Images meant for WebGL are invisible placeholders (`img[data-gl-src]`).
   Each mesh copies its placeholder's `getBoundingClientRect()` on resize and maps px → world units.
   Designers keep working in CSS; responsive layout comes for free.
3. **The DOM is the asset manifest.** The preloader collects every `[data-gl-src]` in the document and
   builds textures keyed by that exact string. Manifest and markup cannot drift apart.
4. **One loop, top-down.** `App.update()` → `page.update()` (virtual scroll + scroll-linked animations) →
   `canvas.update(page.scroll)` → render. Nothing else calls `requestAnimationFrame` for continuous work.
5. **One owner for input.** `App` owns every window listener (resize, wheel, pointer, popstate, link clicks)
   and forwards to the active page and the canvas, which forwards to the active scene.
6. **Registries, not wiring.** `data-animation="x"` → `animations/index.js` map; route → page in `App.pages`;
   route → scene in `Canvas` `SCENES`. Adding a feature = one class + one registry line.
7. **No backend.** Content is JSON rendered through templates at dev/build time. A CMS can be plugged in
   at build time by replacing one loader function; runtime code never knows.

## Layers

```
app/
  index.js                 App shell: routing, event fan-out, RAF loop
  classes/                 Component (DOM base), Page (scroll + auto-wiring), Animation (in-view base),
                           AsyncLoad (lazy <img data-src>), Detection (device class)
  pages/<Name>/index.js    one Page subclass per route
  animations/              one class per data-animation value + index.js registry
  components/              Preloader, Navigation, Transition (2D wipe)
  components/Canvas/       WebGL root (renderer, camera, textures, SCENES registry)
    <Route>/index.js       a scene: owns a Transform group, input, infinite-loop logic
    <Route>/Media.js       one mesh per DOM placeholder
  shaders/                 .vert/.frag imported with ?raw
  utils/                   math, dom, text splitting, constants, EventEmitter
views/                     Pug: index.pug (document), partials/, pages/
content/site.json          all copy, image URLs, routes, page colors
styles/                    SCSS: utils (tokens, z(), mixins), base, components, layout, pages
scripts/render-site.js     content + views → HTML (used by the Vite plugin)
vite.config.js             renders the document, '@' alias, per-route HTML on build
```

## Workflows

### A. New project
1. Copy `assets/starter/` (everything, including `.gitignore`) to the target directory.
2. `npm install` then `npm run dev`. Confirm: preloader reaches 100%, gallery renders, nav to /about plays
   the wipe, wheel scrolls About. (`npm run build` emits `dist/` with one HTML per route.)
3. Replace content in `content/site.json` (local images in `public/` are faster and avoid CORS).
4. Restyle via `styles/utils/_variables.scss` (+ the mirrored `app/utils/constants.js`).
5. Add pages/animations/scenes with [references/recipes.md](references/recipes.md).
Tell the user what was copied and what is placeholder content.

### B. Existing project
Read [references/architecture.md](references/architecture.md), map the existing code onto the layers above,
and migrate in this order — each step leaves the site working: (1) single App shell owning listeners and the
loop, (2) Page base class + virtual scroll, (3) animation registry, (4) router + transition,
(5) Canvas root + texture preloading, (6) scenes. Don't rewrite working pieces just to match names.

### C. Extending or debugging
Find the layer, read its sibling files first (they're deliberately uniform — match them), then use
[references/recipes.md](references/recipes.md). For anything that "doesn't show up", "jumps" or "is black",
check [references/pitfalls.md](references/pitfalls.md) before reading code.

## Contracts in one screen

- **Component**: `new X({ element, elements, classes })`. `elements` values: `'sel'` → node or null,
  `['sel']` → array. Methods auto-bound. Lifecycle runs from the base constructor (`create()` →
  `addEventListeners()`), so subclasses override `create()`/`setup()` rather than relying on constructor order.
- **Page**: `super({ id, element, elements: { wrapper }, isScrollable })`. `show()/hide()` return promises,
  toggle `${id}--active`, apply `data-background`/`data-color`, enable/disable animations.
  `scroll = { current, target, limit, ease }` is what animations and scenes receive.
- **Animation**: `setup()`, `enable()/disable()`, `onResize(scroll)`, `update(scroll)`, `animateIn/Out()`.
- **Scene**: `show({ isPreloaded })`, `hide()`, `isVisible`, `onResize({ sizes })`,
  `onPointerDown/Move/Up(pointer)`, `onWheel({ pixelY })`, `update(scroll)`.
  `sizes` = world width/height visible at z=0. DOM→world:
  `scale = sizes * (box / viewport)`, `x = -w/2 + scale.x/2 + (left/innerWidth)*w`,
  `y = h/2 - scale.y/2 - ((top - scroll)/innerHeight)*h`.
- **Markup**: BEM classes are the JS contract. `data-animation`, `data-src` (lazy DOM img),
  `data-gl-src` (WebGL placeholder), page root `data-title`/`data-background`/`data-color`.
- **Styles**: `1rem` = 10px of the design comp at any width; z-index only via `z('layer')`;
  pages stay laid out while hidden (opacity/visibility, never `display: none`).

## References

| Read | When |
|---|---|
| [references/architecture.md](references/architecture.md) | Designing or migrating: lifecycle, routing, loop, scroll, transitions in depth |
| [references/webgl.md](references/webgl.md) | Anything in `components/Canvas`, shaders, textures, raycasting, DOM↔WebGL transitions |
| [references/content-and-build.md](references/content-and-build.md) | Content model, templates, plugging a CMS, hosting/SPA fallback, scaling beyond one document |
| [references/recipes.md](references/recipes.md) | Adding a page, animation, scene, shader, route, page transition |
| [references/pitfalls.md](references/pitfalls.md) | Debugging, code review, or before shipping |
