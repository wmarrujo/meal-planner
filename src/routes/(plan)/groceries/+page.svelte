<script lang="ts">
	import {getContext, onMount} from "svelte"
	import {type Household} from "$lib/cache.svelte"
	import {calculateHousehold} from "$lib/calculations"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => {
		const solution = home ? calculateHousehold(home) : undefined
		console.log(solution)
	})
</script>

<h1>Groceries</h1>
