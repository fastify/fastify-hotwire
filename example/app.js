'use strict'

const { join } = require('node:path')
const fastify = require('fastify')({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
})
const superheroes = require('superheroes')
const shortid = require('shortid')
// you can use any queue system for delivering a message
// across multiple server instances, see http://npm.im/mqemitter.
const mq = require('mqemitter')
const emitter = mq({ concurrency: 5 })

// our database
const db = new Map()

fastify
  // remember to configure the content security policy as well!
  .decorateRequest('user', null)
  .register(require('@fastify/cookie'), { secret: 'supersecret' })
  .register(require('@fastify/formbody'))
  .register(require('@fastify/websocket'), { clientTracking: true })
  .register(require('..'), {
    templates: join(__dirname, 'views'),
    filename: join(__dirname, 'worker.js')
  })

// every time we have a new message, let's broadcast it
emitter.on('new-message', (message, cb) => {
  for (const socket of fastify.websocketServer.clients.values()) {
    socket.send(message.payload)
  }
})

emitter.on('delete-message', (message, cb) => {
  for (const socket of fastify.websocketServer.clients.values()) {
    socket.send(message.payload)
  }
})

// render the initial page and populate it
// with the current content
fastify.get('/', async (req, reply) => {
  const messages = []
  for (const [id, message] of db.entries()) {
    messages.push({ id, text: message.text, user: message.user })
  }

  // generate the user
  const username = `${superheroes.random()}-${shortid.generate()}`
  reply.setCookie('user', username, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: true,
    path: '/',
    signed: true
  })

  return reply.render('index.svelte', { messages, username })
})

// post a new message!
fastify.route({
  method: 'POST',
  path: '/message',
  onRequest: authorize,
  handler: onCreateMessage
})

async function onCreateMessage (req, reply) {
  const id = shortid.generate()
  req.log.info(`creating new message with id ${id} from user ${req.user}`)

  db.set(id, {
    text: req.body.content,
    user: req.user
  })
  const payload = await reply.turboGenerate.append(
    'message.svelte',
    'messages',
    {
      message: {
        id,
        text: req.body.content,
        user: req.user
      }
    }
  )

  emitter.emit({
    topic: 'new-message',
    payload
  })

  return { acknowledged: true }
}

// delete a message, users can only delete
// their own messages
fastify.route({
  method: 'POST',
  path: '/message/:id/delete',
  onRequest: authorize,
  handler: onDeleteMessage
})

async function onDeleteMessage (req, reply) {
  // in production ensure to validate or sanitize the user provided id
  const { id } = req.params
  req.log.info(`deleting message ${id}`)
  if (!db.has(id)) {
    return reply.turboStream.replace(
      'toast.svelte',
      'toast',
      { text: `The message with id ${id} does not exists` }
    )
  }

  const message = db.get(id)
  if (message.user !== req.user) {
    return reply.turboStream.replace(
      'toast.svelte',
      'toast',
      { text: 'You can\'t delete a message from another user' }
    )
  }

  db.delete(id)

  const payload = await reply.turboGenerate.remove(
    'message.svelte',
    `message_frame_${id}`,
    { message: { id } }
  )

  emitter.emit({
    topic: 'delete-message',
    payload
  })

  return { acknowledged: true }
}

// remove a toast
fastify.route({
  method: 'POST',
  path: '/toast/ack',
  onRequest: authorize,
  handler: onAckToast
})

async function onAckToast (req, reply) {
  return reply.turboStream.remove('toast.svelte', 'toast')
}

// websocket handler used by turbo for handling realtime communications
fastify.get('/ws', { websocket: true }, (connection, req) => {
  req.log.info('new websocket connection')
})

// authenticate client requests
async function authorize (req, reply) {
  const { user } = req.cookies
  if (!user) {
    reply.code(401)
    throw new Error('Missing session cookie')
  }

  const cookie = req.unsignCookie(user)
  if (!cookie.valid) {
    reply.code(401)
    throw new Error('Invalid cookie signature')
  }

  req.user = cookie.value
}

fastify.listen({ port: 3000 }, console.log)
