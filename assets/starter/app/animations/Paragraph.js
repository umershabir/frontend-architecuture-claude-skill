import Animation from '@/classes/Animation'

import { EASE_CSS } from '@/utils/constants'
import { calculateLines, splitWords } from '@/utils/text'

// Line-by-line reveal: words slide up out of an overflow-hidden mask, staggered per visual line.
export default class Paragraph extends Animation {
  setup () {
    this.words = splitWords(this.element)
    this.lines = []
  }

  onResize () {
    this.lines = calculateLines(this.words)
  }

  animateIn () {
    super.animateIn()

    if (!this.lines.length) this.onResize()

    this.lines.forEach((line, index) => {
      line.forEach(word => {
        word.style.transition = `transform 1.2s ${index * 0.1}s ${EASE_CSS}`
        word.style.transform = 'translate3d(0, 0, 0)'
      })
    })
  }

  animateOut () {
    super.animateOut()

    this.words.forEach(word => {
      word.style.transition = 'none'
      word.style.transform = 'translate3d(0, 100%, 0)'
    })
  }
}
