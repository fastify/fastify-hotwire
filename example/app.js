'use strict'

const { join } = require('path')
const fastify = require('fastify')({
  logger: {
    prettyPrint: true
  }
})
const shortid = require('shortid')

const db = new Map()

fastify.register(require('fastify-formbody'))
fastify.register(require('fastify-websocket'), {
  clientTracking: true
})

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
  req.log.info(`creating new message with id ${id}`)

  const turboStream = await reply.turboSocket.append(
    'message.svelte',
    'messages',
    { message: { id, text: req.body.content } }
  )

  for (const socket of fastify.websocketServer.clients.values()) {
    socket.send(turboStream)
  }

  return { acknowledged: true }
})

fastify.get('/message/:id/delete', async (req, reply) => {
  const { id } = req.params
  req.log.info(`deleting message ${id}`)
  db.delete(id)
  return reply.turboStream.remove(
    'message.svelte',
    `message_frame_${id}`,
    { message: { id } }
  )
})

fastify.get('/ws', { websocket: true }, (connection, req) => {
  req.log.info('new websocket connection')
})

fastify.listen(3000, console.log)
