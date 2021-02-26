<script>
  export let message
</script>

<turbo-frame id="message_frame_{message.id}">
  <p>{message.text}</p>
</turbo-frame>
