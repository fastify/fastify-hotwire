'use strict'

const { join } = require('path')
const { test } = require('tap')
const Fastify = require('fastify')
const Hotwire = require('./')

test('Should render the entire page', async t => {
  const fastify = Fastify()
  fastify.register(Hotwire, {
    templates: join(__dirname, 'example', 'views'),
    filename: join(__dirname, 'example', 'worker.js')
  })

  fastify.get('/', async (req, reply) => {
    return reply.render('index.svelte', { messages: [], username: 'foobar' })
  })

  const response = await fastify.inject({
    method: 'GET',
    path: '/'
  })

  t.strictEqual(response.statusCode, 200)
  t.match(response.headers, { 'content-type': 'text/html; charset=utf-8' })
  t.true(response.payload.includes('foobar'))
})

test('Should return a turbo fragment', async t => {
  const fastify = Fastify()
  fastify.register(Hotwire, {
    templates: join(__dirname, 'example', 'views'),
    filename: join(__dirname, 'example', 'worker.js')
  })

  fastify.get('/', async (req, reply) => {
    return reply.turboStream.replace(
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

  t.strictEqual(response.statusCode, 200)
  t.match(response.headers, { 'content-type': 'text/vnd.turbo-stream.html; charset=utf-8' })
  t.strictEqual(response.payload, `
  <turbo-stream action="replace" target="messages">
    <template>
      <turbo-frame id="message_frame_unique"><p><strong>foobar:</strong> hello world</p>

  <form action="/message/unique/delete" method="POST"><button type="submit">Remove</button></form></turbo-frame>
    </template>
  </turbo-stream>
`)
})

test('Should generate a turbo fragment', async t => {
  const fastify = Fastify()
  fastify.register(Hotwire, {
    templates: join(__dirname, 'example', 'views'),
    filename: join(__dirname, 'example', 'worker.js')
  })

  fastify.get('/', async (req, reply) => {
    reply.type('text/plain')
    return reply.turboGenerate.replace(
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

  t.strictEqual(response.statusCode, 200)
  t.match(response.headers, { 'content-type': 'text/plain' })
  t.strictEqual(response.payload, '<turbo-stream action="replace" target="messages">    <template>      <turbo-frame id="message_frame_unique"><p><strong>foobar:</strong> hello world</p>  <form action="/message/unique/delete" method="POST"><button type="submit">Remove</button></form></turbo-frame>    </template>  </turbo-stream>')
})
