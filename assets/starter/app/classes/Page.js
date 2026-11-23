import AsyncLoad from '@/classes/AsyncLoad'
import Component from '@/classes/Component'

import { ANIMATIONS } from '@/animations'

import { clamp, lerp } from '@/utils/math'

/**
 * A route's DOM. Provides virtual smooth scroll and auto-wires
 * `[data-animation]` (via the animations registry) and `img[data-src]` lazy loading.
 *
 *   super({ id: 'about', element: '.about', elements: { wrapper: '.about__wrapper' } })
 *
 * - `id` is the BEM block; the active modifier is `${id}--active`.
 * - `isScrollable` (default true) requires `elements.wrapper`, which gets translated.
 */
export default class Page extends Component {
  constructor ({ isScrollable = true, ...options }) {
    super({ isScrollable, ...options })
  }

  create () {
    super.create()

    this.id = this.options.id
    this.isScrollable = this.options.isScrollable
    this.classes = { active: `${this.id}--active`, ...this.classes }

    this.isVisible = false

    this.scroll = {
      current: 0,
      target: 0,
      last: 0,
      limit: 0,
      position: 0,
      ease: 0.08
    }

    if (this.isScrollable && !this.elements.wrapper) {
      throw new Error(`Page "${this.id}" is scrollable but has no elements.wrapper`)
    }

    this.createAnimations()
    this.createLazyImages()

    if (this.isScrollable) this.createResizeObserver()
  }

  createAnimations () {
    this.animations = []

    this.element.querySelectorAll('[data-animation]').forEach(element => {
      const name = element.dataset.animation
      const Animation = ANIMATIONS[name]

      if (!Animation) {
        console.warn(`[Page:${this.id}] no animation registered for data-animation="${name}"`)
        return
      }

      this.animations.push(new Animation({ element }))
    })
  }

  createLazyImages () {
    this.lazyImages = Array.from(this.element.querySelectorAll('img[data-src]'), element => new AsyncLoad({ element }))
  }

  createResizeObserver () {
    this.resizeObserver = new window.ResizeObserver(() => this.updateLimit())
    this.resizeObserver.observe(this.elements.wrapper)
  }

  updateLimit () {
    if (!this.isScrollable) return

    this.scroll.limit = Math.max(0, this.elements.wrapper.clientHeight - window.innerHeight)
  }

  /**
   * Visibility. Return promises so App can await (add GSAP timelines here if needed).
   */
  show () {
    this.isVisible = true

    this.resetScroll()

    this.element.classList.add(this.classes.active)

    const { background, color } = this.element.dataset
    const root = document.documentElement

    if (background) root.style.backgroundColor = background
    if (color) root.style.color = color

    this.animations.forEach(animation => {
      animation.onResize(this.scroll)
      animation.enable()
    })

    return Promise.resolve()
  }

  hide () {
    this.isVisible = false

    this.element.classList.remove(this.classes.active)

    // Hidden pages are still laid out, so their observers would keep firing.
    this.animations.forEach(animation => animation.disable())

    return Promise.resolve()
  }

  resetScroll () {
    Object.assign(this.scroll, { current: 0, target: 0, last: 0, position: 0 })

    this.updateLimit()

    if (this.isScrollable) this.transform(0)
  }

  transform (y) {
    this.elements.wrapper.style.transform = `translate3d(0, ${-Math.round(y)}px, 0)`
  }

  /**
   * Events (forwarded by App).
   */
  onResize () {
    this.updateLimit()

    this.animations.forEach(animation => animation.onResize(this.scroll))
  }

  onPointerDown (event) {
    if (!this.isScrollable || event.pointerType !== 'touch') return

    this.isDown = true
    this.start = event.clientY
    this.scroll.position = this.scroll.current
  }

  onPointerMove (event) {
    if (!this.isDown) return

    this.scroll.target = this.scroll.position + (this.start - event.clientY) * 2
  }

  onPointerUp () {
    this.isDown = false
  }

  onWheel ({ pixelY }) {
    if (!this.isScrollable) return

    this.scroll.target += pixelY
  }

  /**
   * Loop (called by App every frame while this page is active).
   */
  update () {
    if (this.isScrollable) {
      this.scroll.target = clamp(this.scroll.target, 0, this.scroll.limit)
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)

      if (Math.abs(this.scroll.target - this.scroll.current) < 0.1) {
        this.scroll.current = this.scroll.target
      }

      this.transform(this.scroll.current)
    }

    this.animations.forEach(animation => animation.update(this.scroll))

    this.scroll.last = this.scroll.current
  }

  destroy () {
    super.destroy()

    this.resizeObserver?.disconnect()
    this.animations.forEach(animation => animation.destroy())
    this.lazyImages.forEach(image => image.destroy())
  }
}
