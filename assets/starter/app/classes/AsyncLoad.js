/**
 * Lazy-loads a DOM <img data-src> when it nears the viewport, then adds `.loaded`
 * (CSS fades it in). Not for WebGL placeholders — those use data-gl-src.
 */
export default class AsyncLoad {
  constructor ({ element }) {
    this.element = element

    this.observer = new window.IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return

      this.load()
      this.observer.disconnect()
    }, { rootMargin: '50% 0px' })

    this.observer.observe(this.element)
  }

  load () {
    this.element.onload = () => this.element.classList.add('loaded')
    this.element.src = this.element.dataset.src
  }

  destroy () {
    this.observer.disconnect()
  }
}
