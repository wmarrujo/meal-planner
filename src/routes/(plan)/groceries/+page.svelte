<script lang="ts">
	import {getContext, onMount} from "svelte"
	import {type Household} from "$lib/cache.svelte"
	import {makeModels} from "$lib/calculations"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => {
		const models = home ? makeModels(home) : undefined
		console.log("models", models) // DEBUG
	})
</script>

<h1>Groceries</h1>
