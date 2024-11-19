<script lang="ts">
	import {getContext, onMount} from "svelte"
	import {type Household} from "$lib/cache.svelte"
	import {calculateHousehold} from "$lib/solver"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => { if (home && !home.solution) { home.solution = calculateHousehold(home) }})
</script>

<h1>Cooking</h1>
{#if home?.solution}
	<span>Solution!</span>
{/if}
