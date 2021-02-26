'use strict'

require('svelte/register')

module.exports = ({ file, data, fragment }) => {
  const App = require(file).default
  const { head, css, html } = App.render(data)
  if (fragment) {
    return html
  } else {
    return buildHtmlPage(head, css, html)
  }
}

function buildHtmlPage (head, css, html) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    ${head}
    ${css.code}
  </head>
  <body>
    ${html}
  </body>
  </html>`
}
