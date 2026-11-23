# Architecture in depth

## Contents
1. Boot sequence
2. Routing and page transitions
3. The loop
4. Event fan-out
5. Component / Page / Animation lifecycles
6. Virtual scroll
7. Preloader and Transition
8. Device detection
9. Adapting the architecture

## 1. Boot sequence

```
new App()
 ├─ route = normalizePath(location.pathname); unknown route → replaceState('/')
 ├─ createPages()       every Page constructed now (DOM is all there); animations created, disabled
 ├─ createCanvas()      OGL renderer/camera/root Transform, empty texture Map; canvas appended to <body>
 ├─ createTransition()  2D <canvas> overlay
 ├─ createNavigation()
 ├─ createPreloader()   .once('completed', onPreloaded)
 ├─ addEventListeners() + delegated link click handler
 ├─ onResize(); update()           loop starts (renders an empty scene until preloaded)
 └─ preloader.start()   loads every [data-gl-src] into canvas.textures

'completed' → App.onPreloaded
 ├─ onResize()
 ├─ canvas.onPreloaded()  constructs every registered scene (needs textures), shows the current one
 └─ page.show()           enables animations, applies page colors
```
Why scenes wait for preload: a Program needs its texture and the texture's natural size (for cover-fit).
Why pages don't: they only need the DOM, and constructing them early lets the loop run from frame one.

## 2. Routing and page transitions

`App.pages` maps normalized pathnames to Page instances. Navigation:
```
click (same-origin <a>, no modifier, no target/download) or popstate
 → onChange({ url, push })
   guard: unknown route | not ready | same page → ignore; already changing → queue latest
   await transition.show({ color: nextPage.dataset.background })   screen fully covered
   pushState (if push); document.title = nextPage.dataset.title
   await oldPage.hide()
   navigation.onChange(route); canvas.onChange(route)               swap WebGL scene while hidden
   await newPage.show()
   onResize()                                                       re-measure with new page laid out
   await transition.hide()
```
Everything that would visibly jump happens while the overlay covers the screen. If you replace the overlay
with a DOM↔WebGL morph (see webgl.md §6), keep that principle: swap state only while it's not perceivable.

External links get `target=_blank rel="noopener noreferrer"` once at boot; `mailto:`/`tel:` are untouched.

## 3. The loop

Single `requestAnimationFrame` in `App.update()`:
1. `page.update()` — clamp + lerp scroll, translate wrapper, `animation.update(scroll)` for each animation.
2. `canvas.update(page.scroll)` — active scene `update(scroll)`, then `renderer.render`.

Rules: per-frame smoothing uses `lerp` in `update()`; one-shot motion uses GSAP tweens/timelines (GSAP has
its own ticker, fine to coexist). Never start a GSAP tween every frame. Don't add more RAF loops — if a
component needs per-frame work, give it an `update()` and call it from its owner's `update()`.
`lerp(a, b, 0.1)` per frame is frame-rate dependent; on 120 Hz screens motion is faster. Use `damp()` with a
delta time if that matters for the project.

## 4. Event fan-out

| Window event | App handler | Forwarded to |
|---|---|---|
| resize | onResize | page.onResize(); transition.onResize(); canvas.onResize() next frame |
| wheel (passive) | onWheel (normalize-wheel) | page.onWheel({pixelY}); canvas.onWheel → active scene |
| pointerdown/move/up/cancel | onPointer* | page (touch-drag scroll only), canvas (builds `{isDown, x:{start,end}, y:{start,end}}`) → active scene |
| popstate | onPopState | onChange({ push: false }) |
| click (document, delegated) | link handler | onChange({ url }) |

`body { touch-action: none }` is required so pointermove fires during touch drags.
Children may attach listeners to their own elements (hover on a button) — never to `window`/`document`.

## 5. Lifecycles

**Component** — constructor: `autoBind` → store options → `create()` (resolve root + `elements`) →
`addEventListeners()`. Because the base constructor runs the lifecycle, subclass constructor bodies run
*after* `create()`. Pass configuration through options and read `this.options` in `create()`; avoid class-field
initializers in subclasses (they run after `super()` and would overwrite what `create()` set).

**Page** extends Component — `create()` adds: id/classes, scroll state, wrapper check, animations from the
registry, lazy images, ResizeObserver on the wrapper (keeps `scroll.limit` right as images/fonts load).

**Animation** extends Component — `create()` → `setup()` → IntersectionObserver created (not observing).
`enable()` (on page show): `animateOut()` then observe. `disable()` (on page hide): unobserve.
Hidden pages are still laid out, so without disable() their observers keep firing.

**Scene** — plain class: constructor builds `group` + meshes (not parented); `show()` parents the group to
the root scene, `hide()` unparents. Unparented groups cost nothing to render.

## 6. Virtual scroll

`html` and `body` are `position: fixed; overflow: hidden`. Each scrollable page translates `elements.wrapper`:
```
target += wheel.pixelY (or touch drag * 2)
target  = clamp(target, 0, wrapper.clientHeight - innerHeight)
current = lerp(current, target, ease)    // snap when |target - current| < 0.1
wrapper.style.transform = translate3d(0, -round(current), 0)
```
Measuring under a translated wrapper: `rect.top` is already shifted by `-current`, so document-relative
`top = rect.top + scroll.current` (`getOffset(el, scroll.current)`).

Trade-offs to tell the user about: no native scrollbar, keyboard scrolling (Space/PageDown/arrows) and
find-in-page jumps don't work unless added; `prefers-reduced-motion` users should get `ease = 1` and no
reveals. Add a keydown handler in App forwarding to `page.onWheel({ pixelY })` if keyboard support is needed.

## 7. Preloader and Transition

Preloader: collects unique `[data-gl-src]`, creates an OGL `Texture` per URL, loads an `Image` with
`crossOrigin = 'anonymous'`, counts both load and error, updates the percentage, emits `completed`, fades
out, removes itself. Keep a minimum display time if loads are instant and the intro animation matters.

Transition: a full-viewport 2D canvas drawing a curved fill whose edge is driven by `progress` (GSAP tween).
`show()` resolves when covered, `hide()` when revealed. Resize it with the window (DPR capped at 2).

## 8. Device detection

An inline `<head>` script sets `html.phone|tablet|desktop` from `(pointer: coarse)` and width before first
paint; `classes/Detection.js` reads it. Client-side because there's no server and UA sniffing is unreliable.
CSS can use the same classes.

## 9. Adapting the architecture

- **Many pages / large content**: keep App/Page/Canvas, but on navigation `fetch(url)`, parse with
  `DOMParser`, swap `.content` innerHTML, construct the Page for that template (map by
  `data-template` on the page root), then call `canvas.onChange`. Textures load per page (preloader per route).
- **Framework host (React/Vue/Svelte)**: keep Canvas + scenes as plain classes, created once in a top-level
  effect; components register DOM placeholders with the canvas; drive `update` from one RAF.
- **No WebGL**: delete `components/Canvas`, the Preloader texture code, and `data-gl-src` styles; everything else stands.
