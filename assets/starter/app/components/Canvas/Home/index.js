import { Plane, Transform } from 'ogl'

import { lerp } from '@/utils/math'

import Media from './Media'

/**
 * Infinite vertical WebGL gallery. One Media (mesh) per DOM placeholder in `.home__gallery`.
 * Scene contract: show/hide, onResize({ sizes }), onPointer*(pointer), onWheel(wheel), update(scroll), isVisible.
 */
export default class HomeScene {
  constructor ({ gl, scene, sizes, textures }) {
    this.gl = gl
    this.scene = scene
    this.sizes = sizes

    this.group = new Transform()
    this.isVisible = false

    this.galleryElement = document.querySelector('.home__gallery')
    this.geometry = new Plane(gl, { heightSegments: 20, widthSegments: 20 })

    this.medias = Array.from(this.galleryElement.querySelectorAll('[data-gl-src]'), (element, index) => new Media({
      element,
      geometry: this.geometry,
      gl,
      index,
      scene: this.group,
      sizes,
      textures
    }))

    this.scroll = { current: 0, target: 0, last: 0, start: 0, ease: 0.1, drift: 1, direction: 1 }
    this.speed = { current: 0, target: 0, ease: 0.1 }

    this.onResize({ sizes })
  }

  show ({ isPreloaded = false } = {}) {
    this.isVisible = true

    this.group.setParent(this.scene)

    this.medias.forEach(media => media.show({ delay: isPreloaded ? 0.6 : 0 }))
  }

  hide () {
    this.isVisible = false

    this.medias.forEach(media => media.hide())

    this.group.setParent(null)
  }

  onResize ({ sizes }) {
    this.sizes = sizes

    const bounds = this.galleryElement.getBoundingClientRect()

    this.galleryHeight = (bounds.height / window.innerHeight) * sizes.height

    Object.assign(this.scroll, { current: 0, target: 0, last: 0 })

    this.medias.forEach(media => media.onResize(sizes))
  }

  onPointerDown () {
    this.scroll.start = this.scroll.target
  }

  onPointerMove ({ isDown, y }) {
    if (!isDown) return

    this.scroll.target = this.scroll.start + (y.start - y.end)
  }

  onWheel ({ pixelY }) {
    this.scroll.target += pixelY

    if (pixelY !== 0) this.scroll.direction = Math.sign(pixelY)
  }

  update () {
    this.scroll.target += this.scroll.drift * this.scroll.direction
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)

    this.speed.target = (this.scroll.target - this.scroll.current) * 0.001
    this.speed.current = lerp(this.speed.current, this.speed.target, this.speed.ease)

    const direction = this.scroll.current >= this.scroll.last ? 'up' : 'down'
    const viewportHalf = this.sizes.height / 2

    this.medias.forEach(media => {
      media.update(this.scroll.current, this.speed.current)

      const meshHalf = media.mesh.scale.y / 2

      // Wrap by one full gallery height once a mesh fully leaves the viewport.
      if (direction === 'up' && media.mesh.position.y - meshHalf > viewportHalf) {
        media.extra -= this.galleryHeight
        media.update(this.scroll.current, this.speed.current)
      } else if (direction === 'down' && media.mesh.position.y + meshHalf < -viewportHalf) {
        media.extra += this.galleryHeight
        media.update(this.scroll.current, this.speed.current)
      }
    })

    this.scroll.last = this.scroll.current
  }
}
