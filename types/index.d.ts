/// <reference types="node" />

import { FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyReply {
    render(file: string, data: any): FastifyReply

    turboGenerate: {
      append(file: string, target: string, data: any): Promise<string>
      prepend(file: string, target: string, data: any): Promise<string>
      replace(file: string, target: string, data: any): Promise<string>
      update(file: string, target: string, data: any): Promise<string>
      remove(file: string, target: string, data: any): Promise<string>
    }

    turboStream: {
      append(file: string, target: string, data: any): FastifyReply
      prepend(file: string, target: string, data: any): FastifyReply
      replace(file: string, target: string, data: any): FastifyReply
      update(file: string, target: string, data: any): FastifyReply
      remove(file: string, target: string, data: any): FastifyReply
    }
  }
}

type FastifyHotwire = FastifyPluginAsync<NonNullable<fastifyHotwire.FastifyHotwireOptions>>

declare namespace fastifyHotwire {
  export interface FastifyHotwireOptions {
    templates: string
    filename: string
  }

  export const fastifyHotwire: FastifyHotwire
  export { fastifyHotwire as default }
}

declare function fastifyHotwire (...params: Parameters<FastifyHotwire>): ReturnType<FastifyHotwire>
export = fastifyHotwire
