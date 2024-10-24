<script lang="ts">
	import {base} from "$app/paths"
	import {BookMarked, Coffee, Pickaxe} from "lucide-svelte"
	import {logOut} from "$lib/supabase"
	import {page} from "$app/stores"
</script>

<div class="flex flex-col h-screen">
	<main class="container">
		<div class="text-center mt-36 mb-20">
			<h1 class="text-6xl font-bold">Meal Planner</h1>
			<h2 class="pt-4 text-xl">Calculate Macros | Prep Meals</h2>
		</div>
		<div class="flex justify-center gap-5">
			{#if $page.data.session?.user}
				<a href="{base}/meals" class="btn btn-lg btn-primary">Go to Plan</a>
				<button onclick={logOut} class="btn btn-lg btn-ghost">Log Out</button>
			{:else}
				<button class="btn btn-lg btn-primary">Try it Out</button>
				<!-- TODO: run signInAnonymously, then send to setup page -->
				<a href="{base}/login" class="btn btn-lg">Log In</a>
				<a href="{base}/signup" class="btn btn-lg">Sign Up</a>
			{/if}
		</div>
		<div class="flex justify-center gap-6 my-24">
			<a href="https://github.com/wmarrujo/meal-planner" class="btn"><BookMarked class="mr-2" />GitHub Repository</a>
			<a href="https://buymeacoffee.com/wmarrujo" class="btn"><Coffee class="mr-2" />Buy me a coffee</a>
			<a href="https://wmarrujo.com/projects" class="btn"><Pickaxe class="mr-2" />Other projects</a>
		</div>
	</main>
</div>
