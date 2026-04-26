import fastify, { FastifyInstance } from 'fastify'
import hotwire from '..'
import { join } from 'node:path'
import { expect } from 'tstyche'

const app: FastifyInstance = fastify()
app.register(hotwire, {
  templates: join(__dirname, 'example', 'views'),
  filename: join(__dirname, 'example', 'worker.js')
})

app.get('/stream', async (_req, reply) => {
  expect(
    reply.turboStream.append('file', 'target', { hello: 'world' })
  ).type.toBeAssignableTo<typeof reply>()

  return reply.turboStream.append('file', 'target', { hello: 'world' })
})

app.get('/generate', async (_req, reply) => {
  const fragment = await reply.turboGenerate.append('file', 'target', { hello: 'world' })
  expect(fragment).type.toBe<string>()
})
