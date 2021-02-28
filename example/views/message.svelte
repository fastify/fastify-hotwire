<script>
  export let message
</script>

<turbo-frame id="message_frame_{message.id}">
  <p><strong>{message.user}:</strong> {message.text}</p>

  <form action="/message/{message.id}/delete" method="POST">
    <button type="submit">Remove</button>
  </form>
</turbo-frame>
