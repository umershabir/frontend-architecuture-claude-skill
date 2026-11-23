// Minimal browser-safe emitter (Node's `events` is not available in browser bundles).
export default class EventEmitter {
  #listeners = {}

  on (event, callback) {
    (this.#listeners[event] ||= []).push(callback)

    return this
  }

  once (event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      callback(...args)
    }

    return this.on(event, wrapper)
  }

  off (event, callback) {
    if (!event) {
      this.#listeners = {}
    } else if (!callback) {
      delete this.#listeners[event]
    } else {
      this.#listeners[event] = (this.#listeners[event] || []).filter(listener => listener !== callback)
    }

    return this
  }

  emit (event, ...args) {
    (this.#listeners[event] || []).slice().forEach(listener => listener(...args))

    return this
  }
}
