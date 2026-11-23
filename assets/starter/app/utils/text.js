/**
 * Wraps each word in `<span class="word"><span class="word__inner">`, keeping <br>.
 * Idempotent: calling it again returns the existing spans instead of nesting.
 * Plain text + <br> only — inline tags (<a>, <strong>) need a node-walking splitter.
 */
export function splitWords (element) {
  if (element.dataset.split !== 'words') {
    const lines = element.innerHTML.trim().split(/<br\s*\/?>/i)

    element.innerHTML = lines
      .map(line => line.trim().split(/\s+/).filter(Boolean)
        .map(word => `<span class="word"><span class="word__inner">${word}</span></span>`)
        .join(' '))
      .join('<br>')

    element.dataset.split = 'words'
  }

  return Array.from(element.querySelectorAll('.word__inner'))
}

/**
 * Groups word spans into visual lines by their box top. Re-run on resize.
 */
export function calculateLines (words) {
  const lines = []
  let top = null

  words.forEach(word => {
    const offset = word.parentElement.offsetTop

    if (offset !== top) {
      lines.push([])
      top = offset
    }

    lines[lines.length - 1].push(word)
  })

  return lines
}
