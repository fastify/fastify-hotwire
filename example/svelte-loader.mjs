import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile } from 'svelte/compiler'

// Svelte 5 dropped the `svelte/register` CJS require-hook and its compiler
// only emits ESM, so `.svelte` files can no longer be `require()`-d directly.
// This module customization hook (see Node's `module.register()`) compiles
// `.svelte` files to server-side JS on the fly, keeping their original file
// URLs so relative imports between components (e.g. `./message.svelte`)
// keep resolving normally.
export function load (url, context, nextLoad) {
  const [bareUrl] = url.split('?')
  if (!bareUrl.endsWith('.svelte')) {
    return nextLoad(url, context)
  }

  const filename = fileURLToPath(bareUrl)
  const source = readFileSync(filename, 'utf8')
  const { js } = compile(source, { filename, generate: 'server' })

  return {
    format: 'module',
    source: js.code,
    shortCircuit: true
  }
}
