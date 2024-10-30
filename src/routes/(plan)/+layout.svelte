<script lang="ts">
	import {base} from "$app/paths"
	import {page} from "$app/stores"
	import {logOut} from "$lib/supabase"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {children} = $props()
</script>

<div>
	<nav class="gap-2 navbar">
		<h1><a href="{base}/" class="btn btn-ghost">Meal-Planner</a></h1>
		<ul class="flex gap-2">
			<li><a href="{base}/people" class="btn btn-ghost {$page.route.id?.startsWith("/people") && "underline"}">People</a></li>
			<li><a href="{base}/dishes" class="btn btn-ghost {$page.route.id?.startsWith("/dishes") && "underline"}">Dishes</a></li>
			<li><a href="{base}/meals" class="btn btn-ghost {$page.route.id?.startsWith("/meals") && "underline"}">Meals</a></li>
		</ul>
		<div class="grow"></div>
		{#if $page.data.session?.user}
			<button onclick={logOut} class="btn btn-ghost">Log Out</button>
		{:else}
			<a href="{base}/signup" class="btn btn-ghost">Sign Up</a>
		{/if}
	</nav>
	{@render children()}
</div>
