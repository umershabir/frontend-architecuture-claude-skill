import Page from '@/classes/Page'

// Not scrollable: wheel/drag drive the WebGL gallery (components/Canvas/Home) instead.
export default class Home extends Page {
  constructor () {
    super({
      id: 'home',
      element: '.home',
      isScrollable: false
    })
  }
}
