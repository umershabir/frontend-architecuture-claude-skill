import GSAP from 'gsap'
import { Mesh, Program, Texture } from 'ogl'

import fragment from '@/shaders/media.frag?raw'
import vertex from '@/shaders/media.vert?raw'

/**
 * One textured plane mirroring one DOM placeholder.
 * DOM box (px) → world units: scale = sizes * (box / viewport); position from box left/top.
 */
export default class Media {
  constructor ({ element, geometry, gl, index, scene, sizes, textures }) {
    this.element = element
    this.index = index
    this.sizes = sizes
    this.extra = 0

    let texture = textures.get(element.dataset.glSrc)

    if (!texture) {
      console.warn(`[Media] no preloaded texture for ${element.dataset.glSrc}`)
      texture = new Texture(gl)
    }

    const image = texture.image

    this.program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        tMap: { value: texture },
        uAlpha: { value: 0 },
        uSpeed: { value: 0 },
        uImageSizes: { value: [image?.naturalWidth || 1, image?.naturalHeight || 1] },
        uPlaneSizes: { value: [1, 1] },
        uViewportSizes: { value: [sizes.width, sizes.height] }
      }
    })

    this.mesh = new Mesh(gl, { geometry, program: this.program })
    this.mesh.setParent(scene)
  }

  show ({ delay = 0 } = {}) {
    GSAP.fromTo(this.program.uniforms.uAlpha, { value: 0 }, {
      value: 1,
      delay: delay + (this.index % 8) * 0.05,
      duration: 1.2,
      ease: 'power2.out'
    })
  }

  hide () {
    GSAP.killTweensOf(this.program.uniforms.uAlpha)

    this.program.uniforms.uAlpha.value = 0
  }

  onResize (sizes) {
    this.sizes = sizes
    this.extra = 0
    this.bounds = this.element.getBoundingClientRect()

    this.program.uniforms.uViewportSizes.value = [sizes.width, sizes.height]

    this.updateScale()
    this.updateX()
    this.updateY(0)
  }

  updateScale () {
    this.mesh.scale.x = this.sizes.width * (this.bounds.width / window.innerWidth)
    this.mesh.scale.y = this.sizes.height * (this.bounds.height / window.innerHeight)

    this.program.uniforms.uPlaneSizes.value = [this.mesh.scale.x, this.mesh.scale.y]
  }

  updateX () {
    this.mesh.position.x = -this.sizes.width / 2 + this.mesh.scale.x / 2 + (this.bounds.left / window.innerWidth) * this.sizes.width
  }

  updateY (scroll = 0) {
    this.mesh.position.y = this.sizes.height / 2 - this.mesh.scale.y / 2 - ((this.bounds.top - scroll) / window.innerHeight) * this.sizes.height + this.extra
  }

  update (scroll, speed) {
    this.updateY(scroll)

    this.program.uniforms.uSpeed.value = speed
  }
}
