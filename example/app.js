'use strict'

const { join } = require('path')
const fastify = require('fastify')()
const shortid = require('shortid')

const db = new Map()

fastify.register(require('fastify-formbody'))

fastify.register(require('..'), {
  templates: join(__dirname, 'views'),
  filename: join(__dirname, 'worker.js')
})

fastify.get('/', async (req, reply) => {
  const messages = []
  for (const [id, text] of db.entries()) {
    messages.push({ id, text })
  }
  return reply.render('index.svelte', { messages })
})

fastify.post('/message', async (req, reply) => {
  const id = shortid.generate()
  db.set(id, req.body.content)

  return reply.turboStream.append(
    'message.svelte',
    'messages',
    { message: { id, text: req.body.content } }
  )
})

fastify.get('/message/:id/delete', async (req, reply) => {
  const { id } = req.params
  db.delete(id)
  return reply.turboStream.remove(
    'message.svelte',
    `message_frame_${id}`,
    { message: { id } }
  )
})

fastify.listen(3000, console.log)
