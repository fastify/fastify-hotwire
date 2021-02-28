# fastify-hotwire

Do you enjoy writing applications with the [hotwire](http://hotwire.dev) pattern?
We got you covered!

This plugin adds all the necwessary utilis to Fastify for creating a fullstack application
with Hotwire. Take a look at the [example](./example) folder to see it in action!

## Install

```
npm i fastify-hotwire
```

## Usage

Add the plugin to Fastify, with at least two options:

- `templates`: the location of your folder with your replates
- `filename`: the location of your html generator, any templating language is supported!

```js
// in your fastify app
fastify .register(require('fastify-hotwire'), {
  templates: join(__dirname, 'views'),
  filename: join(__dirname, 'worker.js')
})
```

```js
// worker.js
module.exports = ({ file, data, fragment }) => {
  // your favorite templating library
  return 'generated html'
}
```

## API

### `reply.turboStream.*(filename, data)`

Gnerates the entire intial page, it calls the worker with `fragment: false`

```js
fastify.get('/', async (req, reply) => {
  return reply.render('filename', { data })
})
```

### `reply.turboGenerate.*(filename, target, data)`

Every turbo stream action is supported: `append`, `prepend`, `replace`, `update`, `remove`.
It generates and returns a turbo compatible fragment.

```js
fastify.get('/', async (req, reply) => {
  const fragment = await reply.turboGenerate.append('filename', 'target', { data })
  // send it via SSE or websockets
})
```

### `reply.render(filename, target, data)`

Every turbo stream action is supported: `append`, `prepend`, `replace`, `update`, `remove`.
It generates and send a turbo compatible fragment and configures the appropriate content type.

```js
fastify.get('/', async (req, reply) => {
  return reply.turboStream.append('filename', 'target', { data })
})
```

## License

[MIT](./LICENSE)