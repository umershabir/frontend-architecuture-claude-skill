/**
 * Resolves a map of child selectors inside `root`.
 * string → first match or null; ['selector'] → Array of matches; nodes/arrays of nodes pass through.
 */
export function resolveElements (root, map) {
  const elements = {}

  Object.entries(map).forEach(([key, entry]) => {
    if (typeof entry === 'string') {
      elements[key] = root.querySelector(entry)
    } else if (Array.isArray(entry) && typeof entry[0] === 'string') {
      elements[key] = Array.from(root.querySelectorAll(entry[0]))
    } else {
      elements[key] = entry
    }
  })

  return elements
}

/**
 * Document-relative box. Pass the current virtual scroll so measurements taken
 * while the wrapper is translated still resolve to the same position.
 */
export function getOffset (element, scroll = 0) {
  const { height, left, top, width } = element.getBoundingClientRect()

  return { height, left, top: top + scroll, width }
}

export function normalizePath (pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
}
