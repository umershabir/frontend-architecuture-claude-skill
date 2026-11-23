import GSAP from 'gsap'

import { EASE_GSAP } from '@/utils/constants'

/**
 * Full-screen 2D-canvas wipe that hides the page swap.
 * show(): a curved fill rises from the bottom and covers the screen.
 * hide(): the fill retreats upward, revealing the new page.
 */
export default class Transition {
  constructor () {
    this.element = document.createElement('canvas')
    this.element.className = 'transition'
    this.context = this.element.getContext('2d')

    this.progress = 0
    this.isHiding = false
    this.color = '#000'

    document.body.appendChild(this.element)

    this.onResize()
  }

  show ({ color }) {
    this.color = color || this.color
    this.isHiding = false

    return this.animate(1)
  }

  hide () {
    this.isHiding = true

    return this.animate(0)
  }

  animate (progress) {
    return new Promise(resolve => {
      GSAP.to(this, {
        progress,
        duration: 1.2,
        ease: EASE_GSAP,
        onUpdate: () => this.draw(),
        onComplete: resolve
      })
    })
  }

  onResize () {
    const ratio = Math.min(window.devicePixelRatio, 2)

    this.element.width = window.innerWidth * ratio
    this.element.height = window.innerHeight * ratio

    this.draw()
  }

  draw () {
    const { width, height } = this.element
    const context = this.context

    context.clearRect(0, 0, width, height)

    if (this.progress <= 0) return

    const bend = Math.sin(this.progress * Math.PI) * height * 0.15

    context.beginPath()

    if (this.isHiding) {
      const edge = this.progress * height

      context.moveTo(0, 0)
      context.lineTo(0, edge)
      context.quadraticCurveTo(width / 2, edge + bend, width, edge)
      context.lineTo(width, 0)
    } else {
      const edge = (1 - this.progress) * height

      context.moveTo(0, height)
      context.lineTo(0, edge)
      context.quadraticCurveTo(width / 2, edge - bend, width, edge)
      context.lineTo(width, height)
    }

    context.closePath()
    context.fillStyle = this.color
    context.fill()
  }
}
