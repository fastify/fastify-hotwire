'use strict'

const { join } = require('path')
const fp = require('fastify-plugin')
const Piscina = require('piscina')

async function hotwire (fastify, opts) {
  const { templates } = opts
  delete opts.templates

  const pool = new Piscina(opts)

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
    file = join(templates, file)
    const html = await pool.runTask({ file, data, fragment: false })
    this.type('text/html; charset=utf-8')
    this.send(html)
    return this
  }

  async function turboSend (that, action, file, target, data) {
    const html = await pool.runTask({ file: join(templates, file), data, fragment: true })
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
