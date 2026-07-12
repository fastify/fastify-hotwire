'use strict'

const { readFileSync, statSync } = require('node:fs')
const { register } = require('node:module')
const { pathToFileURL } = require('node:url')
const { compile } = require('svelte/compiler')
const { render } = require('svelte/server')

// Compiles .svelte files to server-side JS on the fly (see svelte-loader.mjs
// for why this is needed under Svelte 5), then lets Node's normal ESM
// resolution take over so relative imports between components keep working.
register('./svelte-loader.mjs', pathToFileURL(__filename))

// Svelte 5's SSR output wraps blocks in hydration marker comments
// (e.g. `<!--[-->`, `<!--]-->`, `<!--[0-->`). They're only useful when the
// same component is later hydrated client-side; since Hotwire only ever
// swaps static HTML via Turbo, we strip them out.
const HYDRATION_MARKERS = /<!--\[-?\d*-->|<!--\]-->/g

const cache = new Map()

async function loadComponent (file) {
  const { mtimeMs } = statSync(file)
  const cached = cache.get(file)
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached
  }

  // dynamic import is cached by Node per URL, so bust it with a query
  // string whenever the file changes on disk
  const url = `${pathToFileURL(file).href}?v=${mtimeMs}`
  const { default: Component } = await import(url)

  const source = readFileSync(file, 'utf8')
  const { css } = compile(source, { filename: file, generate: 'server' })

  const entry = { Component, css: css?.code ?? '', mtimeMs }
  cache.set(file, entry)
  return entry
}

module.exports = async ({ file, data, fragment }) => {
  const { Component, css } = await loadComponent(file)
  const { head, body } = render(Component, { props: data })
  const html = body.replace(HYDRATION_MARKERS, '')

  if (fragment) {
    return html
  }

  return buildHtmlPage(head, css, html)
}

function buildHtmlPage (head, css, html) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    ${head}
    <style>${css}</style>
  </head>
  <body>
    ${html}
  </body>
  </html>`
}
