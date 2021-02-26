'use strict'

require('svelte/register')

module.exports = ({ file, data }) => {
  const App = require(file).default
  return App.render(data)
}
