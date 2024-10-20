<script lang="ts">
	import {BookMarked, Coffee, Pickaxe} from "lucide-svelte"
</script>

<div class="flex flex-col h-screen">
	<main class="container">
		<div class="text-center my-36">
			<h1 class="text-6xl font-bold">Meal Planner</h1>
			<h2 class="pt-4 text-xl">Calculate Macros | Prep Meals</h2>
		</div>
		<div class="flex justify-center gap-6 my-24">
			<a href="https://github.com/wmarrujo/meal-planner" class="btn"><BookMarked class="mr-2" />GitHub Repository</a>
			<a href="https://buymeacoffee.com/wmarrujo" class="btn"><Coffee class="mr-2" />Buy me a coffee</a>
			<a href="https://wmarrujo.com/projects" class="btn"><Pickaxe class="mr-2" />Other projects</a>
		</div>
	</main>
</div>
