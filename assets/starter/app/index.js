import autoBind from 'auto-bind'
import NormalizeWheel from 'normalize-wheel'

import '../styles/index.scss'

import Canvas from '@/components/Canvas'
import Navigation from '@/components/Navigation'
import Preloader from '@/components/Preloader'
import Transition from '@/components/Transition'

import About from '@/pages/About'
import Home from '@/pages/Home'

import { normalizePath } from '@/utils/dom'

/**
 * App shell: owns routing, every window listener, and the single RAF loop.
 * Children never listen to window events themselves; App forwards them.
 */
class App {
  constructor () {
    autoBind(this)

    this.route = normalizePath(window.location.pathname)

    this.createPages()
    this.createCanvas()
    this.createTransition()
    this.createNavigation()
    this.createPreloader()

    this.addEventListeners()
    this.addLinkListeners()

    this.onResize()
    this.update()

    this.preloader.start()
  }

  createPages () {
    // Route → Page. All page markup is already in the document.
    this.pages = {
      '/': new Home(),
      '/about': new About()
    }

    if (!this.pages[this.route]) {
      this.route = '/'
      window.history.replaceState({}, '', this.route)
    }

    this.page = this.pages[this.route]
  }

  createCanvas () {
    this.canvas = new Canvas({ route: this.route })
  }

  createTransition () {
    this.transition = new Transition()
  }

  createNavigation () {
    this.navigation = new Navigation({ route: this.route })
  }

  createPreloader () {
    this.preloader = new Preloader({ canvas: this.canvas })
    this.preloader.once('completed', this.onPreloaded)
  }

  /**
   * Routing.
   */
  onPreloaded () {
    this.isReady = true

    this.onResize()
    this.canvas.onPreloaded()
    this.page.show()
  }

  async onChange ({ url, push = true }) {
    const route = normalizePath(new URL(url, window.location.origin).pathname)
    const page = this.pages[route]

    if (!page || !this.isReady || page === this.page) return

    if (this.isChanging) {
      this.pending = { url, push }
      return
    }

    this.isChanging = true

    await this.transition.show({ color: page.element.dataset.background })

    if (push) window.history.pushState({}, '', route)

    if (page.element.dataset.title) document.title = page.element.dataset.title

    await this.page.hide()

    this.route = route
    this.page = page

    this.navigation.onChange(route)
    this.canvas.onChange(route)

    await this.page.show()

    this.onResize()

    await this.transition.hide()

    this.isChanging = false

    if (this.pending) {
      const pending = this.pending
      this.pending = null
      this.onChange(pending)
    }
  }

  onPopState () {
    this.onChange({ url: window.location.href, push: false })
  }

  /**
   * Events — fanned out to the active page and the canvas.
   */
  onResize () {
    this.page?.onResize()
    this.transition?.onResize()

    // Let layout settle (fonts, the page just shown) before WebGL reads DOM bounds.
    window.requestAnimationFrame(() => this.canvas?.onResize())
  }

  onPointerDown (event) {
    this.page.onPointerDown(event)
    this.canvas.onPointerDown(event)
  }

  onPointerMove (event) {
    this.page.onPointerMove(event)
    this.canvas.onPointerMove(event)
  }

  onPointerUp (event) {
    this.page.onPointerUp(event)
    this.canvas.onPointerUp(event)
  }

  onWheel (event) {
    const wheel = NormalizeWheel(event)

    this.page.onWheel(wheel)
    this.canvas.onWheel(wheel)
  }

  /**
   * Loop.
   */
  update () {
    this.page.update()
    this.canvas.update(this.page.scroll)

    this.frame = window.requestAnimationFrame(this.update)
  }

  /**
   * Listeners.
   */
  addEventListeners () {
    window.addEventListener('popstate', this.onPopState)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('wheel', this.onWheel, { passive: true })

    window.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
  }

  addLinkListeners () {
    document.querySelectorAll('a[href]').forEach(link => {
      const isExternal = link.origin !== window.location.origin
      const isSpecial = /^(mailto|tel):/.test(link.protocol)

      if (isExternal && !isSpecial) {
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
      }
    })

    // Delegated, so links added later are handled too.
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]')

      if (!link || link.origin !== window.location.origin) return
      if (link.target === '_blank' || link.hasAttribute('download')) return
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      event.preventDefault()

      this.onChange({ url: link.href })
    })
  }
}

new App() // eslint-disable-line no-new
