import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'

import { loadContent, renderSite } from './scripts/render-site.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const watched = ['views', 'content'].map(dir => path.join(root, dir))

/**
 * Replaces index.html with views/index.pug rendered against content/site.json.
 * This is the whole "backend": one document containing every page.
 */
function siteRenderer () {
  let outDir

  return {
    name: 'site-renderer',

    configResolved (config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },

    transformIndexHtml: {
      order: 'pre',
      handler: () => renderSite(root)
    },

    configureServer (server) {
      server.watcher.add(watched)

      const reload = file => {
        if (watched.some(dir => path.resolve(file).startsWith(dir))) {
          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('change', reload)
      server.watcher.on('add', reload)
    },

    // Static hosts without SPA rewrites: write the same document at every route.
    closeBundle () {
      const index = path.join(outDir || '', 'index.html')

      if (!outDir || !fs.existsSync(index)) return

      const html = fs.readFileSync(index, 'utf8')
      const { routes = [] } = loadContent(root)

      routes.filter(route => route !== '/').forEach(route => {
        const file = path.join(outDir, route, 'index.html')

        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, html)
      })
    }
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(root, 'app')
    }
  },

  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  },

  plugins: [siteRenderer()]
})
