'use strict'

const { join } = require('path')
const fastify = require('fastify')()

fastify.register(require('fastify-formbody'))

fastify.register(require('..'), {
  dir: join(__dirname, 'views')
})

fastify.get('/', async (req, reply) => {
  return reply.render('index.svelte', { messages: [] })
})

fastify.post('/message', async (req, reply) => {
  return reply.turboStream.append(
    'message.svelte',
    'messages',
    { message: req.body.content }
  )
})

fastify.listen(3000, console.log)
