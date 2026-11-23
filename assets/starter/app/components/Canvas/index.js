import { Camera, Renderer, Transform } from 'ogl'

import Home from './Home'

// Route → scene class. Registering here is the only wiring a new scene needs.
// Routes without an entry simply render no WebGL.
const SCENES = {
  '/': Home
}

/**
 * WebGL root: one renderer/camera/scene for the whole site, a texture cache
 * filled by the Preloader, and dispatch of App events to the active scene.
 */
export default class Canvas {
  constructor ({ route }) {
    this.route = route
    this.scenes = {}
    this.textures = new Map()

    this.pointer = {
      isDown: false,
      x: { start: 0, end: 0 },
      y: { start: 0, end: 0 }
    }

    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2)
    })

    this.gl = this.renderer.gl
    this.gl.canvas.classList.add('canvas')

    document.body.appendChild(this.gl.canvas)

    this.camera = new Camera(this.gl, { fov: 45 })
    this.camera.position.z = 5

    this.scene = new Transform()

    this.onResize()
  }

  get active () {
    return this.scenes[this.route]
  }

  // Scenes are built only after preload: they need the textures.
  onPreloaded () {
    Object.entries(SCENES).forEach(([route, Scene]) => {
      this.scenes[route] = new Scene({
        camera: this.camera,
        gl: this.gl,
        renderer: this.renderer,
        scene: this.scene,
        sizes: this.sizes,
        textures: this.textures
      })
    })

    this.onChange(this.route, { isPreloaded: true })
  }

  onChange (route, { isPreloaded = false } = {}) {
    Object.entries(this.scenes).forEach(([key, scene]) => {
      if (key === route) {
        scene.show({ isPreloaded })
      } else if (scene.isVisible) {
        scene.hide()
      }
    })

    this.route = route
  }

  /**
   * `sizes` = world-space width/height visible at z = 0. Scenes map DOM pixels onto it.
   */
  onResize () {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.perspective({ aspect: window.innerWidth / window.innerHeight })

    const fov = this.camera.fov * (Math.PI / 180)
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z

    this.sizes = { height, width: height * this.camera.aspect }

    Object.values(this.scenes).forEach(scene => scene.onResize({ sizes: this.sizes }))
  }

  onPointerDown (event) {
    this.pointer.isDown = true
    this.pointer.x.start = this.pointer.x.end = event.clientX
    this.pointer.y.start = this.pointer.y.end = event.clientY

    this.active?.onPointerDown?.(this.pointer)
  }

  onPointerMove (event) {
    this.pointer.x.end = event.clientX
    this.pointer.y.end = event.clientY

    this.active?.onPointerMove?.(this.pointer)
  }

  onPointerUp (event) {
    this.pointer.isDown = false
    this.pointer.x.end = event.clientX
    this.pointer.y.end = event.clientY

    this.active?.onPointerUp?.(this.pointer)
  }

  onWheel (wheel) {
    this.active?.onWheel?.(wheel)
  }

  update (scroll) {
    this.active?.update(scroll)

    this.renderer.render({ camera: this.camera, scene: this.scene })
  }
}
