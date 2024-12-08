import fastify, { FastifyInstance } from 'fastify'
import hotwire from '..'
import { join } from 'path'
import { expectType } from 'tsd'

const app: FastifyInstance = fastify()
app.register(hotwire, {
  templates: join(__dirname, 'example', 'views'),
  filename: join(__dirname, 'example', 'worker.js')
})

app.get('/stream', async (req, reply) => {
  return reply.turboStream.append('file', 'target', { hello: 'world' })
})

app.get('/generate', async (req, reply) => {
  const fragment = await reply.turboGenerate.append('file', 'target', { hello: 'world' })
  expectType<string>(fragment)
})
