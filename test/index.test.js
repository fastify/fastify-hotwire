'use strict'

const { join } = require('node:path')
const { test } = require('node:test')
const Fastify = require('fastify')
const Hotwire = require('..')

test('Should render the entire page', async t => {
  const fastify = Fastify()
  await fastify.register(Hotwire, {
    templates: join(__dirname, '..', 'example', 'views'),
    filename: join(__dirname, '..', 'example', 'worker.js')
  })

  fastify.get('/', async (_req, reply) => {
    return reply.render('index.svelte', { messages: [], username: 'foobar' })
  })

  const response = await fastify.inject({
    method: 'GET',
    path: '/'
  })

  t.assert.strictEqual(response.statusCode, 200)
  t.assert.strictEqual(response.headers['content-type'], 'text/html; charset=utf-8')
  t.assert.ok(response.payload.includes('foobar'))
})

function runTurboStream (action) {
  test(`Should return a turbo fragment (${action})`, async t => {
    const fastify = Fastify()
    await fastify.register(Hotwire, {
      templates: join(__dirname, '..', 'example', 'views'),
      filename: join(__dirname, '..', 'example', 'worker.js')
    })

    fastify.get('/', async (_req, reply) => {
      return reply.turboStream[action](
        'message.svelte',
        'messages',
        {
          message: {
            id: 'unique',
            text: 'hello world',
            user: 'foobar'
          }
        }
      )
    })

    const response = await fastify.inject({
      method: 'GET',
      path: '/'
    })

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(response.headers['content-type'], 'text/vnd.turbo-stream.html; charset=utf-8')
    t.assert.strictEqual(response.payload.replace(/\n/g, '').trim(), `<turbo-stream action="${action}" target="messages">    <template>      <turbo-frame id="message_frame_unique"><p><strong>foobar:</strong> hello world</p>  <form action="/message/unique/delete" method="POST"><button type="submit">Remove</button></form></turbo-frame>    </template>  </turbo-stream>`)
  })
}

function runTurboGenerate (action) {
  test(`Should generate a turbo fragment (${action})`, async t => {
    const fastify = Fastify()
    await fastify.register(Hotwire, {
      templates: join(__dirname, '..', 'example', 'views'),
      filename: join(__dirname, '..', 'example', 'worker.js')
    })

    fastify.get('/', async (_req, reply) => {
      reply.type('text/plain')
      return reply.turboGenerate[action](
        'message.svelte',
        'messages',
        {
          message: {
            id: 'unique',
            text: 'hello world',
            user: 'foobar'
          }
        }
      )
    })

    const response = await fastify.inject({
      method: 'GET',
      path: '/'
    })

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(response.headers['content-type'], 'text/plain')
    t.assert.strictEqual(response.payload, `<turbo-stream action="${action}" target="messages">    <template>      <turbo-frame id="message_frame_unique"><p><strong>foobar:</strong> hello world</p>  <form action="/message/unique/delete" method="POST"><button type="submit">Remove</button></form></turbo-frame>    </template>  </turbo-stream>`)
  })
}

const actions = ['append', 'prepend', 'replace', 'update', 'remove']
for (const action of actions) {
  runTurboStream(action)
  runTurboGenerate(action)
}
