import Component from '@/classes/Component'

/**
 * Base for `data-animation="name"` behaviours. Page creates one per element and drives it:
 *
 *   setup()            once, before anything else — split text, query children
 *   enable()/disable() when the page shows/hides — starts/stops in-view detection
 *   onResize(scroll)   after layout changes — measure here (add scroll.current to rect.top)
 *   update(scroll)     every frame while the page is active — scroll-linked effects
 *   animateIn/Out()    when the target enters/leaves the viewport
 *
 * Optional attribute: data-animation-target=".selector" observes the closest ancestor instead.
 */
export default class Animation extends Component {
  create () {
    super.create()

    this.isEnabled = false
    this.isVisible = false

    const { animationTarget } = this.element.dataset

    this.target = animationTarget ? this.element.closest(animationTarget) : this.element

    this.setup()

    this.observer = new window.IntersectionObserver(this.onIntersect, { threshold: 0.1 })
  }

  setup () {}

  enable () {
    if (this.isEnabled) return

    this.isEnabled = true

    this.animateOut()
    this.observer.observe(this.target)
  }

  disable () {
    this.isEnabled = false

    this.observer.unobserve(this.target)
  }

  onIntersect (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.isVisible) {
        this.animateIn()
      } else if (!entry.isIntersecting && this.isVisible) {
        this.animateOut()
      }
    })
  }

  animateIn () {
    this.isVisible = true
  }

  animateOut () {
    this.isVisible = false
  }

  onResize (scroll) {}

  update (scroll) {}

  destroy () {
    super.destroy()

    this.observer.disconnect()
  }
}
