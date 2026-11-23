import Component from '@/classes/Component'

import { normalizePath } from '@/utils/dom'

export default class Navigation extends Component {
  constructor ({ route }) {
    super({
      element: '.navigation',
      elements: {
        links: ['.navigation__link']
      }
    })

    this.onChange(route)
  }

  onChange (route) {
    this.elements.links.forEach(link => {
      const isActive = normalizePath(new URL(link.href).pathname) === route

      link.classList.toggle('navigation__link--active', isActive)

      if (isActive) {
        link.setAttribute('aria-current', 'page')
      } else {
        link.removeAttribute('aria-current')
      }
    })
  }
}
