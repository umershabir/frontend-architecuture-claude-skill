# WebGL layer

## Contents
1. Canvas root
2. DOM → world mapping
3. Scene contract and registry
4. Media (mesh per placeholder)
5. Infinite loops
6. DOM ↔ WebGL transitions (expanding a thumbnail into a detail view)
7. Picking with raycasts
8. Shaders
9. Performance

## 1. Canvas root (`components/Canvas/index.js`)
- One OGL `Renderer({ alpha: true, antialias: true, dpr: min(devicePixelRatio, 2) })`, one `Camera`
  (fov 45, z = 5), one root `Transform`. The `<canvas>` is fixed, full-screen, `pointer-events: none`,
  below DOM content (`z('canvas')`); the page background color shows through `alpha`.
- `textures: Map<url, Texture>` filled by the Preloader.
- Dispatches input to `this.active` (scene of the current route); resize goes to all scenes.

## 2. DOM → world mapping
Visible world height at z=0: `h = 2 * tan(fov/2) * camera.z`, width `w = h * aspect`. For a DOM box:
```
scale.x    = w * (box.width  / innerWidth)
scale.y    = h * (box.height / innerHeight)
position.x = -w/2 + scale.x/2 + (box.left / innerWidth) * w
position.y =  h/2 - scale.y/2 - ((box.top - scrollY) / innerHeight) * h
```
`scrollY` is whatever scroll drives that scene: the page's virtual `scroll.current` (pass it from
`update(scroll)`) or the scene's own scroll (galleries that hijack wheel). Re-read boxes in `onResize`, never per frame.

## 3. Scene contract and registry
```js
const SCENES = { '/': Home, '/work': Work }   // Canvas/index.js
```
A scene implements: `constructor({ gl, scene, sizes, textures, camera, renderer })`, `isVisible`,
`show({ isPreloaded })`, `hide()`, `onResize({ sizes })`, optional `onPointerDown/Move/Up(pointer)`,
`onWheel({ pixelY })`, `update(scroll)`.
`show` parents `this.group` to the root scene and fades meshes in (delay more when `isPreloaded`, so the
preloader fade finishes first); `hide` unparents.

## 4. Media
One `Mesh` per placeholder, sharing one `Plane` geometry per scene (use segments only if the vertex
shader deforms it). Program uniforms used by the starter:
`tMap`, `uAlpha` (GSAP-tweened), `uSpeed` (scroll velocity), `uImageSizes` (texture natural size),
`uPlaneSizes` (mesh scale) for cover-fit, `uViewportSizes`.
A missing texture should warn and fall back to an empty `Texture` instead of crashing.

## 5. Infinite loops
Gallery DOM must be taller (or wider) than the viewport by at least one item — render the list twice if needed.
Per frame, after positioning a mesh with its `extra` offset:
```
moving up   && bottom edge above viewport top    → extra -= galleryHeight
moving down && top edge below viewport bottom    → extra += galleryHeight
```
(`galleryHeight` in world units = gallery box height / innerHeight * h.) Reset `extra` on resize.
Horizontal is identical on x. Keep the gallery's outer padding equal to half the gap so the seam is invisible.
Auto-drift: add a constant to `target` every frame, sign = last wheel direction.

## 6. DOM ↔ WebGL transitions
Pattern for "thumbnail grows into detail view":
1. Detail markup lives in the same document with its own placeholder (`.detail__media`), hidden.
2. Each Media has `animation` 0→1 (GSAP). In `update`, interpolate bounds:
   `box = lerp(thumbnailRect, detailRect, animation)`, then apply the DOM→world mapping.
3. Show detail DOM text with its own timeline; disable gallery input while open; reverse on close.
For cross-route morphs: before swapping, clone the clicked mesh into a transition mesh on the root scene,
swap routes underneath, tween the clone to the destination mesh's transform, then remove it. Make sure the
destination scene can find its target by texture key, and that the code that consumes it is actually wired —
a transition object that is never constructed silently disables the whole path.

## 7. Picking
```js
const raycast = new Raycast(gl); const mouse = new Vec2()
mouse.set(2 * (x / renderer.width) - 1, 2 * (1 - y / renderer.height) - 1)
raycast.castMouse(camera, mouse)
const [hit] = raycast.intersectBounds(meshes)
```
Set `body.style.cursor` on hover; distinguish click from drag by comparing pointer start/end distance.

## 8. Shaders
Files in `app/shaders`, imported `import vertex from '@/shaders/x.vert?raw'`. OGL supplies `position`, `uv`,
`modelViewMatrix`, `projectionMatrix`. Set `transparent: true` on Programs that fade. Mutate
`program.uniforms.uX.value` per frame; tween `program.uniforms.uAlpha` (the object with `.value`) with GSAP.
Typical deformation: displace `viewPosition.z` by `sin(y / viewportH * PI + PI/2) * speed` for scroll bend.

## 9. Performance
- DPR cap 2; `generateMipmaps: false` for NPOT photos; resize images at source to ~2x display size.
- Share geometry; one Program per mesh is fine for dozens of meshes.
- Only the active scene updates; hidden scenes are unparented.
- Preload only what WebGL needs (`data-gl-src`); DOM images lazy-load (`data-src`).
