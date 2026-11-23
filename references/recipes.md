# Recipes

Each recipe lists every touch point; a missed one is the usual reason something "doesn't show up".

## Add a page (e.g. `/work`)
1. `content/site.json`: add `"/work"` to `routes`, a `navigation` entry, and `pages.work` with `metaTitle`, `background`, `color`, fields.
2. `views/pages/work.pug`: root `section.work(data-title=… data-background=… data-color=…)`; if scrollable, a `.work__wrapper` containing everything.
3. `views/index.pug`: `include pages/work` inside `main.content`.
4. `styles/pages/_work.scss`: `@use '../utils' as *;` `.work { @extend %page; &--active { @extend %page--active; } }`; add `@use 'pages/work';` to `styles/index.scss`.
5. `app/pages/Work/index.js`: copy `pages/About` (scrollable) or `pages/Home` (`isScrollable: false`).
6. `app/index.js`: import and add `'/work': new Work()` to `this.pages`.
7. WebGL for this page? Follow "Add a WebGL scene".

## Add a DOM animation (`data-animation="fade"`)
1. `app/animations/Fade.js` extending `@/classes/Animation`: put queries/splitting in `setup()`, measuring in `onResize(scroll)`, scroll-linked work in `update(scroll)`, reveal in `animateIn()`/`animateOut()` (call `super`).
2. `app/animations/index.js`: `fade: Fade`.
3. Markup: `data-animation="fade"`. Shared CSS for its markup goes in `styles/base/_base.scss`.
An unregistered value logs a warning naming the page — check the console first.

## Add a WebGL scene for a route
1. Markup: placeholders `img(data-gl-src=url)` inside a laid-out container with real CSS sizes.
2. `app/components/Canvas/<Name>/index.js` + `Media.js`: copy `Canvas/Home`. Keep the scene contract (webgl.md §3).
3. `Canvas/index.js`: import and add `'/route': Name` to `SCENES`. That's all the wiring.
4. Make the page `isScrollable: false` if the scene owns wheel/drag; otherwise use the `scroll` passed to `update(scroll)`.

## Add a shader effect
1. New `.vert`/`.frag` in `app/shaders`, imported with `?raw`.
2. Add uniforms in the Media's Program; drive them in `update()` (per-frame) or with GSAP (one-shot).
3. Keep cover-fit (`uImageSizes`/`uPlaneSizes`) and `uAlpha` unless the effect replaces them.

## Change the page transition
`components/Transition.js` only needs `show({ color }) → Promise` (covered) and `hide() → Promise` (revealed).
Replace the 2D drawing with a CSS/GSAP panel or a WebGL pass; keep the contract so App doesn't change.
Per-page intro/outro motion goes in the Page subclass `show()`/`hide()` (return the timeline's promise:
`return new Promise(resolve => tl.eventCallback('onComplete', resolve))`).

## Add a lazily loaded DOM image
`img(data-src=url alt=…)` inside a page. Page wires `AsyncLoad`; CSS fades it in on `.loaded`.
Give the container an aspect ratio so layout (and `scroll.limit`) doesn't jump.

## Text splitting
`splitWords(el)` (idempotent) → `.word > .word__inner` spans; `calculateLines(words)` groups by line — recompute
in `onResize`. For letters or inline tags, write a node-walking splitter and keep it idempotent.

## Add a global UI component (cursor, sound toggle, menu)
`app/components/X.js` extending Component, constructed in `App`; give it `update()`/`onResize()` and call them
from `App.update()`/`App.onResize()`; add its layer to `$z-layers`.
