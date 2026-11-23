import Animation from '@/classes/Animation'

import { BREAKPOINTS } from '@/utils/constants'
import { getOffset } from '@/utils/dom'
import { clamp, map } from '@/utils/math'

// Scroll-linked: moves the inner <img> against the scroll inside an overflow-hidden figure.
export default class Parallax extends Animation {
  setup () {
    this.media = this.element.querySelector('img')
  }

  onResize (scroll) {
    this.amount = window.innerWidth < BREAKPOINTS.tablet ? 20 : 120
    this.offset = getOffset(this.element, scroll.current)
  }

  update (scroll) {
    if (!this.offset || !this.media) return

    const top = this.offset.top - scroll.current
    const progress = clamp(map(top, window.innerHeight, -this.offset.height, 0, 1), 0, 1)
    const y = map(progress, 0, 1, -this.amount, this.amount)

    this.media.style.transform = `translate3d(0, ${y}px, 0) scale(1.2)`
  }
}
