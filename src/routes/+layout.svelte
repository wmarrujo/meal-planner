<script lang="ts">
	import "../app.pcss"
	import {Toaster} from "svelte-sonner"
	import {ModeWatcher, mode} from "mode-watcher"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {children} = $props()
	
	$effect(() => document.documentElement.setAttribute("data-theme", $mode == "dark" ? "dracula" : "retro"))
</script>

<ModeWatcher />
{@render children()}
<Toaster position="top-right" richColors expand />
