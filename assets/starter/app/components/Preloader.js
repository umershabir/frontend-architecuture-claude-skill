import GSAP from 'gsap'
import { Texture } from 'ogl'

import Component from '@/classes/Component'

/**
 * Loads every WebGL image into a texture before the site starts.
 * The manifest is the DOM itself: all `[data-gl-src]` across all pages
 * (every page is in the document), so it can never drift from the markup.
 * Textures land in canvas.textures, keyed by the exact data-gl-src string.
 */
export default class Preloader extends Component {
  constructor ({ canvas }) {
    super({
      element: '.preloader',
      elements: {
        number: '.preloader__number'
      }
    })

    this.canvas = canvas
  }

  start () {
    const urls = [...new Set(Array.from(document.querySelectorAll('[data-gl-src]'), element => element.dataset.glSrc))]

    this.loaded = 0
    this.total = urls.length

    if (this.total === 0) {
      this.onLoaded()
      return
    }

    urls.forEach(url => {
      const texture = new Texture(this.canvas.gl, { generateMipmaps: false })
      const image = new window.Image()

      image.crossOrigin = 'anonymous'

      image.onload = () => {
        texture.image = image
        this.onAssetLoaded()
      }

      // Count failures too, or one broken URL blocks the site forever.
      image.onerror = () => {
        console.warn(`[Preloader] failed to load ${url}`)
        this.onAssetLoaded()
      }

      image.src = url

      this.canvas.textures.set(url, texture)
    })
  }

  onAssetLoaded () {
    this.loaded += 1

    this.elements.number.textContent = `${Math.round((this.loaded / this.total) * 100)}%`

    if (this.loaded === this.total) this.onLoaded()
  }

  onLoaded () {
    this.emit('completed')

    GSAP.to(this.element, {
      autoAlpha: 0,
      delay: 0.4,
      duration: 1,
      onComplete: () => this.destroy()
    })
  }

  destroy () {
    super.destroy()

    this.element.remove()
  }
}
