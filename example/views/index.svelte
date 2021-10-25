<svelte:head>
  <title>demo app</title>
  <script src="https://unpkg.com/@hotwired/turbo@7.0.1/dist/turbo.es2017-umd.js"></script>
  <script>
    Turbo.connectStreamSource(new WebSocket(`ws://${document.location.host}/ws`))
  </script>
</svelte:head>

<script>
  import Message from './message.svelte'
  import Toast from './toast.svelte'

  export let messages
  export let username
</script>

<main>
  <p>Welcome, {username}</p>
  <Toast />
  <h1>Current messages</h1>
  <div id="messages">
    {#each messages as message}
      <Message message={message} />
    {/each}
  </div>

  <turbo-frame id="new_message" target="_top">
    <form action="/message" method="POST" style="margin-top: 40px">
      <input name="content" type="text" />
      <button type="submit">Create New Message</button>
    </form>
  </turbo-frame>
</main>
