import autoBind from 'auto-bind'

import EventEmitter from '@/utils/EventEmitter'
import { resolveElements } from '@/utils/dom'

/**
 * Base for every DOM-bound class.
 *
 *   new X({ element: '.block', elements: { title: '.block__title', items: ['.block__item'] } })
 *
 * - `element`: selector or node (the root).
 * - `elements`: string → single node (or null); ['selector'] → Array of nodes; nodes pass through.
 * - All methods are auto-bound, so they can be passed as listeners directly.
 *
 * Lifecycle runs from this constructor: create() → addEventListeners().
 * Subclass constructor code runs AFTER create(), so put setup that create() needs
 * into options or into an overridden create(); avoid class-field initializers.
 */
export default class Component extends EventEmitter {
  constructor (options = {}) {
    super()

    autoBind(this)

    this.options = options
    this.classes = { ...options.classes }
    this.selector = options.element
    this.selectorChildren = { ...options.elements }

    this.create()
    this.addEventListeners()
  }

  create () {
    this.element = this.selector instanceof window.Element
      ? this.selector
      : document.querySelector(this.selector)

    if (!this.element) {
      throw new Error(`${this.constructor.name}: root "${this.selector}" not found`)
    }

    this.elements = resolveElements(this.element, this.selectorChildren)
  }

  addEventListeners () {}

  removeEventListeners () {}

  destroy () {
    this.removeEventListeners()
    this.off()
  }
}
