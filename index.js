'use strict'

const { join } = require('path')
const fp = require('fastify-plugin')
const Piscina = require('piscina')

async function hotwire (fastify, opts) {
  const { dir } = opts
  const pool = new Piscina({
    filename: './worker.js'
  })

  fastify.decorateReply('render', render)
  fastify.decorateReply('turboStream', {
    getter () {
      return {
        append: async (file, target, data) => {
          return turboSend(this, 'append', file, target, data)
        },
        prepend: async (file, target, data) => {
          return turboSend(this, 'prepend', file, target, data)
        },
        replace: async (file, target, data) => {
          return turboSend(this, 'replace', file, target, data)
        },
        update: async (file, target, data) => {
          return turboSend(this, 'update', file, target, data)
        },
        remove: async (file, target, data) => {
          return turboSend(this, 'remove', file, target, data)
        }
      }
    }
  })

  async function render (file, data) {
    file = join(dir, file)
    const { head, html, css } = await pool.runTask({ file, data })
    // this.type('text/html; turbo-stream; charset=utf-8')
    this.type('text/html; charset=utf-8')
    this.send(`<!DOCTYPE html>
<html lang="en">
<head>
  ${head}
  ${css.code}
</head>
<body>
  ${html}
</body>
</html>`)
    return this
  }

  async function turboSend (that, action, file, target, data) {
    const { html } = await pool.runTask({ file: join(dir, file), data })
    that.type('text/vnd.turbo-stream.html; charset=utf-8')
    that.send(buildStream(action, target, html))
    return that
  }
}

function buildStream (action, target, content) {
  return `<turbo-stream action="${action}" target="${target}">
  <template>
${content}
  </template>
</turbo-stream>
`
}

module.exports = fp(hotwire)
