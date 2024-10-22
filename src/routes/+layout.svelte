<script lang="ts">
	import "../app.pcss"
	import {Toaster} from "svelte-sonner"
</script>

<slot />
<Toaster position="top-right" richColors expand />
