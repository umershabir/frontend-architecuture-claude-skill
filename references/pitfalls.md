# Pitfalls (symptom → cause → fix)

Lessons from real codebases built this way. Use as a debugging index and a review checklist.

## Routing
- **Click on a link crashes / blank page** → the URL isn't in the route map, so `page` is undefined.
  Guard unknown routes in `onChange`, fall back to `/` on boot, and keep links, `routes`, `App.pages` in sync.
- **Hover/click throws "is not a function"** → a handler references a method that was renamed or never
  written. Bind real methods only; delegated listeners make this rarer.
- **Back button during a transition leaves URL and page out of sync** → ignore-while-busy drops events;
  queue the latest request and replay it after the transition.
- **Title never changes** → single-document sites must set `document.title` from the page's `data-title`.

## Lifecycle
- **Subclass state is undefined in `create()`/`setup()`** → base constructors run the lifecycle before the
  subclass constructor body; pass config via options, don't use class-field initializers in subclasses.
- **Text reveals already played / play on hidden pages** → hidden pages are still laid out, so observers fire.
  Enable observers on `show()`, disable on `hide()`.
- **Spans nested deeper after each visit** → text splitting ran again on show. Split once (idempotent splitter).
- **Listeners pile up** → a `removeEventListener` copy-pasted from `addEventListener`. Review removal methods specifically.
- **`super.destroy()` throws** → the base class has no `destroy`. Give every base class a `destroy()`.
- **Selector returns a node sometimes, a NodeList other times** → "0/1/n" auto-resolution. Make single vs.
  many explicit (`'sel'` vs `['sel']`).

## Scroll
- **Can't scroll to the end / scroll stops early** → `limit` computed before images/fonts loaded; observe
  the wrapper with ResizeObserver.
- **Parallax/positions off by the scroll amount** → measured with `getBoundingClientRect` under a translated
  wrapper; add `scroll.current`.
- **Touch scrolling dead** → missing `touch-action: none` on body, or pointer handler ignores touch.
- **Motion faster on 120 Hz** → per-frame lerp; use `damp(…, delta)` if it matters.

## WebGL
- **Image black/empty** → texture key mismatch (`data-gl-src` ≠ preloaded URL), CORS failure on a remote
  host, or texture created before load and never updated. Derive the manifest from the DOM; check the console.
- **Mesh in the wrong place / wrong size** → placeholder has zero size, `display: none` page, or bounds not
  re-read after resize/page show. Pages must hide with opacity/visibility, and canvas resize runs one frame after page show.
- **Preloader stuck below 100%** → an image failed and errors weren't counted, or there were zero assets and
  `completed` was emitted before anyone listened. Count errors; start loading only after listeners are attached.
- **Scene wired in some handlers but not others** → per-scene `if (this.x) this.x.onY()` blocks; use a registry and loop.
- **Transition feature silently dead** → an object passed to a scene is never constructed (stays undefined).
- **Infinite loop shows a gap** → gallery not taller than viewport + one item, or padding ≠ half gap.
- **Stretched images** → no cover-fit; pass image and plane sizes to the fragment shader.
- **Blurry on retina / slow on 4K** → DPR not set / not capped. Use `min(devicePixelRatio, 2)`.

## Build / project hygiene
- **Secrets in git** (`.env` with CMS tokens committed) → gitignore `.env*` from the first commit; rotate any committed token.
- **`events`/Node built-ins missing in the browser** → modern bundlers don't polyfill; use a small local EventEmitter.
- **Breakpoints/colors disagree between CSS and JS** → keep them mirrored in two named files and say so in both.
- **Debug logs in resize/update** → remove `console.log` from hot paths.
- **Unused classes left around** (old scroll, marquee, color managers) → delete or document; they mislead readers.

## Accessibility / UX checklist before shipping
- `prefers-reduced-motion`: snap scroll (`ease = 1`), skip reveals, shorten transitions.
- Keyboard: focus styles, keyboard scrolling forwarded to the virtual scroll, Esc closes overlays.
- WebGL images still need meaningful `alt` on their placeholders.
- Provide a no-WebGL fallback (show DOM images) if `getContext('webgl')` fails.
