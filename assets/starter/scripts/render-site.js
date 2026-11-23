import fs from 'node:fs'
import path from 'node:path'

import pug from 'pug'

export function loadContent (root) {
  const file = path.join(root, 'content', 'site.json')

  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/**
 * Renders the single document. Swap loadContent for a CMS/API fetch here
 * (at build time) without touching any frontend code.
 */
export function renderSite (root) {
  const content = loadContent(root)

  return pug.renderFile(path.join(root, 'views', 'index.pug'), {
    ...content,
    basedir: path.join(root, 'views'),
    cache: false
  })
}
