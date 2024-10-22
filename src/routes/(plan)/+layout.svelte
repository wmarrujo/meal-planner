<script lang="ts">
	import {base} from "$app/paths"
	import {page} from "$app/stores"
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
		<a href="{base}/login" class="btn btn-ghost">Log In</a>
	</nav>
	<main>
		<slot />
	</main>
</div>
