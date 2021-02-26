<script>
  export let message
</script>

<turbo-frame id="message_frame_{message.id}">
  <p>{message.text}</p>

  <form action="/message/{message.id}/delete" method="GET">
    <button type="submit">Remove</button>
  </form>
</turbo-frame>
