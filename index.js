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
        append: (file, target, data) => turboSend(this, 'append', file, target, data),
        prepend: (file, target, data) => turboSend(this, 'prepend', file, target, data),
        replace: (file, target, data) => turboSend(this, 'replace', file, target, data),
        update: (file, target, data) => turboSend(this, 'update', file, target, data),
        remove: (file, target, data) => turboSend(this, 'remove', file, target, data)
      }
    }
  })
  fastify.decorateReply('turboSocket', {
    getter () {
      return {
        append: (file, target, data) => turboSendSocket(this, 'append', file, target, data),
        prepend: (file, target, data) => turboSendSocket(this, 'prepend', file, target, data),
        replace: (file, target, data) => turboSendSocket(this, 'replace', file, target, data),
        update: (file, target, data) => turboSendSocket(this, 'update', file, target, data),
        remove: (file, target, data) => turboSendSocket(this, 'remove', file, target, data)
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
    that.send(buildStream(action, target, html.trim()))
    return that
  }

  async function turboSendSocket (that, action, file, target, data) {
    const html = await pool.runTask({ file: join(templates, file), data, fragment: true })
    return buildStream(action, target, html).replace(/\n/g, '').trim()
  }
}

function buildStream (action, target, content) {
  return `
  <turbo-stream action="${action}" target="${target}">
    <template>
      ${content}
    </template>
  </turbo-stream>
`
}

module.exports = fp(hotwire)
