<script>
  export let text
</script>

<turbo-frame id="toast">
  {#if text}
     <p style="color: red">{text}</p>

    <form action="/toast/ack" method="POST">
      <button type="submit">Ok!</button>
    </form>
  {/if}
</turbo-frame>
